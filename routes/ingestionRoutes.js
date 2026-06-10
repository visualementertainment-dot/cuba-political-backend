const express = require('express');
const newsIngestionPipeline = require('../services/ingestionPipeline');
const sourceManager = require('../services/ingestion/sourceManager');
const News = require('../models/News');
const Source = require('../models/Source');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * POST /api/ingestion/run-full
 * Ejecuta el pipeline completo: ingesta → deduplicación → clasificación → resúmenes
 * Solo administradores
 */
router.post('/run-full', asyncHandler(async (req, res) => {
  logger.info('🚀 Iniciando pipeline completo manual...');
  
  const result = await newsIngestionPipeline.runFullPipeline();
  
  res.json({
    success: true,
    message: 'Pipeline completado exitosamente',
    data: result
  });
}));

/**
 * POST /api/ingestion/run-ingestion
 * Ejecuta solo la ingesta desde fuentes
 */
router.post('/run-ingestion', asyncHandler(async (req, res) => {
  logger.info('📥 Iniciando ingesta manual...');
  
  const result = await newsIngestionPipeline.runIngestionOnly();
  
  const totalFetched = result.reduce((sum, r) => sum + (r.fetched || 0), 0);
  const totalSaved = result.reduce((sum, r) => sum + (r.saved || 0), 0);
  const totalDuplicates = result.reduce((sum, r) => sum + (r.duplicates || 0), 0);
  
  res.json({
    success: true,
    message: 'Ingesta completada',
    data: {
      totalSources: result.length,
      totalFetched,
      totalSaved,
      totalDuplicates,
      sources: result
    }
  });
}));

/**
 * POST /api/ingestion/run-classification
 * Ejecuta solo la clasificación de artículos pendientes
 */
router.post('/run-classification', asyncHandler(async (req, res) => {
  const limit = req.body.limit || 100;
  logger.info(`🏷️ Ejecutando clasificación de ${limit} artículos...`);
  
  const result = await newsIngestionPipeline.runClassificationOnly(limit);
  
  res.json({
    success: true,
    message: 'Clasificación completada',
    data: {
      processed: result.length,
      articles: result
    }
  });
}));

/**
 * POST /api/ingestion/run-summarization
 * Ejecuta solo la generación de resúmenes
 */
router.post('/run-summarization', asyncHandler(async (req, res) => {
  const limit = req.body.limit || 100;
  logger.info(`📝 Ejecutando resúmenes de ${limit} artículos...`);
  
  const result = await newsIngestionPipeline.runSummarizationOnly(limit);
  
  res.json({
    success: true,
    message: 'Resúmenes completados',
    data: {
      processed: result.length,
      articles: result
    }
  });
}));

/**
 * GET /api/ingestion/stats
 * Obtiene estadísticas de la ingesta
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const totalNews = await News.countDocuments();
  const urgentNews = await News.countDocuments({ isUrgent: true });
  const totalSources = await Source.countDocuments({ active: true });
  const categories = await News.distinct('category');
  const lastNews = await News.findOne({}, {}, { sort: { 'createdAt': -1 } });
  
  // Estadísticas de últimas 24 horas
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const newsLast24h = await News.countDocuments({ createdAt: { $gte: last24h } });
  
  res.json({
    success: true,
    stats: {
      totalNews,
      urgentNews,
      totalSources,
      categories,
      newsLast24h,
      lastNewsAt: lastNews?.createdAt || null,
      timestamp: new Date()
    }
  });
}));

/**
 * GET /api/ingestion/sources
 * Obtiene información de todas las fuentes
 */
router.get('/sources', asyncHandler(async (req, res) => {
  const sources = await Source.find();
  
  const sourcesWithStats = await Promise.all(
    sources.map(async (source) => {
      const articleCount = await News.countDocuments({ sourceId: source._id });
      return {
        ...source.toObject(),
        articleCount,
        successRate: source.successCount + source.errorCount > 0 
          ? ((source.successCount / (source.successCount + source.errorCount)) * 100).toFixed(2) + '%'
          : 'N/A'
      };
    })
  );
  
  res.json({
    success: true,
    data: sourcesWithStats
  });
}));

/**
 * GET /api/ingestion/logs
 * Obtiene los logs de ingesta (últimas N líneas)
 */
router.get('/logs', asyncHandler(async (req, res) => {
  const lines = req.query.lines || 100;
  const fs = require('fs');
  const path = require('path');
  
  try {
    const logFile = path.join(__dirname, '../logs/app.log');
    const content = fs.readFileSync(logFile, 'utf8');
    const logLines = content.split('\n').slice(-lines);
    
    res.json({
      success: true,
      logs: logLines
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: 'No se encontró el archivo de logs'
    });
  }
}));

/**
 * POST /api/ingestion/test-source/:sourceId
 * Prueba una fuente específica
 */
router.post('/test-source/:sourceId', asyncHandler(async (req, res) => {
  const { sourceId } = req.params;
  
  const source = await Source.findById(sourceId);
  if (!source) {
    return res.status(404).json({ error: 'Fuente no encontrada' });
  }
  
  logger.info(`🧪 Probando fuente: ${source.name}`);
  
  const result = await sourceManager.ingestFromSource(source);
  
  res.json({
    success: true,
    message: `Prueba completada para ${source.name}`,
    data: result
  });
}));

module.exports = router;