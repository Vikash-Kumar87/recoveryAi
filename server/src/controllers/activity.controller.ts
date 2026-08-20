import { Request, Response, NextFunction } from 'express';
import { getActivities } from '../services/activity.service.js';

// Map backend Activity model types/fields → frontend ActivityEvent interface shape
const mapActivityToFrontend = (a: any) => {
  // Normalize type: backend uses SCREAMING_SNAKE_CASE, frontend uses lowercase_snake_case
  const typeMap: Record<string, string> = {
    AI_ANALYSIS: 'ai_analysis',
    RECOVERY_RECOMMENDED: 'action_recommended',
    RECOVERY_INITIATED: 'workflow_started',
    MESSAGE_GENERATED: 'message_sent',
    PAYMENT_RECOVERED: 'payment_recovered',
    RETRY_ATTEMPTED: 'retry_attempted',
    PAYMENT_FAILED: 'payment_failed_retry',
    PROBABILITY_CALCULATED: 'probability_calculated',
  };

  const normalizedType = typeMap[a.type] ?? 'ai_analysis';

  // Build title and description from backend 'message' field
  let title = '';
  let description = '';
  const msg: string = a.message || '';

  switch (a.type) {
    case 'AI_ANALYSIS':
      title = 'AI Recovery Analysis';
      description = msg;
      break;
    case 'RECOVERY_RECOMMENDED':
      title = 'Recovery Strategy Recommended';
      description = msg;
      break;
    case 'RECOVERY_INITIATED':
      title = 'Recovery Workflow Started';
      description = msg;
      break;
    case 'MESSAGE_GENERATED':
      title = 'Recovery Message Generated';
      description = msg;
      break;
    case 'PAYMENT_RECOVERED':
      title = '✓ Payment Successfully Recovered';
      description = msg;
      break;
    case 'RETRY_ATTEMPTED':
      title = 'Payment Retry Attempted';
      description = msg;
      break;
    case 'PAYMENT_FAILED':
      title = 'Recovery Attempt Failed';
      description = msg;
      break;
    default:
      title = 'AI Agent Event';
      description = msg;
  }

  return {
    id: a._id?.toString() ?? String(Math.random()),
    type: normalizedType,
    title,
    description,
    paymentId: a.paymentId,
    customerName: a.customerName,
    amount: a.amount,
    metadata: a.metadata,
    timestamp: a.createdAt ?? new Date().toISOString(),
    status: a.status || 'info',
  };
};

export const getActivityHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const type = req.query.type as string;
    const status = req.query.status as string;

    const result = await getActivities(page, limit, type, status);

    const mappedData = (result.data || []).map(mapActivityToFrontend);

    return res.status(200).json({
      success: true,
      data: mappedData,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};
