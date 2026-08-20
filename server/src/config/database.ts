import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info(`MongoDB Atlas is already connected to database: "${env.MONGODB_DB_NAME}".`);
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = true;
    logger.info(
      `MongoDB Atlas Connected: host=${conn.connection.host}, database="${conn.connection.name}"`
    );

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected.');
      isConnected = false;
    });
  } catch (error) {
    isConnected = false;
    logger.error('Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
};

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully.');
};
