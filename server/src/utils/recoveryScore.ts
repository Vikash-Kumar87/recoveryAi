import { FailureReason, IPayment } from '../models/Payment.js';
import { CustomerReliability, RecoveryAction, PriorityLevel } from '../models/Recovery.js';

export interface DeterministicMetrics {
  successRatio: number;
  paymentHistoryScore: number;
  failureSeverityScore: number;
  customerReliability: CustomerReliability;
  heuristicProbability: number;
  suggestedAction: RecoveryAction;
  suggestedRetryTime: string;
  suggestedPriority: PriorityLevel;
  ruleExplanation: string;
}

export const calculateRecoveryMetrics = (payment: IPayment): DeterministicMetrics => {
  const total = payment.previousPaymentCount || 1;
  const successful = payment.successfulPaymentCount || 0;
  const failed = payment.failedPaymentCount || 0;

  // 1. Success Ratio
  const successRatio = total > 0 ? successful / total : 0.5;

  // 2. Payment History Score (0-100)
  let paymentHistoryScore = Math.round(successRatio * 70);
  if (successful > 5) paymentHistoryScore += 15;
  if (successful > 15) paymentHistoryScore += 15;
  paymentHistoryScore = Math.min(100, Math.max(0, paymentHistoryScore));

  // 3. Customer Reliability
  let customerReliability: CustomerReliability = 'LOW';
  if (successRatio >= 0.75 && successful >= 3) {
    customerReliability = 'HIGH';
  } else if (successRatio >= 0.4 || successful >= 1) {
    customerReliability = 'MEDIUM';
  }

  // 4. Failure Severity Score & Heuristics
  // Higher score means higher likelihood of fast recovery
  let failureSeverityScore = 50;
  let suggestedAction: RecoveryAction = 'RETRY_PAYMENT';
  let ruleExplanation = '';

  switch (payment.failureReason) {
    case 'BANK_TIMEOUT':
    case 'NETWORK_ERROR':
      failureSeverityScore = 85;
      suggestedAction = 'RETRY_PAYMENT';
      ruleExplanation = 'Transient network/bank infrastructure timeout with high customer success rate.';
      break;

    case 'INSUFFICIENT_FUNDS':
      failureSeverityScore = 55;
      suggestedAction = customerReliability === 'HIGH' ? 'WAIT_AND_RETRY' : 'SEND_REMINDER';
      ruleExplanation = 'Balance deficit typically resolves around salary/business cycle; scheduled wait & retry recommended.';
      break;

    case 'CARD_DECLINED':
      failureSeverityScore = 60;
      suggestedAction = 'SEND_PAYMENT_LINK';
      ruleExplanation = 'Card processor decline. Alternative payment instrument (UPI / NetBanking) link recommended.';
      break;

    case 'EXPIRED_CARD':
      failureSeverityScore = 45;
      suggestedAction = 'SEND_PAYMENT_LINK';
      ruleExplanation = 'Card expired on file. Urgent payment link with card update prompt needed.';
      break;

    case 'LIMIT_EXCEEDED':
      failureSeverityScore = 50;
      suggestedAction = 'SEND_REMINDER';
      ruleExplanation = 'Daily/Monthly transaction limit reached; notify user to adjust banking limit or retry next day.';
      break;

    case 'AUTHENTICATION_FAILED':
      failureSeverityScore = 70;
      suggestedAction = 'RETRY_PAYMENT';
      ruleExplanation = 'OTP/3DS auth drop-off; user likely abandoned screen and will complete on immediate retry.';
      break;

    default:
      failureSeverityScore = 50;
      suggestedAction = 'MANUAL_REVIEW';
      ruleExplanation = 'Unusual failure condition requiring secondary merchant verification.';
      break;
  }

  // Penalty for multiple consecutive attempts
  const attemptPenalty = Math.max(0, (payment.attemptNumber - 1) * 8);

  // Composite Heuristic Probability
  let heuristicProbability = Math.round(
    0.45 * failureSeverityScore + 0.45 * paymentHistoryScore - attemptPenalty + 10
  );
  heuristicProbability = Math.min(95, Math.max(15, heuristicProbability));

  // Suggested Retry Time
  let suggestedRetryTime = payment.preferredPaymentTime || '19:30';
  if (payment.failureReason === 'BANK_TIMEOUT') {
    suggestedRetryTime = 'Within 15 mins';
  } else if (payment.failureReason === 'INSUFFICIENT_FUNDS') {
    suggestedRetryTime = 'Tomorrow 10:00 AM';
  }

  // Priority based on amount and probability
  let suggestedPriority: PriorityLevel = 'MEDIUM';
  const amountInRupees = payment.amount / 100;
  if (amountInRupees >= 5000 && heuristicProbability >= 65) {
    suggestedPriority = 'HIGH';
  } else if (amountInRupees >= 15000) {
    suggestedPriority = 'HIGH';
  } else if (heuristicProbability < 40) {
    suggestedPriority = 'LOW';
  }

  return {
    successRatio,
    paymentHistoryScore,
    failureSeverityScore,
    customerReliability,
    heuristicProbability,
    suggestedAction,
    suggestedRetryTime,
    suggestedPriority,
    ruleExplanation,
  };
};
