const User = require('../models/User');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const Source = require('../models/Source');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { isAdmin } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isAdmin }, { new: true }).select('-password');
  res.json(user);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

exports.getAllComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [comments, total] = await Promise.all([
    Comment.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('articleId', 'title'),
    Comment.countDocuments()
  ]);

  const enriched = comments.map(c => ({
    ...c.toObject(),
    articleTitle: c.articleId?.title || 'Artículo eliminado'
  }));

  res.json({
    comments: enriched,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum)
  });
});

exports.updateComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const comment = await Comment.findByIdAndUpdate(req.params.id, { text, edited: true }, { new: true });
  res.json(comment);
});

exports.deleteCommentAdmin = asyncHandler(async (req, res) => {
  await Comment.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

exports.createArticle = asyncHandler(async (req, res) => {
  const { source, urgent, category, title, summary, author, reads, body } = req.body;
  const article = new Article({
    source, urgent: urgent || false, category, title, summary, author,
    publishedAt: new Date(),
    reads: reads || 0,
    body
  });
  await article.save();
  res.status(201).json(article);
});

exports.updateArticle = asyncHandler(async (req, res) => {
  // Solo permitir actualizar estos campos
  const allowed = ['title', 'summary', 'body', 'category', 'urgent', 'source', 'author'];
  const updates = {};
  allowed.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const article = await Article.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json(article);
});

exports.deleteArticle = asyncHandler(async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  await Comment.deleteMany({ articleId: req.params.id });
  res.json({ success: true });
});

exports.getSourcesAdmin = asyncHandler(async (req, res) => {
  const sources = await Source.find();
  res.json(sources);
});

exports.createSource = asyncHandler(async (req, res) => {
  const source = new Source(req.body);
  await source.save();
  res.status(201).json(source);
});

exports.updateSource = asyncHandler(async (req, res) => {
  const source = await Source.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(source);
});

exports.deleteSource = asyncHandler(async (req, res) => {
  await Source.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});