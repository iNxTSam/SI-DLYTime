'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { config } = require('./config/env');
const { apiLimiter } = require('./middlewares/rateLimit');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');
const { uploadsDir, ensureUploadsDir } = require('./middlewares/upload');
const db = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const passwordRoutes = require('./routes/password.routes');
const mailRoutes = require('./routes/mail.routes');
const catalogRoutes = require('./routes/catalog.routes');
const clientRoutes = require('./routes/client.routes');
const employeeRoutes = require('./routes/employee.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const profileRoutes = require('./routes/profile.routes');

const isLocalOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/.test(
    origin
  );

function corsOrigin(origin, callback) {
  // Sin Origin: peticiones de la app movil, curl o health checks.
  if (!origin) return callback(null, true);
  if (config.corsOrigins.includes(origin)) return callback(null, true);
  if (!config.isProduction && isLocalOrigin(origin)) return callback(null, true);
  return callback(null, false);
}

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // La API entrega JSON y PDFs; se relaja la politica de recursos para que
      // el cliente pueda enlazar los archivos de /uploads.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'] }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(apiLimiter);

  ensureUploadsDir();
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      dotfiles: 'deny',
      index: false,
      maxAge: '1h',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    })
  );

  app.get('/', (req, res) => {
    res.json({
      name: 'SI-DLYTime API',
      version: '2.0.0',
      docs: '/api-docs',
      health: '/health',
    });
  });

  app.get('/health', async (req, res) => {
    try {
      await db.healthCheck();
      res.json({ status: 'ok', database: 'up' });
    } catch (error) {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });

  app.use('/autenticacion', authRoutes);
  app.use('/recuperarPassword', passwordRoutes);
  app.use('/enviarCorreo', mailRoutes);
  app.use('/miniConsultaSelect', catalogRoutes);
  app.use('/crudClientes', clientRoutes);
  app.use('/crudEmpleados', employeeRoutes);
  app.use('/crudCitas', appointmentRoutes);
  app.use('/perfil', profileRoutes);

  try {
    const { swaggerUi, swaggerDocument } = require('../swagger/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (error) {
    console.warn('[swagger] No se pudo cargar la documentacion:', error.message);
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
