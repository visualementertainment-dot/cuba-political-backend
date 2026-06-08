const News = require('../../models/News');
const logger = require('../../utils/logger');

/**
 * NOTA: Este es un resumen simple basado en reglas.
 * Para producción, integra OpenAI GPT, Hugging Face, o Google Cloud AI
 */
class Summarizer {
  /**
   * Genera un resumen del contenido
   * @param {Object} article - Artículo con content/description
   * @returns {Promise<string>} Resumen generado
   */
  async generateSummary(article) {
    try {
      const content = article.content || article.description;

      if (!content || content.length < 100) {
        return content;
      }

      // Implementación simple: primeras 2-3 oraciones
      const sentences = this.extractSentences(content);
      const summary = sentences.slice(0, 3).join(' ');

      return summary.length > 300 ? summary.substring(0, 300) + '...' : summary;
    } catch (err) {
      logger.error(`Error generando resumen: ${err.message}`);
      return article.description || '';
    }
  }

  /**
   * Extrae oraciones del texto
   * @param {string} text - Texto
   * @returns {Array<string>} Array de oraciones
   */
  extractSentences(text) {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  /**
   * Procesa un artículo para generar resumen
   * @param {Object} article - Artículo de MongoDB
   * @returns {Promise<Object>} Artículo procesado
   */
  async processArticle(article) {
    try {
      const summary = await this.generateSummary(article);
      const updatedArticle = await News.findByIdAndUpdate(
        article._id,
        {
          summary,
          aiProcessed: true
        },
        { new: true }
      );

      return updatedArticle;
    } catch (err) {
      logger.error(`Error procesando artículo para resumen: ${err.message}`);
      throw err;
    }
  }

  /**
   * Procesa múltiples artículos
   * @param {Array} articles - Array de artículos
   * @returns {Promise<Array>} Artículos procesados
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

    return results;
  }
}

module.exports = new Summarizer();