import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { isDatabaseConnected } from './config/database.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';

// Route imports
import dashboardRoutes from './routes/dashboard.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import recoveryRoutes from './routes/recovery.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import activityRoutes from './routes/activity.routes.js';
import settingsRoutes from './routes/settings.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Security Middleware
  app.use(helmet());

  // Morgan HTTP request logger
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // CORS Configuration - Permissive for Vercel production, preview deployments, and local dev
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );
  app.options('*', cors());

  // Body parser
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint (Strictly matching prompt specifications)
  app.get('/api/health', (_req: Request, res: Response) => {
    const dbConnected = isDatabaseConnected();
    res.status(200).json({
      success: true,
      service: 'RecoverAI API',
      status: 'healthy',
      database: dbConnected ? 'connected' : 'disconnected',
    });
  });

  // API Routes
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/recovery', recoveryRoutes);
  app.use('/api/ai', recoveryRoutes); // Convenient REST alias
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/settings', settingsRoutes);

  // 404 & Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
