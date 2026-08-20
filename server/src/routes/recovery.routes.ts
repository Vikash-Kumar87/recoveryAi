import { Router } from 'express';
import {
  analyzePaymentHandler,
  getRecoveryMessageHandler,
  startRecoveryHandler,
  simulateRetryHandler,
  recordOutreachHandler,
  simulateSuccessHandler,
} from '../controllers/recovery.controller.js';

const router = Router();

// AI Analysis endpoints
router.post('/analyze', analyzePaymentHandler);
router.post('/analyze/:paymentId', analyzePaymentHandler);

// Recovery Message generation
router.post('/message', getRecoveryMessageHandler);
router.post('/message/:paymentId', getRecoveryMessageHandler);

// Workflow Initiation
router.post('/start', startRecoveryHandler);
router.post('/:paymentId/start', startRecoveryHandler);

// Simulated Retry
router.post('/retry', simulateRetryHandler);
router.post('/:paymentId/retry', simulateRetryHandler);

// Customer Outreach
router.post('/outreach', recordOutreachHandler);
router.post('/:paymentId/outreach', recordOutreachHandler);

// Simulated Success / Completion
router.post('/simulate-success', simulateSuccessHandler);
router.post('/complete', simulateSuccessHandler);
router.post('/:paymentId/complete', simulateSuccessHandler);

export default router;
