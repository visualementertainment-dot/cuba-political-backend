const Article = require('../models/Article');
const asyncHandler = require('../utils/asyncHandler');

// Almacenar vistas por IP (se resetea al reiniciar el servidor)
const viewedArticles = new Map();

exports.getNews = asyncHandler(async (req, res) => {
  const { sources, page = 1, limit = 20, urgent, category } = req.query;
  const filter = {};
  if (sources) filter.source = { $in: sources.split(',') };
  if (urgent === 'true') filter.urgent = true;
  if (category) filter.category = category;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [articles, total] = await Promise.all([
    Article.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limitNum),
    Article.countDocuments(filter)
  ]);
  res.json({ articles, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
});

exports.getArticleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ error: 'ID inválido' });
  const article = await Article.findById(id);
  if (!article) return res.status(404).json({ error: 'No encontrado' });
  res.json(article);
});

exports.incrementReads = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ error: 'ID inválido' });
  
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  if (!viewedArticles.has(id)) {
    viewedArticles.set(id, new Set());
  }
  
  const viewers = viewedArticles.get(id);
  if (!viewers.has(clientIp)) {
    viewers.add(clientIp);
    await Article.findByIdAndUpdate(id, { $inc: { reads: 1 } });
  }
  
  res.json({ success: true });
});