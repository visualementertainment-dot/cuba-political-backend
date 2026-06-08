const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  url: { type: String, required: true },
  type: {
    type: String,
    enum: ['rss', 'scraper', 'api', 'manual'],
    required: true
  },
  
  // Configuración de ingesta
  rssUrl: String,
  scrapConfig: {
    selectors: {
      title: String,
      content: String,
      author: String,
      date: String,
      image: String
    },
    headers: mongoose.Schema.Types.Mixed
  },
  apiConfig: {
    endpoint: String,
    method: { type: String, default: 'GET' },
    headers: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    responseMapping: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  description: String,
  category: String,
  country: { type: String, default: 'Cuba' },
  language: { type: String, default: 'es' },
  logo: String,
  
  // Estado
  active: { type: Boolean, default: true, index: true },
  verified: { type: Boolean, default: false },
  credibility: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  // Estadísticas
  articlesCount: { type: Number, default: 0 },
  lastIngestAt: Date,
  lastSuccessAt: Date,
  errorCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  
  // Configuración de frecuencia
  ingestInterval: {
    type: Number,
    default: 3600000, // 1 hora en milisegundos
    min: 300000 // Mínimo 5 minutos
  },
  
  // Filtros automáticos
  filters: {
    keywords: [String],
    excludeKeywords: [String],
    minWordCount: { type: Number, default: 100 }
  },
  
}, { timestamps: true, collection: 'sources' });

sourceSchema.index({ active: 1, lastIngestAt: 1 });
sourceSchema.index({ type: 1 });

module.exports = mongoose.model('Source', sourceSchema);