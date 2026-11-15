'use strict';

const { createApp } = require('./app');
const { config } = require('./config/env');
const db = require('./config/db');

async function bootstrap() {
  const app = createApp();

  try {
    await db.healthCheck();
    console.log('[db] Conexion a MySQL establecida.');
  } catch (error) {
    // El servidor arranca igual para que /health reporte el problema en lugar
    // de morir con un stack trace.
    console.warn(
      '[db] No se pudo conectar a MySQL:',
      error.message || error.code || 'error desconocido'
    );
  }

  const server = app.listen(config.port, () => {
    console.log(`[server] SI-DLYTime API en http://localhost:${config.port}`);
    console.log(`[server] Documentacion: http://localhost:${config.port}/api-docs`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} recibido, cerrando...`);
    server.close(async () => {
      await db.close().catch(() => {});
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('[server] Error fatal al arrancar:', error);
  process.exit(1);
});
