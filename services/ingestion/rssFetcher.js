const Parser = require('rss-parser');
const News = require('../../models/News');
const { createContentHash } = require('../../utils/hashUtils');
const logger = require('../../utils/logger');

const parser = new Parser({
  timeout: 10000,
  defaultRSS: 2.0,
  customFields: {
    item: [['content:encoded', 'fullContent']]
  }
});

class RSSFetcher {
  /**
   * Obtiene y procesa noticias de un feed RSS
   * @param {Object} source - Documento de fuente de MongoDB
   * @returns {Promise<Array>} Array de artículos procesados
   */
  async fetchFromRSS(source) {
    try {
      if (!source.rssUrl) {
        throw new Error(`Fuente ${source.name} no tiene URL RSS configurada`);
      }

      logger.info(`📡 Obteniendo noticias de RSS: ${source.name}`);
      const feed = await parser.parseURL(source.rssUrl);

      const articles = [];

      for (const item of feed.items) {
        try {
          const article = await this.parseRSSItem(item, source);
          if (article) {
            articles.push(article);
          }
        } catch (err) {
          logger.warn(`⚠️ Error procesando item de ${source.name}: ${err.message}`);
        }
      }

      logger.info(`✅ Obtuvieron ${articles.length} artículos de ${source.name}`);
      return articles;
    } catch (err) {
      logger.error(`❌ Error obteniendo RSS de ${source.name}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Parsea un item individual de RSS
   * @param {Object} item - Item del feed RSS
   * @param {Object} source - Documento de fuente
   * @returns {Promise<Object|null>} Artículo procesado o null si no es válido
   */
  async parseRSSItem(item, source) {
    // Validar campos requeridos
    if (!item.title || !item.link) {
      return null;
    }

    // Calcular hash del contenido para deduplicación
    const contentHash = createContentHash(item.title + (item.content || item.description || ''));

    const article = {
      externalId: item.link,
      sourceId: source._id,
      sourceUrl: source.url,
      title: item.title.trim(),
      description: item.summary || item.description || item.content || '',
      content: item.fullContent || item.content || item.description || '',
      imageUrl: this.extractImageUrl(item),
      author: item.creator || item.author || source.name,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      contentHash,
      category: 'otros',
      urgency: 'media',
      isUrgent: false,
      aiProcessed: false
    };

    return article;
  }

  /**
   * Extrae URL de imagen del item de RSS
   * @param {Object} item - Item del feed
   * @returns {string|null} URL de imagen o null
   */
  extractImageUrl(item) {
    // Buscar en campos comunes
    if (item.image?.url) return item.image.url;
    if (item.media?.content?.[0]?.url) return item.media.content[0].url;
    if (item.enclosures?.length > 0) {
      const imageEnclosure = item.enclosures.find(enc => enc.type?.startsWith('image/'));
      if (imageEnclosure) return imageEnclosure.url;
    }

    // Extraer primera imagen del contenido HTML
    const content = item.fullContent || item.content || item.description || '';
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/;
    const match = content.match(imgRegex);
    return match ? match[1] : null;
  }
}

module.exports = new RSSFetcher();