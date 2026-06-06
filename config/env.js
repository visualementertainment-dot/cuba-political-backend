const dotenv = require('dotenv');
dotenv.config();

// Validaciones de variables requeridas
const required = ['JWT_SECRET', 'MONGODB_URI'];
for (const env of required) {
  if (!process.env[env]) {
    throw new Error(`❌ Falta variable de entorno: ${env}`);
  }
}

// Validación específica para JWT_SECRET
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  throw new Error('❌ JWT_SECRET debe tener al menos 32 caracteres');
}

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production'
};