import { z } from 'zod';

// Accept both lowercase (from frontend) and UPPERCASE (direct) values
const VALID_FAILURE_REASONS = [
  'INSUFFICIENT_FUNDS', 'insufficient_funds',
  'CARD_DECLINED', 'card_declined',
  'BANK_TIMEOUT', 'bank_timeout',
  'NETWORK_ERROR', 'network_error',
  'EXPIRED_CARD', 'expired_card',
  'LIMIT_EXCEEDED', 'limit_exceeded',
  'AUTHENTICATION_FAILED', 'authentication_failed',
  'OTHER', 'other',
  '',
] as const;

export const getPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    status: z
      .enum(['pending', 'ai_analyzed', 'recovery_initiated', 'recovered', 'failed', ''])
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
    failureReason: z
      .enum(VALID_FAILURE_REASONS)
      .optional()
      // Normalize to UPPERCASE to match MongoDB stored values
      .transform((val) => (val === '' || !val ? undefined : val.toUpperCase())),
    search: z.string().optional(),
    sortBy: z.enum(['amount', 'recoveryProbability', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const getPaymentParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment ID param is required'),
  }),
});
