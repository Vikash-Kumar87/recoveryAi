import { Activity, ActivityType, IActivity } from '../models/Activity.js';
import { logger } from '../utils/logger.js';

export const logActivity = async (
  type: ActivityType,
  paymentId: string,
  message: string,
  options?: {
    customerName?: string;
    amount?: number;
    status?: 'success' | 'pending' | 'failed' | 'info';
    metadata?: Record<string, unknown>;
  }
): Promise<IActivity> => {
  try {
    const activity = new Activity({
      type,
      paymentId,
      message,
      customerName: options?.customerName,
      amount: options?.amount,
      status: options?.status || 'info',
      metadata: options?.metadata,
    });
    await activity.save();
    logger.info(`Activity logged: [${type}] ${paymentId} - ${message}`);
    return activity;
  } catch (error) {
    logger.error('Failed to log activity event:', error);
    // Return unpersisted instance so caller doesn't break
    return new Activity({
      type,
      paymentId,
      message,
      customerName: options?.customerName,
      amount: options?.amount,
      status: options?.status || 'info',
    });
  }
};

export const getActivities = async (page = 1, limit = 20, type?: string, status?: string) => {
  const query: Record<string, unknown> = {};
  if (type) query.type = type;
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Activity.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Activity.countDocuments(query),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
