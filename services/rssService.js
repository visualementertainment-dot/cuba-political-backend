const Parser = require('rss-parser');
const cron = require('node-cron');
const Article = require('../models/Article');
const Source = require('../models/Source');

class RSSService {
  constructor() {
    this.parser = new Parser({
      headers: {
        'User-Agent': 'CubaPoliticalBot/1.0'
      },
      timeout: 10000
    });
    this.activeJobs = new Map(); // Para almacenar tareas programadas
  }

  async fetchAndSaveArticles(source) {
    try {
      console.log(`📡 Obteniendo RSS de: ${source.name} (${source.rssUrl})`);
      
      const feed = await this.parser.parseURL(source.rssUrl);
      let newCount = 0;

      for (const item of feed.items) {
        // Verificar si ya existe por título o URL
        const exists = await Article.findOne({
          $or: [
            { title: item.title },
            { originalUrl: item.link }
          ]
        });

        if (exists) continue;

        // Detectar urgencia por palabras clave
        const urgent = this.isUrgent(item.title + ' ' + (item.contentSnippet || ''));

        // Crear el artículo
        const article = new Article({
          source: source.id,
          urgent: urgent,
          category: this.detectCategory(item.title, item.contentSnippet),
          title: item.title,
          summary: this.truncateSummary(item.contentSnippet || item.content || '', 250),
          author: item.creator || item.author || source.name,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          reads: 0,
          body: item.content || item.contentSnippet || item.title,
          originalUrl: item.link
        });

        await article.save();
        newCount++;
        console.log(`✅ Nuevo: ${item.title.substring(0, 50)}...`);
      }

      if (newCount > 0) {
        console.log(`📊 ${source.name}: ${newCount} artículos nuevos`);
      } else {
        console.log(`📌 ${source.name}: sin novedades`);
      }

    } catch (err) {
      console.error(`❌ Error en RSS de ${source.name}:`, err.message);
    }
  }

  // Detectar urgencia por palabras clave
  isUrgent(text) {
    const urgentWords = [
      'urgente', 'última hora', 'breaking', 'emergencia', 'crisis',
      'alerta', 'inmediato', 'importante', 'urge', 'grave'
    ];
    const lowerText = text.toLowerCase();
    return urgentWords.some(word => lowerText.includes(word));
  }

  // Detectar categoría
  detectCategory(title, description) {
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    const categories = {
      'Política': ['gobierno', 'asamblea', 'partido', 'elecciones', 'presidente', 'ministro', 'política'],
      'Economía': ['economía', 'negocios', 'mercado', 'precios', 'dólar', 'turismo', 'empresa'],
      'Internacional': ['eeuu', 'estados unidos', 'europa', 'rusia', 'china', 'mundo', 'internacional'],
      'Salud': ['salud', 'médico', 'hospital', 'medicina', 'vacuna', 'covid', 'enfermedad'],
      'Tecnología': ['internet', 'app', 'digital', 'software', 'web', 'móvil', 'tecnología'],
      'Cultura': ['cultura', 'arte', 'música', 'cine', 'literatura', 'teatro', 'exposición'],
      'Deportes': ['béisbol', 'fútbol', 'deporte', 'olímpico', 'medalla', 'juego']
    };

    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        return cat;
      }
    }
    return 'General';
  }

  truncateSummary(text, maxLength) {
    if (!text) return '';
    // Limpiar HTML
    const cleanText = text.replace(/<[^>]*>/g, '');
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength).trim() + '...';
  }

  // Iniciar polling para una fuente RSS
  startPolling(source, intervalMinutes = 5) {
    if (this.activeJobs.has(source.id)) {
      this.activeJobs.get(source.id).stop();
    }

    // Ejecutar inmediatamente
    this.fetchAndSaveArticles(source);

    // Programar ejecución periódica
    const cronExpression = `*/${intervalMinutes} * * * *`;
    const job = cron.schedule(cronExpression, () => {
      this.fetchAndSaveArticles(source);
    });

    this.activeJobs.set(source.id, job);
    console.log(`⏰ Polling iniciado para ${source.name} (cada ${intervalMinutes} min)`);
  }

  // Iniciar todas las fuentes RSS desde la base de datos
  async startAllFromDatabase() {
    const sources = await Source.find({ 
      rssUrl: { $ne: null, $exists: true, $ne: '' } 
    });
    
    console.log(`📡 Iniciando ${sources.length} fuentes RSS...`);
    
    for (const source of sources) {
      this.startPolling(source, source.refreshInterval || 5);
    }
  }

  // Detener una fuente específica
  stopPolling(sourceId) {
    const job = this.activeJobs.get(sourceId);
    if (job) {
      job.stop();
      this.activeJobs.delete(sourceId);
      console.log(`⏹️ Polling detenido para fuente: ${sourceId}`);
    }
  }

  // Detener todas
  stopAll() {
    for (const [id, job] of this.activeJobs) {
      job.stop();
      console.log(`⏹️ Polling detenido: ${id}`);
    }
    this.activeJobs.clear();
  }
}

module.exports = new RSSService();