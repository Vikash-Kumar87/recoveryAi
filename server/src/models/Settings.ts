import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  enableAiRecovery: boolean;
  autoStartRecovery: boolean;
  autoSendMessages: boolean;
  recoveryThreshold: number; // e.g. 70
  maxRetryAttempts: number; // e.g. 3
  emailAlerts: boolean;
  smsAlerts: boolean;
  alertEmail: string;
  webhookEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    enableAiRecovery: { type: Boolean, default: true },
    autoStartRecovery: { type: Boolean, default: true },
    autoSendMessages: { type: Boolean, default: false },
    recoveryThreshold: { type: Number, default: 70, min: 0, max: 100 },
    maxRetryAttempts: { type: Number, default: 3, min: 1, max: 10 },
    emailAlerts: { type: Boolean, default: true },
    smsAlerts: { type: Boolean, default: false },
    alertEmail: { type: String, default: 'merchant@recoverai.in' },
    webhookEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
