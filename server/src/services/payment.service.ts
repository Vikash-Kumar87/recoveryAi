import { Payment, IPayment, PaymentStatus, FailureReason } from '../models/Payment.js';
import { Recovery, IRecovery } from '../models/Recovery.js';

export interface PaymentFilterOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  failureReason?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const mapPaymentToResponse = (p: any, recovery?: any) => {
  const failureReasonNormalized = (p.failureReason || 'OTHER').toLowerCase();
  const avatarInitials = p.customerName
    ? p.customerName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'CU';

  const totalPayments = p.previousPaymentCount || 1;
  const successfulPayments = p.successfulPaymentCount || 0;
  const successRate = Math.round((successfulPayments / totalPayments) * 100);

  let segment: 'premium' | 'regular' | 'new' | 'at_risk' = 'regular';
  if (p.amount >= 1000000 || successfulPayments >= 10) {
    segment = 'premium';
  } else if (p.failedPaymentCount >= 3) {
    segment = 'at_risk';
  } else if (p.previousPaymentCount <= 2) {
    segment = 'new';
  }

  const recoveryProbability =
    recovery?.recoveryProbability ??
    (p.status === 'recovered' ? 100 : p.status === 'failed' ? 25 : 65);

  return {
    _id: p._id,
    id: p.paymentId,
    paymentId: p.paymentId,
    razorpayPaymentId: p.paymentId,
    customerId: p.customerId,
    customerName: p.customerName,
    customerEmail: p.customerEmail,
    customer: {
      id: p.customerId,
      name: p.customerName,
      email: p.customerEmail,
      phone: '+91 98765 ' + String(Math.floor(10000 + Math.random() * 90000)),
      avatarInitials,
      totalPayments,
      successfulPayments,
      failedPayments: p.failedPaymentCount || 0,
      successRate,
      avgTransactionValue: p.amount,
      customerSince: 'Jan 2024',
      riskScore: Math.max(10, 100 - successRate),
      segment,
    },
    amount: p.amount,
    currency: p.currency || 'INR',
    failureReason: failureReasonNormalized,
    rawFailureReason: p.failureReason,
    failureMessage: `Transaction failed due to ${p.failureReason?.replace(/_/g, ' ').toLowerCase() || 'network issue'} during authorization`,
    gatewayCode: p.gatewayCode || `GATEWAY_ERR_${p.failureReason}`,
    status: p.status,
    attemptNumber: p.attemptNumber,
    attemptCount: p.attemptNumber,
    attempts: [
      {
        attemptNumber: 1,
        timestamp: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        status: p.status === 'recovered' ? 'success' : 'failed',
        failureReason: failureReasonNormalized,
        gatewayCode: p.gatewayCode,
      },
    ],
    previousPaymentCount: p.previousPaymentCount,
    successfulPaymentCount: p.successfulPaymentCount,
    failedPaymentCount: p.failedPaymentCount,
    lastSuccessfulPaymentAt: p.lastSuccessfulPaymentAt,
    preferredPaymentTime: p.preferredPaymentTime,
    recoveryProbability,
    recoveryAnalysis: recovery || null,
    orderId: p.orderId || `order_${p.paymentId}`,
    description: `Order & Revenue Recovery for ${p.customerName}`,
    bank: 'HDFC Bank',
    card: {
      network: 'Visa',
      last4: '4242',
      type: 'credit',
    },
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
  };
};

export const getPaymentsList = async (options: PaymentFilterOptions = {}) => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (options.status && options.status.trim()) {
    query.status = options.status.trim().toLowerCase();
  }

  if (options.failureReason && options.failureReason.trim()) {
    const r = options.failureReason.trim().toUpperCase();
    query.failureReason = r;
  }

  if (options.search && options.search.trim()) {
    const searchRegex = new RegExp(options.search.trim(), 'i');
    query.$or = [
      { paymentId: searchRegex },
      { customerName: searchRegex },
      { customerEmail: searchRegex },
      { orderId: searchRegex },
    ];
  }

  const sortField = options.sortBy || 'createdAt';
  const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [payments, total] = await Promise.all([
    Payment.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
    Payment.countDocuments(query),
  ]);

  // Fetch recovery analysis metadata
  const paymentIds = payments.map((p) => p.paymentId);
  const recoveries = await Recovery.find({ paymentId: { $in: paymentIds } }).lean();
  const recoveryMap = new Map<string, IRecovery>();
  recoveries.forEach((r) => recoveryMap.set(r.paymentId, r as unknown as IRecovery));

  const enrichedPayments = payments.map((p) => {
    const recovery = recoveryMap.get(p.paymentId);
    return mapPaymentToResponse(p, recovery);
  });

  return {
    data: enrichedPayments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    // Also include nested structure for alternate client schemas
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    payments: enrichedPayments,
  };
};

export const getPaymentDetails = async (idOrPaymentId: string) => {
  const payment = await Payment.findOne({
    $or: [
      { paymentId: idOrPaymentId },
      { _id: idOrPaymentId.match(/^[0-9a-fA-F]{24}$/) ? idOrPaymentId : null },
    ],
  }).lean();

  if (!payment) return null;

  const recovery = await Recovery.findOne({ paymentId: payment.paymentId }).lean();
  return mapPaymentToResponse(payment, recovery);
};
