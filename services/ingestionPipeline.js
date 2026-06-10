const sourceManager = require('../ingestion/sourceManager');
const classifier = require('../ai/classifier');
const summarizer = require('../ai/summarizer');
const logger = require('../../utils/logger');
const News = require('../../models/News');

/**
 * Servicio principal que orquesta todo el pipeline de ingesta
 */
class NewsIngestionPipeline {
  /**
   * Ejecuta el pipeline completo
   * @returns {Promise<Object>} Resultado de la ejecución
   */
  async runFullPipeline() {
    const startTime = Date.now();
    const result = {
      timestamp: new Date(),
      stages: {},
      totalArticles: 0,
      totalDuration: 0,
      success: true,
      errors: []
    };

    try {
      logger.info('🚀 ===== INICIANDO PIPELINE COMPLETO DE INGESTA =====');

      // Stage 1: Ingestión desde fuentes
      logger.info('📥 STAGE 1: Ingesta desde fuentes');
      const ingestResult = await sourceManager.ingestFromAllSources();
      result.stages.ingestion = ingestResult;

      // Contar artículos ingestados
      const ingestedCount = ingestResult.reduce((sum, r) => sum + (r.saved || 0), 0);
      result.totalArticles += ingestedCount;
      logger.info(`✅ Ingesta completada: ${ingestedCount} artículos nuevos`);

      // Stage 2: Clasificación
      logger.info('🏷️  STAGE 2: Clasificación de artículos');
      const unclassifiedArticles = await News.find({
        category: 'otros',
        isUrgent: false
      }).limit(100);

      if (unclassifiedArticles.length > 0) {
        const classifiedArticles = await classifier.processArticles(unclassifiedArticles);
        result.stages.classification = {
          processed: classifiedArticles.length,
          categoriesFound: [...new Set(classifiedArticles.map(a => a.category))]
        };
        logger.info(`✅ Clasificación completada: ${classifiedArticles.length} artículos`);
      }

      // Stage 3: Resúmenes
      logger.info('📝 STAGE 3: Generación de resúmenes');
      const unsummarizedArticles = await News.find({
        summary: { $exists: false }
      }).limit(100);

      if (unsummarizedArticles.length > 0) {
        const summarizedArticles = await summarizer.processArticles(unsummarizedArticles);
        result.stages.summarization = {
          processed: summarizedArticles.length
        };
        logger.info(`✅ Resúmenes completados: ${summarizedArticles.length} artículos`);
      }

      // Estadísticas finales
      const totalNews = await News.countDocuments();
      const urgentNews = await News.countDocuments({ isUrgent: true });
      const categories = await News.distinct('category');

      result.stats = {
        totalNewsInDatabase: totalNews,
        urgentArticles: urgentNews,
        categoriesInDatabase: categories,
        lastRun: new Date()
      };

      result.totalDuration = Date.now() - startTime;
      logger.info(`✅ ===== PIPELINE COMPLETADO EN ${result.totalDuration}ms =====`);
      logger.info(`📊 Estadísticas finales: ${totalNews} artículos, ${urgentNews} urgentes, ${categories.length} categorías`);

      return result;
    } catch (err) {
      result.success = false;
      result.errors.push(err.message);
      logger.error(`❌ Error en pipeline: ${err.message}`);
      throw err;
    }
  }

  /**
   * Ejecuta solo la ingesta desde fuentes
   * @returns {Promise<Array>} Resultados de ingesta
   */
  async runIngestionOnly() {
    return await sourceManager.ingestFromAllSources();
  }

  /**
   * Clasifica artículos pendientes
   * @returns {Promise<Array>} Artículos clasificados
   */
  async runClassificationOnly(limit = 100) {
    const articles = await News.find({
      category: 'otros'
    }).limit(limit);

    return await classifier.processArticles(articles);
  }

  /**
   * Genera resúmenes para artículos pendientes
   * @returns {Promise<Array>} Artículos con resúmenes
   */
  async runSummarizationOnly(limit = 100) {
    const articles = await News.find({
      summary: { $exists: false }
    }).limit(limit);

    return await summarizer.processArticles(articles);
  }
}

module.exports = new NewsIngestionPipeline();