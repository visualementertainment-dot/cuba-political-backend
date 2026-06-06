const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  icon: { type: String, default: '📰' },
  color: { type: String, default: '#1a1a1a' },
  category: { type: String, default: 'General' },
  rssUrl: { type: String, default: null },           // ← NUEVO: URL del feed RSS
  refreshInterval: { type: Number, default: 5 },     // ← NUEVO: minutos entre actualizaciones
  active: { type: Boolean, default: true }           // ← NUEVO: para activar/desactivar fuente
}, { timestamps: true });

module.exports = mongoose.model('Source', sourceSchema);