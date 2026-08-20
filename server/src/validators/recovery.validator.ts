import { z } from 'zod';

export const analyzePaymentSchema = z.object({
  body: z.object({
    paymentId: z.string({
      required_error: 'paymentId is required',
    }).min(1, 'paymentId cannot be empty'),
  }),
});

export const recoveryMessageSchema = z.object({
  body: z.object({
    paymentId: z.string({
      required_error: 'paymentId is required',
    }).min(1, 'paymentId cannot be empty'),
  }),
});

export const startRecoverySchema = z.object({
  body: z.object({
    paymentId: z.string({
      required_error: 'paymentId is required',
    }).min(1, 'paymentId cannot be empty'),
    action: z
      .enum([
        'RETRY_PAYMENT',
        'SEND_REMINDER',
        'SEND_PAYMENT_LINK',
        'WAIT_AND_RETRY',
        'MANUAL_REVIEW',
      ])
      .optional(),
  }),
});

export const simulateSuccessSchema = z.object({
  body: z.object({
    paymentId: z.string({
      required_error: 'paymentId is required',
    }).min(1, 'paymentId cannot be empty'),
  }),
});
