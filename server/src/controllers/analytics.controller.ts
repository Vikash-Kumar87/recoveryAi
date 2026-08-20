import { Request, Response, NextFunction } from 'express';
import { getAnalyticsData } from '../services/analytics.service.js';

export const getAnalyticsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getAnalyticsData();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
