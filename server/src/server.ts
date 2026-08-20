import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    logger.info('Initializing RecoverAI Backend Server...');
    logger.info(`Target MongoDB Database: "${env.MONGODB_DB_NAME}"`);

    // 1. Connect to MongoDB Atlas first
    await connectDatabase();
    logger.info(`✅ Successfully connected to MongoDB database "${env.MONGODB_DB_NAME}"`);

    // 2. Create Express App
    const app = createApp();

    // 3. Start Listening
    const server = app.listen(env.PORT, () => {
      logger.info('==================================================');
      logger.info(`🚀 RecoverAI Backend Server Running on Port ${env.PORT}`);
      logger.info(`👉 Health Check: http://localhost:${env.PORT}/api/health`);
      logger.info(`👉 Dashboard Stats: http://localhost:${env.PORT}/api/dashboard/stats`);
      logger.info(`👉 Payments API: http://localhost:${env.PORT}/api/payments`);
      logger.info(`👉 Recovery API: http://localhost:${env.PORT}/api/recovery/analyze`);
      logger.info('==================================================');
    });

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
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB. Server startup aborted:', error);
    process.exit(1);
  }
};

startServer();
