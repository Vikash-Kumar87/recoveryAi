import mongoose, { Schema, Document } from 'mongoose';

export type ActivityType =
  | 'AI_ANALYSIS'
  | 'RECOVERY_RECOMMENDED'
  | 'RECOVERY_INITIATED'
  | 'MESSAGE_GENERATED'
  | 'MESSAGE_SENT'
  | 'RETRY_ATTEMPTED'
  | 'PAYMENT_RECOVERED';

export interface IActivity extends Document {
  type: ActivityType;
  paymentId: string;
  message: string;
  customerName?: string;
  amount?: number;
  status: 'success' | 'pending' | 'failed' | 'info';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'AI_ANALYSIS',
        'RECOVERY_RECOMMENDED',
        'RECOVERY_INITIATED',
        'MESSAGE_GENERATED',
        'MESSAGE_SENT',
        'RETRY_ATTEMPTED',
        'PAYMENT_RECOVERED',
      ],
      index: true,
    },
    paymentId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    customerName: { type: String },
    amount: { type: Number },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed', 'info'],
      default: 'info',
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
