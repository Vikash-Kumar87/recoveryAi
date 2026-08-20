import mongoose, { Schema, Document } from 'mongoose';

export type CustomerReliability = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecoveryAction =
  | 'RETRY_PAYMENT'
  | 'SEND_REMINDER'
  | 'SEND_PAYMENT_LINK'
  | 'WAIT_AND_RETRY'
  | 'MANUAL_REVIEW';
export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface IRecovery extends Document {
  paymentId: string;
  failureAnalysis: string;
  customerReliability: CustomerReliability;
  recoveryProbability: number; // 0 to 100
  recommendedAction: RecoveryAction;
  bestRetryTime: string;
  priority: PriorityLevel;
  reasoning: string;
  reasoningPoints: string[];
  expectedRecoveryValue: number;
  recoveryMessage: string;
  confidenceScore?: number;
  agentVersion?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const RecoverySchema: Schema = new Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    failureAnalysis: { type: String, required: true },
    customerReliability: {
      type: String,
      required: true,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
    },
    recoveryProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    recommendedAction: {
      type: String,
      required: true,
      enum: [
        'RETRY_PAYMENT',
        'SEND_REMINDER',
        'SEND_PAYMENT_LINK',
        'WAIT_AND_RETRY',
        'MANUAL_REVIEW',
      ],
    },
    bestRetryTime: { type: String, required: true },
    priority: {
      type: String,
      required: true,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
    },
    reasoning: { type: String, required: true },
    reasoningPoints: { type: [String], default: [] },
    expectedRecoveryValue: { type: Number, default: 0 },
    recoveryMessage: { type: String, required: true },
    confidenceScore: { type: Number, default: 92 },
    agentVersion: { type: String, default: 'Groq AI (Llama 3.3)' },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

export const Recovery = mongoose.model<IRecovery>('Recovery', RecoverySchema);
