import { Request, Response, NextFunction } from 'express';
import {
  runPaymentAnalysis,
  generateRecoveryMessage,
  startRecoveryWorkflow,
  simulatePaymentSuccess,
  simulatePaymentRetry,
  recordCustomerOutreach,
} from '../services/recovery.service.js';

export const analyzePaymentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentId = req.body.paymentId || req.params.paymentId;
    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required.' });
    }

    const recovery = await runPaymentAnalysis(paymentId);

    const rawAmountRupees = Math.round((recovery as any).expectedRecoveryValue || 0);

    const analysis = {
      paymentId: recovery.paymentId,
      failureAnalysis: recovery.failureAnalysis,
      customerReliability: recovery.customerReliability,
      recoveryProbability: recovery.recoveryProbability,
      recommendedAction: recovery.recommendedAction,
      bestRetryTime: recovery.bestRetryTime,
      priority: recovery.priority,
      reasoning: recovery.reasoning,
      reasoningPoints: recovery.reasoningPoints || [],
      expectedRecoveryValue: recovery.expectedRecoveryValue || rawAmountRupees,
      confidenceScore: recovery.confidenceScore ?? 92,
      suggestedMessage: recovery.recoveryMessage,
      recoveryMessage: recovery.recoveryMessage,
      analysisTimestamp: recovery.updatedAt?.toISOString() ?? new Date().toISOString(),
      agentVersion: recovery.agentVersion ?? 'Groq AI (Llama 3.3)',
      status: recovery.status,
    };

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecoveryMessageHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentId = req.body.paymentId || req.params.paymentId;
    const tone = req.body.tone;
    const result = await generateRecoveryMessage(paymentId, tone);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const startRecoveryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentId = req.body.paymentId || req.params.paymentId;
    const { action } = req.body;
    const result = await startRecoveryWorkflow(paymentId, action);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const simulateRetryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentId = req.body.paymentId || req.params.paymentId;
    const result = await simulatePaymentRetry(paymentId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const recordOutreachHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentId = req.body.paymentId || req.params.paymentId;
    const { channel } = req.body;
    const result = await recordCustomerOutreach(paymentId, channel);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const simulateSuccessHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentId = req.body.paymentId || req.params.paymentId;
    const result = await simulatePaymentSuccess(paymentId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
