const { isProduction } = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const status = err.status || 500;
  const message = isProduction && status === 500 ? 'Error interno del servidor' : err.message;
  res.status(status).json({ error: message });
}

module.exports = errorHandler;