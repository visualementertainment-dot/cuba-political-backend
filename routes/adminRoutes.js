const express = require('express');
const News = require('../models/News');
const Source = require('../models/Source');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/admin/sources
 * Crear nueva fuente
 * Solo administradores
 */
router.post('/sources', asyncHandler(async (req, res) => {
  const { name, url, type, rssUrl, scrapConfig, category, credibility } = req.body;
  
  // Validaciones
  if (!name || !url || !type) {
    return res.status(400).json({ error: 'Faltan campos requeridos: name, url, type' });
  }
  
  if (!['rss', 'scraper', 'api', 'manual'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de fuente inválido' });
  }
  
  // Verificar duplicados
  const existing = await Source.findOne({ name });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe una fuente con este nombre' });
  }
  
  const source = new Source({
    name,
    url,
    type,
    rssUrl: type === 'rss' ? rssUrl : undefined,
    scrapConfig: type === 'scraper' ? scrapConfig : undefined,
    category: category || 'general',
    credibility: credibility || 50
  });
  
  await source.save();
  logger.info(`✅ Nueva fuente creada: ${name}`);
  
  res.status(201).json({ success: true, data: source });
}));

/**
 * PUT /api/admin/sources/:id
 * Actualizar fuente
 */
router.put('/sources/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const source = await Source.findByIdAndUpdate(id, updates, { new: true });
  if (!source) {
    return res.status(404).json({ error: 'Fuente no encontrada' });
  }
  
  logger.info(`✅ Fuente actualizada: ${source.name}`);
  res.json({ success: true, data: source });
}));

/**
 * DELETE /api/admin/sources/:id
 * Eliminar fuente
 */
router.delete('/sources/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const source = await Source.findByIdAndDelete(id);
  if (!source) {
    return res.status(404).json({ error: 'Fuente no encontrada' });
  }
  
  logger.info(`✅ Fuente eliminada: ${source.name}`);
  res.json({ success: true, message: 'Fuente eliminada' });
}));

/**
 * GET /api/admin/news/stats
 * Estadísticas generales de noticias
 */
router.get('/news/stats', asyncHandler(async (req, res) => {
  const totalNews = await News.countDocuments();
  const urgent = await News.countDocuments({ isUrgent: true });
  const unclassified = await News.countDocuments({ category: 'otros' });
  const unsummarized = await News.countDocuments({ summary: { $exists: false } });
  
  const categories = await News.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  res.json({
    success: true,
    stats: {
      totalNews,
      urgent,
      unclassified,
      unsummarized,
      byCategory: categories
    }
  });
}));

/**
 * DELETE /api/admin/news/duplicates
 * Limpiar artículos duplicados
 */
router.delete('/news/duplicates', asyncHandler(async (req, res) => {
  const result = await News.deleteMany({ isDuplicate: true });
  
  logger.info(`🗑️ ${result.deletedCount} artículos duplicados eliminados`);
  
  res.json({
    success: true,
    message: `${result.deletedCount} artículos duplicados eliminados`
  });
}));

/**
 * POST /api/admin/news/recalculate-urgency
 * Recalcular nivel de urgencia para todos los artículos
 */
router.post('/news/recalculate-urgency', asyncHandler(async (req, res) => {
  const classifier = require('../services/ai/classifier');
  
  const articles = await News.find({}).limit(500);
  const results = await classifier.processArticles(articles);
  
  logger.info(`✅ Urgencia recalculada para ${results.length} artículos`);
  
  res.json({
    success: true,
    message: `Urgencia recalculada para ${results.length} artículos`
  });
}));

module.exports = router;