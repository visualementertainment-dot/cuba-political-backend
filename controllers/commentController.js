const Comment = require('../models/Comment');
const User = require('../models/User');  // ← ESTA LÍNEA FALTABA
const asyncHandler = require('../utils/asyncHandler');

exports.getComments = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const comments = await Comment.find({ articleId }).sort({ createdAt: -1 });
  res.json(comments);
});

exports.addComment = asyncHandler(async (req, res) => {
  const { articleId } = req.params;
  const { text } = req.body;
  
  // Verificar que el usuario existe
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  const comment = new Comment({
    articleId,
    userId: user._id,
    username: user.username,
    text: text.trim(),
  });
  
  await comment.save();
  res.status(201).json(comment);
});

exports.editComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;
  
  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json({ error: 'Comentario no existe' });
  if (comment.userId.toString() !== req.userId) return res.status(403).json({ error: 'No autorizado' });
  
  comment.text = text.trim();
  comment.edited = true;
  await comment.save();
  res.json(comment);
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  
  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json({ error: 'Comentario no existe' });
  if (comment.userId.toString() !== req.userId) return res.status(403).json({ error: 'No autorizado' });
  
  await comment.deleteOne();
  res.json({ success: true });
});