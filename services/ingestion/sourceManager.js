const Source = require('../../models/Source');
const News = require('../../models/News');
const rssFetcher = require('./rssFetcher');
const scraperFetcher = require('./scraperFetcher');
const deduplicationService = require('../deduplication/duplicateDetector');
const logger = require('../../utils/logger');

class SourceManager {
  /**
   * Obtiene todas las fuentes activas
   * @returns {Promise<Array>} Array de fuentes
   */
  async getActiveSources() {
    try {
      const sources = await Source.find({ active: true });
      return sources;
    } catch (err) {
      logger.error(`❌ Error obteniendo fuentes: ${err.message}`);
      throw err;
    }
  }

  /**
   * Obtiene noticias de una fuente según su tipo
   * @param {Object} source - Documento de fuente
   * @returns {Promise<Array>} Array de artículos obtenidos
   */
  async fetchFromSource(source) {
    try {
      let articles = [];

      switch (source.type) {
        case 'rss':
          articles = await rssFetcher.fetchFromRSS(source);
          break;
        case 'scraper':
          articles = await scraperFetcher.fetchByScraping(source);
          break;
        case 'api':
          // Implementar cuando sea necesario
          logger.warn(`⚠️ API fetcher no implementado para ${source.name}`);
          break;
        default:
          throw new Error(`Tipo de fuente desconocido: ${source.type}`);
      }

      return articles;
    } catch (err) {
      // Registrar error pero no fallar
      await this.recordSourceError(source._id);
      throw err;
    }
  }

  /**
   * Procesa e ingesta noticias de una fuente
   * @param {Object} source - Documento de fuente
   * @returns {Promise<Object>} Resultado de la ingestión
   */
  async ingestFromSource(source) {
    const result = {
      sourceId: source._id,
      sourceName: source.name,
      fetched: 0,
      saved: 0,
      duplicates: 0,
      errors: [],
      startTime: Date.now()
    };

    try {
      // 1. Obtener artículos de la fuente
      const articles = await this.fetchFromSource(source);
      result.fetched = articles.length;

      // 2. Detectar duplicados
      const { newArticles, duplicateCount } = await deduplicationService.filterDuplicates(articles);
      result.duplicates = duplicateCount;

      // 3. Guardar artículos nuevos
      if (newArticles.length > 0) {
        const savedArticles = await News.insertMany(newArticles, { ordered: false }).catch(err => {
          if (err.code === 11000) {
            // Duplicados en base de datos, ignorar
            return err.result?.insertedDocs || [];
          }
          throw err;
        });
        result.saved = savedArticles.length;
      }

      // 4. Actualizar estadísticas de la fuente
      await this.updateSourceStats(source._id, result.saved);
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;

      logger.info(`✅ Ingestión completada para ${source.name}: ${result.saved} guardadas, ${result.duplicates} duplicadas`);
      return result;
    } catch (err) {
      result.errors.push(err.message);
      logger.error(`❌ Error ingestionando desde ${source.name}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Registra un error en la fuente
   * @param {ObjectId} sourceId - ID de la fuente
   */
  async recordSourceError(sourceId) {
    try {
      await Source.findByIdAndUpdate(
        sourceId,
        { $inc: { errorCount: 1 } },
        { new: true }
      );
    } catch (err) {
      logger.error(`Error registrando fallo de fuente: ${err.message}`);
    }
  }

  /**
   * Actualiza estadísticas de una fuente
   * @param {ObjectId} sourceId - ID de la fuente
   * @param {Number} newArticles - Cantidad de nuevos artículos
   */
  async updateSourceStats(sourceId, newArticles) {
    try {
      await Source.findByIdAndUpdate(
        sourceId,
        {
          $inc: {
            articlesCount: newArticles,
            successCount: 1
          },
          lastSuccessAt: new Date(),
          lastIngestAt: new Date()
        },
        { new: true }
      );
    } catch (err) {
      logger.error(`Error actualizando estadísticas de fuente: ${err.message}`);
    }
  }

  /**
   * Ingesta noticias de todas las fuentes activas
   * @returns {Promise<Array>} Resultados de cada ingestión
   */
  async ingestFromAllSources() {
    const sources = await this.getActiveSources();
    const results = [];

    logger.info(`🚀 Iniciando ingestión de ${sources.length} fuentes`);

    for (const source of sources) {
      try {
        const result = await this.ingestFromSource(source);
        results.push(result);
      } catch (err) {
        results.push({
          sourceId: source._id,
          sourceName: source.name,
          error: err.message
        });
      }
    }

    logger.info(`✅ Ingestión completada. Total: ${results.length} fuentes procesadas`);
    return results;
  }
}

module.exports = new SourceManager();