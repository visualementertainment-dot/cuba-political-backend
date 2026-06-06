require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { PORT, isProduction } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const mongoose = require('mongoose');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const sourceRoutes = require('./routes/sourceRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ============ MIDDLEWARES DE SEGURIDAD ============

// Helmet para headers de seguridad
app.use(helmet());

// ============ CORS CONFIGURACIÓN ============
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compresión de respuestas
app.use(compression());

// Prevenir ataques de inyección MongoDB
app.use(mongoSanitize());

// Prevenir XSS
app.use(xss());

// Limitación de tamaño del payload
app.use(express.json({ limit: '10kb' }));

// ============ RATE LIMITING ============

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intente más tarde.' }
});
app.use('/api/', limiter);

// Rate limiting específico para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de autenticación, intente más tarde.' }
});
app.use('/api/auth/', authLimiter);

// Rate limiting para admin
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skipSuccessfulRequests: false,
  message: { error: 'Demasiadas peticiones a la zona administrativa.' }
});
app.use('/api/admin/', adminLimiter);

// ============ RUTAS ============

// Ruta de bienvenida para /api
app.get('/api', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de Noticias Cuba',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      news: '/api/news',
      sources: '/api/sources',
      comments: '/api/comments',
      user: '/api/user',
      notifications: '/api/notifications',
      admin: '/api/admin',
      health: '/health'
    },
    status: 'online',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Ruta de salud (health check)
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState === 1;
  res.status(dbState ? 200 : 503).json({
    status: dbState ? 'healthy' : 'unhealthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: dbState ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/admin', adminRoutes);
// ENDPOINT TEMPORAL - Resetea lecturas (SOLO PARA PRUEBAS - BORRAR DESPUÉS)
app.get('/reset-reads', async (req, res) => {
  try {
    const Article = require('./models/Article');
    const result = await Article.updateMany({}, { $set: { reads: 0 } });
    console.log(`✅ Reseteadas ${result.modifiedCount} lecturas a 0`);
    res.json({ 
      success: true, 
      message: `✅ ${result.modifiedCount} artículos actualizados a 0 lecturas`,
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error('❌ Error al resetear lecturas:', err);
    res.status(500).json({ error: err.message });
  }
});
// Manejador de errores global (siempre al final)
app.use(errorHandler);

// ============ INICIO DEL SERVIDOR ============

const startServer = async () => {
  try {
    // Conectar a MongoDB primero
    await connectDB();
    console.log('✅ MongoDB conectado correctamente');

    // Ejecutar seed (fuentes y artículos de ejemplo)
    const seedDatabase = require('./seed');
    await seedDatabase();
    console.log('✅ Seed completado');

    // ============ INICIAR SERVICIO RSS ============
    // Importar el servicio RSS
    const rssService = require('./services/rssService');
    
    // Esperar un poco para asegurar que las fuentes estén en la BD
    setTimeout(async () => {
      try {
        await rssService.startAllFromDatabase();
        console.log('✅ Servicio RSS iniciado correctamente');
      } catch (err) {
        console.error('❌ Error al iniciar servicio RSS:', err.message);
      }
    }, 3000);

    // Iniciar servidor después de todo
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📦 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log(`🔓 CORS permitiendo: http://localhost:5173 y http://localhost:3000`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
  }
};

// Manejar cierre graceful
const gracefulShutdown = async () => {
  console.log('\n🔄 Cerrando servidor...');
  
  // Detener servicio RSS
  try {
    const rssService = require('./services/rssService');
    rssService.stopAll();
    console.log('✅ Servicio RSS detenido');
  } catch (err) {
    // El servicio puede no estar inicializado
  }
  
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('✅ Conexión a MongoDB cerrada');
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Iniciar todo
startServer();