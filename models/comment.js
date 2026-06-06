const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  username: { type: String, required: true },
  text: { type: String, required: true },
  edited: { type: Boolean, default: false }
}, { timestamps: true });

// Índice compuesto para queries rápidas
CommentSchema.index({ articleId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);