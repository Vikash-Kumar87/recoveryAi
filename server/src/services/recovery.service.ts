import { Payment, IPayment } from '../models/Payment.js';
import { Recovery, IRecovery, RecoveryAction } from '../models/Recovery.js';
import { calculateRecoveryMetrics } from '../utils/recoveryScore.js';
import { analyzeFailedPayment, AIAnalysisOutput } from './groq.service.js';
import { logActivity } from './activity.service.js';
import { logger } from '../utils/logger.js';

export const runPaymentAnalysis = async (paymentId: string): Promise<IRecovery> => {
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found.`);
  }

  // 1. Deterministic business logic calculations
  const metrics = calculateRecoveryMetrics(payment);

  // 2. AI Intelligence (Groq LLM / Robust heuristics engine)
  const aiOutput: AIAnalysisOutput = await analyzeFailedPayment(payment, metrics);

  // 3. Upsert Recovery record
  let recovery = await Recovery.findOne({ paymentId });
  if (!recovery) {
    recovery = new Recovery({
      paymentId: payment.paymentId,
      ...aiOutput,
      status: payment.status === 'recovered' ? 'COMPLETED' : 'PENDING',
    });
  } else {
    Object.assign(recovery, {
      ...aiOutput,
      status: payment.status === 'recovered' ? 'COMPLETED' : recovery.status,
    });
  }
  await recovery.save();

  // 4. Update Payment status if still pending
  if (payment.status === 'pending') {
    payment.status = 'ai_analyzed';
    await payment.save();
  }

  // 5. Log Activity
  await logActivity(
    'AI_ANALYSIS',
    payment.paymentId,
    `AI analyzed payment ${payment.paymentId} for ₹${(payment.amount / 100).toLocaleString('en-IN')}`,
    {
      customerName: payment.customerName,
      amount: payment.amount,
      status: 'success',
      metadata: {
        recoveryProbability: aiOutput.recoveryProbability,
        customerReliability: aiOutput.customerReliability,
        recommendedAction: aiOutput.recommendedAction,
      },
    }
  );

  await logActivity(
    'RECOVERY_RECOMMENDED',
    payment.paymentId,
    `AI recommended strategy: ${aiOutput.recommendedAction} (Probability: ${aiOutput.recoveryProbability}%)`,
    {
      customerName: payment.customerName,
      amount: payment.amount,
      status: 'info',
      metadata: {
        action: aiOutput.recommendedAction,
        bestRetryTime: aiOutput.bestRetryTime,
        priority: aiOutput.priority,
      },
    }
  );

  return recovery;
};

export const generateRecoveryMessage = async (paymentId: string, tone?: string) => {
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found.`);
  }

  let recovery = await Recovery.findOne({ paymentId });
  if (!recovery) {
    recovery = await runPaymentAnalysis(paymentId);
  }

  const recoveryRecord = recovery!;

  // Channel recommendation based on customer history and action
  let channelRecommendation = 'WhatsApp + SMS';
  let reason = 'High open-rate channel for fast action on failed payments';
  if (payment.amount >= 500000) {
    channelRecommendation = 'WhatsApp + Email + Merchant Priority Rep';
    reason = 'High-ticket B2B transaction benefits from multi-channel priority outreach';
  } else if (recoveryRecord.recommendedAction === 'SEND_PAYMENT_LINK') {
    channelRecommendation = 'WhatsApp + Instant Payment Link';
    reason = 'Direct UPI intent links on WhatsApp have a 78% conversion rate';
  }

  await logActivity(
    'MESSAGE_GENERATED',
    paymentId,
    `Personalized recovery message generated for ${payment.customerName}`,
    {
      customerName: payment.customerName,
      amount: payment.amount,
      status: 'info',
      metadata: { channel: channelRecommendation },
    }
  );

  return {
    paymentId,
    message: recoveryRecord.recoveryMessage,
    channelRecommendation,
    reason,
  };
};

export const recordCustomerOutreach = async (paymentId: string, channel = 'WhatsApp') => {
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found.`);
  }

  await logActivity(
    'MESSAGE_SENT',
    paymentId,
    `Recovery outreach dispatched to ${payment.customerName} via ${channel}`,
    {
      customerName: payment.customerName,
      amount: payment.amount,
      status: 'success',
      metadata: { channel },
    }
  );

  return {
    success: true,
    paymentId,
    message: `Recovery outreach dispatched to ${payment.customerEmail}`,
  };
};

export const startRecoveryWorkflow = async (paymentId: string, action?: RecoveryAction) => {
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found.`);
  }

  payment.status = 'recovery_initiated';
  await payment.save();

  let recovery = await Recovery.findOne({ paymentId });
  if (recovery) {
    recovery.status = 'IN_PROGRESS';
    if (action) {
      recovery.recommendedAction = action;
    }
    await recovery.save();
  }

  const chosenAction = action || recovery?.recommendedAction || 'RETRY_PAYMENT';

  await logActivity(
    'RECOVERY_INITIATED',
    paymentId,
    `Recovery workflow initiated using strategy: ${chosenAction}`,
    {
      customerName: payment.customerName,
      amount: payment.amount,
      status: 'pending',
      metadata: { action: chosenAction },
    }
  );

  const now = new Date().toISOString();
  return {
    paymentId,
    status: 'recovery_initiated',
    action: chosenAction,
    currentStage: 'recovery_strategy',
    stages: [
      { stage: 'failed_payment', label: 'Failed Payment', completedAt: now, status: 'completed' },
      { stage: 'ai_analysis', label: 'AI Analysis', completedAt: now, status: 'completed' },
      { stage: 'recovery_strategy', label: 'Recovery Strategy', status: 'active' },
      { stage: 'customer_outreach', label: 'Customer Outreach', status: 'pending' },
      { stage: 'payment_retry', label: 'Payment Retry', status: 'pending' },
      { stage: 'recovered', label: 'Recovered', status: 'pending' },
    ],
    message: `Recovery workflow initiated successfully for payment ${paymentId}`,
  };
};

export const simulatePaymentRetry = async (paymentId: string) => {
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found.`);
  }

  let recovery = await Recovery.findOne({ paymentId });
  if (!recovery) {
    recovery = await runPaymentAnalysis(paymentId);
  }

  const prob = recovery?.recoveryProbability ?? 60;
  // Deterministic simulation: >= 50% succeeds, or simulated dice roll biased by probability
  const isSuccessful = prob >= 60;

  payment.attemptNumber = (payment.attemptNumber || 1) + 1;

  if (isSuccessful) {
    payment.status = 'recovered';
    payment.successfulPaymentCount = (payment.successfulPaymentCount || 0) + 1;
    payment.lastSuccessfulPaymentAt = new Date();
    await payment.save();

    if (recovery) {
      recovery.status = 'COMPLETED';
      await recovery.save();
    }

    await logActivity(
      'PAYMENT_RECOVERED',
      paymentId,
      `Payment ${paymentId} of ₹${(payment.amount / 100).toLocaleString('en-IN')} successfully recovered! ✓`,
      {
        customerName: payment.customerName,
        amount: payment.amount,
        status: 'success',
        metadata: { recoveredAmount: payment.amount, attempt: payment.attemptNumber },
      }
    );

    return {
      success: true,
      paymentId,
      status: 'recovered',
      outcome: 'SUCCESS',
      message: `Payment of ₹${(payment.amount / 100).toLocaleString('en-IN')} recovered successfully!`,
      payment,
    };
  } else {
    payment.failedPaymentCount = (payment.failedPaymentCount || 0) + 1;
    await payment.save();

    await logActivity(
      'RETRY_ATTEMPTED',
      paymentId,
      `Payment retry attempt #${payment.attemptNumber} executed for ${payment.customerName}`,
      {
        customerName: payment.customerName,
        amount: payment.amount,
        status: 'pending',
        metadata: { attempt: payment.attemptNumber },
      }
    );

    return {
      success: false,
      paymentId,
      status: payment.status,
      outcome: 'RETRY_PENDING',
      message: `Retry attempt #${payment.attemptNumber} processed. Next retry scheduled.`,
      payment,
    };
  }
};

export const simulatePaymentSuccess = async (paymentId: string) => {
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new Error(`Payment with ID ${paymentId} not found.`);
  }

  payment.status = 'recovered';
  payment.successfulPaymentCount = (payment.successfulPaymentCount || 0) + 1;
  payment.lastSuccessfulPaymentAt = new Date();
  await payment.save();

  const recovery = await Recovery.findOne({ paymentId });
  if (recovery) {
    recovery.status = 'COMPLETED';
    await recovery.save();
  }

  await logActivity(
    'PAYMENT_RECOVERED',
    paymentId,
    `Payment ${paymentId} of ₹${(payment.amount / 100).toLocaleString('en-IN')} successfully recovered! ✓`,
    {
      customerName: payment.customerName,
      amount: payment.amount,
      status: 'success',
      metadata: { recoveredAmount: payment.amount },
    }
  );

  return {
    paymentId,
    status: 'recovered',
    message: `Payment ${paymentId} marked as recovered in simulated workflow.`,
    payment,
  };
};
