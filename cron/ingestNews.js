const node-cron = require('node-cron');
const newsIngestionPipeline = require('../services/ingestionPipeline');
const logger = require('../utils/logger');

/**
 * Configura trabajos CRON para ejecución automática del pipeline
 */
function initializeScheduledTasks() {
  try {
    logger.info('⏰ Inicializando tareas programadas...');

    // Ejecutar ingesta completa cada 1 hora
    // Formato: "0 * * * *" = cada hora en punto
    node-cron.schedule('0 * * * *', async () => {
      try {
        logger.info('🔄 Ejecutando pipeline completo programado...');
        const result = await newsIngestionPipeline.runFullPipeline();
        logger.info(`✅ Pipeline completado. ${result.totalArticles} artículos procesados`);
      } catch (err) {
        logger.error(`❌ Error en pipeline programado: ${err.message}`);
      }
    });

    // Ejecutar solo ingesta cada 30 minutos
    // Formato: "*/30 * * * *" = cada 30 minutos
    node-cron.schedule('*/30 * * * *', async () => {
      try {
        logger.info('📥 Ejecutando ingesta programada...');
        const result = await newsIngestionPipeline.runIngestionOnly();
        const totalSaved = result.reduce((sum, r) => sum + (r.saved || 0), 0);
        logger.info(`✅ Ingesta completada. ${totalSaved} artículos nuevos`);
      } catch (err) {
        logger.error(`❌ Error en ingesta programada: ${err.message}`);
      }
    });

    // Ejecutar clasificación cada 2 horas
    // Formato: "0 */2 * * *" = cada 2 horas
    node-cron.schedule('0 */2 * * *', async () => {
      try {
        logger.info('🏷️ Ejecutando clasificación programada...');
        const result = await newsIngestionPipeline.runClassificationOnly(200);
        logger.info(`✅ Clasificación completada. ${result.length} artículos procesados`);
      } catch (err) {
        logger.error(`❌ Error en clasificación programada: ${err.message}`);
      }
    });

    // Ejecutar resúmenes cada 3 horas
    // Formato: "0 */3 * * *" = cada 3 horas
    node-cron.schedule('0 */3 * * *', async () => {
      try {
        logger.info('📝 Ejecutando generación de resúmenes programada...');
        const result = await newsIngestionPipeline.runSummarizationOnly(200);
        logger.info(`✅ Resúmenes completados. ${result.length} artículos procesados`);
      } catch (err) {
        logger.error(`❌ Error en resúmenes programado: ${err.message}`);
      }
    });

    logger.info('✅ Tareas programadas inicializadas correctamente');
  } catch (err) {
    logger.error(`Error inicializando tareas programadas: ${err.message}`);
  }
}

module.exports = { initializeScheduledTasks };