const crypto = require('crypto');

/**
 * Crea un hash SHA-256 del contenido para deduplicación
 * @param {string} content - Contenido a hashear
 * @returns {string} Hash hexadecimal
 */
function createContentHash(content) {
  // Normalizar contenido: minúsculas, sin espacios extra, sin puntuación
  const normalized = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Crea un hash rápido para búsqueda en cache
 * @param {string} content - Contenido
 * @returns {string} Hash rápido
 */
function createQuickHash(content) {
  return crypto
    .createHash('md5')
    .update(content)
    .digest('hex');
}

module.exports = {
  createContentHash,
  createQuickHash
};