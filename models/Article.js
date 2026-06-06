const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  source: { type: String, required: true, index: true },
  urgent: { type: Boolean, default: false, index: true },
  category: { type: String, required: true, index: true },
  title: { type: String, required: true },
  summary: String,
  author: String,
  publishedAt: { type: Date, default: Date.now, index: true },
  reads: { type: Number, default: 0 },
  body: String,
}, { timestamps: true });

articleSchema.index({ source: 1, publishedAt: -1 });

module.exports = mongoose.model('Article', articleSchema);