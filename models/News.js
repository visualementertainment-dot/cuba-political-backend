const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  // Identifiers
  externalId: { type: String, unique: true, sparse: true, index: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true, index: true },
  sourceUrl: { type: String, required: true },
  
  // Content
  title: { type: String, required: true, index: true },
  description: String,
  content: String,
  summary: String,
  imageUrl: String,
  author: String,
  
  // Classification
  category: {
    type: String,
    enum: ['política', 'economía', 'sociedad', 'internacional', 'deporte', 'cultura', 'salud', 'otros'],
    default: 'otros',
    index: true
  },
  tags: [{ type: String, index: true }],
  urgency: {
    type: String,
    enum: ['baja', 'media', 'alta', 'crítica'],
    default: 'media',
    index: true
  },
  isUrgent: { type: Boolean, default: false, index: true },
  
  // Metadata
  publishedAt: { type: Date, index: true },
  retrievedAt: { type: Date, default: Date.now, index: true },
  reads: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  
  // Deduplication
  contentHash: { type: String, unique: true, sparse: true, index: true },
  isDuplicate: { type: Boolean, default: false, index: true },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'News', sparse: true },
  
  // AI Processing
  aiProcessed: { type: Boolean, default: false },
  confidenceScore: { type: Number, min: 0, max: 1 },
  sentimentScore: { type: Number, min: -1, max: 1 },
  relevanceScore: { type: Number, min: 0, max: 1 },
  
  // Status
  active: { type: Boolean, default: true, index: true },
  archived: { type: Boolean, default: false },
  
}, { timestamps: true, collection: 'news' });

// Indexes para búsqueda optimizada
newsSchema.index({ sourceId: 1, publishedAt: -1 });
newsSchema.index({ category: 1, publishedAt: -1 });
newsSchema.index({ isUrgent: 1, publishedAt: -1 });
newsSchema.index({ contentHash: 1 });
newsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('News', newsSchema);