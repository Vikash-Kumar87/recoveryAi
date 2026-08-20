import { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from '../services/analytics.service.js';

export const getDashboardStatsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getDashboardStats();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
