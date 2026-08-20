import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus =
  | 'pending'
  | 'ai_analyzed'
  | 'recovery_initiated'
  | 'recovered'
  | 'failed';

export type FailureReason =
  | 'INSUFFICIENT_FUNDS'
  | 'CARD_DECLINED'
  | 'BANK_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'EXPIRED_CARD'
  | 'LIMIT_EXCEEDED'
  | 'AUTHENTICATION_FAILED'
  | 'OTHER';

export interface IPayment extends Document {
  paymentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number; // in paise (e.g. 299900 = ₹2,999) or rupees
  currency: string;
  failureReason: FailureReason;
  attemptNumber: number;
  previousPaymentCount: number;
  successfulPaymentCount: number;
  failedPaymentCount: number;
  lastSuccessfulPaymentAt?: Date;
  preferredPaymentTime?: string;
  status: PaymentStatus;
  gatewayCode?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    failureReason: {
      type: String,
      required: true,
      enum: [
        'INSUFFICIENT_FUNDS',
        'CARD_DECLINED',
        'BANK_TIMEOUT',
        'NETWORK_ERROR',
        'EXPIRED_CARD',
        'LIMIT_EXCEEDED',
        'AUTHENTICATION_FAILED',
        'OTHER',
      ],
      index: true,
    },
    attemptNumber: { type: Number, default: 1 },
    previousPaymentCount: { type: Number, default: 0 },
    successfulPaymentCount: { type: Number, default: 0 },
    failedPaymentCount: { type: Number, default: 0 },
    lastSuccessfulPaymentAt: { type: Date },
    preferredPaymentTime: { type: String, default: '19:30' },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'ai_analyzed', 'recovery_initiated', 'recovered', 'failed'],
      default: 'pending',
      index: true,
    },
    gatewayCode: { type: String },
    orderId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
