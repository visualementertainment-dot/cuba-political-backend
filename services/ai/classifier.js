const News = require('../../models/News');
const logger = require('../../utils/logger');

/**
 * NOTA: Este es un clasificador simple basado en keywords.
 * Para producción, integra ML.js, TensorFlow.js, o un API de IA
 */
class Classifier {
  constructor() {
    this.categories = {
      política: ['gobierno', 'parlamento', 'elecciones', 'política', 'ley', 'decreto'],
      economía: ['economía', 'dinero', 'negocios', 'empresa', 'mercado', 'precio'],
      sociedad: ['comunidad', 'social', 'familia', 'educación', 'cultura'],
      internacional: ['mundial', 'país', 'diplomacia', 'relaciones', 'extranjero'],
      deporte: ['deporte', 'fútbol', 'beisbol', 'atleta', 'competencia', 'equipo'],
      cultura: ['arte', 'música', 'cine', 'literatura', 'teatro', 'cultural'],
      salud: ['salud', 'médico', 'enfermedad', 'hospital', 'medicina', 'coronavirus']
    };

    this.urgentKeywords = [
      'urgente', 'alerta', 'emergencia', 'crisis', 'desastre',
      'ataque', 'muerte', 'accidente', 'catástrofe', 'peligro'
    ];
  }

  /**
   * Clasifica un artículo en categoría
   * @param {Object} article - Artículo a clasificar
   * @returns {string} Categoría detectada
   */
  classifyCategory(article) {
    const text = (article.title + ' ' + article.description)
      .toLowerCase();

    let bestCategory = 'otros';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(this.categories)) {
      const score = keywords.reduce((count, keyword) => {
        return count + (text.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * Detecta nivel de urgencia
   * @param {Object} article - Artículo a evaluar
   * @returns {Object} { urgency: string, isUrgent: boolean, score: number }
   */
  detectUrgency(article) {
    const text = (article.title + ' ' + article.description)
      .toLowerCase();

    const urgentMatches = this.urgentKeywords.filter(keyword =>
      text.includes(keyword)
    ).length;

    let urgency = 'baja';
    let score = 0;

    if (urgentMatches >= 3) {
      urgency = 'crítica';
      score = 0.95;
    } else if (urgentMatches === 2) {
      urgency = 'alta';
      score = 0.75;
    } else if (urgentMatches === 1) {
      urgency = 'media';
      score = 0.5;
    }

    return {
      urgency,
      isUrgent: urgency === 'alta' || urgency === 'crítica',
      score
    };
  }

  /**
   * Extrae tags del contenido
   * @param {Object} article - Artículo
   * @returns {Array<string>} Tags detectados
   */
  extractTags(article) {
    const text = (article.title + ' ' + article.description)
      .toLowerCase();

    const allKeywords = Object.values(this.categories)
      .flat()
      .concat(this.urgentKeywords);

    const tags = allKeywords
      .filter(keyword => text.includes(keyword))
      .slice(0, 5); // Máximo 5 tags

    return [...new Set(tags)]; // Eliminar duplicados
  }

  /**
   * Procesa un artículo para clasificación completa
   * @param {Object} article - Artículo de MongoDB
   * @returns {Promise<Object>} Artículo clasificado
   */
  async processArticle(article) {
    try {
      const category = this.classifyCategory(article);
      const urgency = this.detectUrgency(article);
      const tags = this.extractTags(article);

      const updatedArticle = await News.findByIdAndUpdate(
        article._id,
        {
          category,
          urgency: urgency.urgency,
          isUrgent: urgency.isUrgent,
          tags,
          confidenceScore: urgency.score
        },
        { new: true }
      );

      return updatedArticle;
    } catch (err) {
      logger.error(`Error clasificando artículo: ${err.message}`);
      throw err;
    }
  }

  /**
   * Procesa múltiples artículos
   * @param {Array} articles - Array de artículos
   * @returns {Promise<Array>} Artículos clasificados
   */
  async processArticles(articles) {
    const results = [];

    for (const article of articles) {
      try {
        const processed = await this.processArticle(article);
        results.push(processed);
      } catch (err) {
        logger.warn(`Error procesando artículo ${article._id}: ${err.message}`);
      }
    }

    logger.info(`✅ ${results.length} artículos clasificados`);
    return results;
  }
}

module.exports = new Classifier();