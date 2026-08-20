import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { autoSeedIfEmpty } from './seed/seedPayments.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  logger.info('Initializing RecoverAI Backend Server...');
  logger.info(`Target MongoDB Database: "${env.MONGODB_DB_NAME}"`);

  // 1. Create Express App & start listening FIRST to bind port immediately on Render/Cloud
  const app = createApp();

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info('==================================================');
    logger.info(`🚀 RecoverAI Backend Server Running on Port ${env.PORT}`);
    logger.info(`👉 Health Check: http://localhost:${env.PORT}/api/health`);
    logger.info(`👉 Dashboard Stats: http://localhost:${env.PORT}/api/dashboard/stats`);
    logger.info(`👉 Payments API: http://localhost:${env.PORT}/api/payments`);
    logger.info(`👉 Recovery API: http://localhost:${env.PORT}/api/recovery/analyze`);
    logger.info('==================================================');
  });

  // 2. Connect to MongoDB Atlas and auto-seed if necessary
  try {
    await connectDatabase();
    logger.info(`✅ Successfully connected to MongoDB database "${env.MONGODB_DB_NAME}"`);
    await autoSeedIfEmpty();
  } catch (error) {
    logger.error('⚠️ Initial MongoDB connection error (will keep HTTP server active for retry):', error);
  }

  // Graceful Shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('HTTP server closed.');
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();
