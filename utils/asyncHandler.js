/**
 * Envuelve funciones async para manejar errores automáticamente
 * @param {Function} fn - Función async a envolver
 * @returns {Function} Función envuelta
 */
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;