const axios = require('axios');
const cheerio = require('cheerio');
const { createContentHash } = require('../../utils/hashUtils');
const logger = require('../../utils/logger');

class ScraperFetcher {
  /**
   * Obtiene noticias mediante scraping de un sitio web
   * @param {Object} source - Documento de fuente de MongoDB
   * @returns {Promise<Array>} Array de artículos scrapeados
   */
  async fetchByScraping(source) {
    try {
      if (!source.scrapConfig) {
        throw new Error(`Fuente ${source.name} no tiene configuración de scraping`);
      }

      logger.info(`🕷️ Scrapendo noticias de: ${source.name}`);

      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: source.scrapConfig.headers || {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const articles = [];
      const { selectors } = source.scrapConfig;

      // Buscar todos los artículos en la página
      $(selectors.articleContainer || 'article').each((index, element) => {
        try {
          const article = this.parseScrapedArticle($, element, selectors, source);
          if (article) {
            articles.push(article);
          }
        } catch (err) {
          logger.warn(`⚠️ Error scrapeando artículo ${index} de ${source.name}: ${err.message}`);
        }
      });

      logger.info(`✅ Se scrapearon ${articles.length} artículos de ${source.name}`);
      return articles;
    } catch (err) {
      logger.error(`❌ Error scrapendo ${source.name}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Parsea un artículo scrapeado
   * @param {Object} $ - Instancia de Cheerio
   * @param {Object} element - Elemento HTML
   * @param {Object} selectors - Selectores CSS configurados
   * @param {Object} source - Documento de fuente
   * @returns {Object|null} Artículo procesado o null
   */
  parseScrapedArticle($, element, selectors, source) {
    const $element = $(element);

    const title = $element.find(selectors.title || 'h2, h1, .title').first().text().trim();
    const content = $element.find(selectors.content || 'p, .content, .body').text().trim();
    const author = $element.find(selectors.author || '.author, [rel="author"]').text().trim();
    const dateStr = $element.find(selectors.date || 'time, .date, [datetime]').attr('datetime') ||
                   $element.find(selectors.date || 'time, .date').text().trim();
    const imageUrl = $element.find(selectors.image || 'img').attr('src') || '';

    // Validar campos requeridos
    if (!title || !content) {
      return null;
    }

    const contentHash = createContentHash(title + content);

    return {
      externalId: `${source._id}-${contentHash.substring(0, 10)}`,
      sourceId: source._id,
      sourceUrl: source.url,
      title,
      content,
      description: content.substring(0, 200) + '...',
      author: author || source.name,
      imageUrl: imageUrl ? new URL(imageUrl, source.url).href : null,
      publishedAt: dateStr ? new Date(dateStr) : new Date(),
      contentHash,
      category: 'otros',
      urgency: 'media',
      isUrgent: false,
      aiProcessed: false
    };
  }
}

module.exports = new ScraperFetcher();