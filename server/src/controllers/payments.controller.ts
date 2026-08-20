import { Request, Response, NextFunction } from 'express';
import { getPaymentsList, getPaymentDetails } from '../services/payment.service.js';

export const getPaymentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getPaymentsList(req.query as any);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const payment = await getPaymentDetails(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment ${id} not found`,
      });
    }
    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
