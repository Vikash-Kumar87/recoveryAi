// ============================================================
// RecoverAI — Axios API Service Layer
// ============================================================
import axios, { AxiosError } from 'axios';
import type {
  DashboardData,
  Payment,
  PaymentsFilter,
  PaginatedResponse,
  AIAnalysis,
  AnalyticsData,
  ActivityEvent,
  RecoveryWorkflowStatus,
  ApiResponse,
  MerchantSettings,
} from '../types';
import {
  MOCK_DASHBOARD,
  MOCK_PAYMENTS,
  MOCK_ANALYTICS,
  MOCK_ACTIVITY,
} from './mockData';

// ──────────────────────────────────────────────────────────────
// Axios Instance
// ──────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recoverai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('recoverai_token');
    }
    return Promise.reject(error);
  }
);

// Helper — determine if backend is configured
const isBackendConfigured = (): boolean => {
  return Boolean(BASE_URL && BASE_URL.length > 0);
};

// Simulated network delay for mock responses
const mockDelay = (ms = 600): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ──────────────────────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────────────────────
export const getDashboardStats = async (): Promise<DashboardData> => {
  if (!isBackendConfigured()) {
    await mockDelay(700);
    return MOCK_DASHBOARD;
  }
  const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard/stats');
  return data.data;
};

// ──────────────────────────────────────────────────────────────
// Payments
// ──────────────────────────────────────────────────────────────
export const getPayments = async (
  filters?: PaymentsFilter
): Promise<PaginatedResponse<Payment>> => {
  if (!isBackendConfigured()) {
    await mockDelay(500);
    let results = [...MOCK_PAYMENTS];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.customer.name.toLowerCase().includes(q) ||
          p.customer.email.toLowerCase().includes(q)
      );
    }
    if (filters?.status) {
      results = results.filter((p) => p.status === filters.status);
    }
    if (filters?.failureReason) {
      results = results.filter((p) => p.failureReason === filters.failureReason);
    }
    if (filters?.sortBy === 'amount') {
      results.sort((a, b) =>
        filters.sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount
      );
    }
    if (filters?.sortBy === 'recoveryProbability') {
      results.sort((a, b) =>
        filters.sortOrder === 'asc'
          ? a.recoveryProbability - b.recoveryProbability
          : b.recoveryProbability - a.recoveryProbability
      );
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 25;
    const start = (page - 1) * limit;
    const paged = results.slice(start, start + limit);

    return {
      success: true,
      data: paged,
      total: results.length,
      page,
      limit,
      totalPages: Math.ceil(results.length / limit),
    };
  }

  const { data } = await api.get<PaginatedResponse<Payment>>('/payments', {
    params: { limit: 25, ...filters },
  });
  return data;
};

export const getPaymentById = async (id: string): Promise<Payment> => {
  if (!isBackendConfigured()) {
    await mockDelay(400);
    const payment = MOCK_PAYMENTS.find((p) => p.id === id);
    if (!payment) throw new Error(`Payment ${id} not found`);
    return payment;
  }
  const { data } = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
  return data.data;
};

// ──────────────────────────────────────────────────────────────
// AI Recovery
// ──────────────────────────────────────────────────────────────
export const analyzePayment = async (paymentId: string): Promise<AIAnalysis> => {
  if (!isBackendConfigured()) {
    await mockDelay(2000);
    const payment = MOCK_PAYMENTS.find((p) => p.id === paymentId);
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    const defaultAnalysis: AIAnalysis = {
      paymentId,
      failureAnalysis: `Payment failure analysis for ${paymentId}. Transient gateway timeout identified during authorization.`,
      customerReliability: 'HIGH',
      recoveryProbability: 82,
      recommendedAction: 'RETRY_PAYMENT',
      bestRetryTime: '19:30',
      priority: 'HIGH',
      reasoning: 'Customer has 5 previous successful orders and consistent transaction history.',
      reasoningPoints: [
        'Failure reason: Bank Timeout',
        'Previous attempts: 2',
        'Previous successful payments: 5',
        'Customer reliability: HIGH',
        'Recovery probability: 82%',
      ],
      expectedRecoveryValue: Math.round((payment.amount / 100) * 0.82),
      confidenceScore: 92,
      suggestedMessage: `Hi ${payment.customer.name.split(' ')[0]}, your recent payment could not be completed. You can securely retry now.`,
      analysisTimestamp: new Date().toISOString(),
      agentVersion: 'RecoverAI v2.4 (Groq Llama 3.3)',
    };
    return defaultAnalysis;
  }

  const { data } = await api.post<ApiResponse<AIAnalysis>>('/recovery/analyze', {
    paymentId,
  });
  return data.data;
};

export const generateRecoveryMessage = async (
  paymentId: string,
  tone?: string
): Promise<{ message: string; channelRecommendation?: string; reason?: string }> => {
  if (!isBackendConfigured()) {
    await mockDelay(1000);
    const payment = MOCK_PAYMENTS.find((p) => p.id === paymentId);
    const name = payment?.customer.name.split(' ')[0] ?? 'Customer';
    const amount = payment ? (payment.amount / 100).toLocaleString('en-IN') : '1,499';
    return {
      message: `Hi ${name}, your payment of ₹${amount} could not be completed due to a temporary bank timeout. You can securely retry your payment now to keep your account active: https://rzp.io/l/retry-${paymentId}`,
      channelRecommendation: 'WhatsApp + SMS',
      reason: 'High open-rate channel for fast action on failed payments',
    };
  }

  const { data } = await api.post<ApiResponse<{ message: string; channelRecommendation?: string; reason?: string }>>(
    '/recovery/message',
    { paymentId, tone }
  );
  return data.data;
};

export const startRecoveryWorkflow = async (
  paymentId: string,
  action: string
): Promise<RecoveryWorkflowStatus> => {
  if (!isBackendConfigured()) {
    await mockDelay(1000);
    const now = new Date().toISOString();
    return {
      paymentId,
      currentStage: 'recovery_strategy',
      stages: [
        { stage: 'failed_payment', label: 'Failed Payment', completedAt: now, status: 'completed' },
        { stage: 'ai_analysis', label: 'AI Analysis', completedAt: now, status: 'completed' },
        { stage: 'recovery_strategy', label: 'Recovery Strategy', status: 'active' },
        { stage: 'customer_outreach', label: 'Customer Outreach', status: 'pending' },
        { stage: 'payment_retry', label: 'Payment Retry', status: 'pending' },
        { stage: 'recovered', label: 'Recovered', status: 'pending' },
      ],
      startedAt: now,
      estimatedCompletionAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    };
  }

  const { data } = await api.post<ApiResponse<RecoveryWorkflowStatus>>(
    '/recovery/start',
    { paymentId, action }
  );
  return data.data;
};

export const retryPayment = async (paymentId: string) => {
  if (!isBackendConfigured()) {
    await mockDelay(1200);
    return { success: true, status: 'recovered', message: 'Payment successfully recovered! ✓' };
  }
  const { data } = await api.post<ApiResponse<any>>('/recovery/retry', { paymentId });
  return data.data;
};

export const sendOutreachMessage = async (paymentId: string, channel = 'WhatsApp') => {
  if (!isBackendConfigured()) {
    await mockDelay(800);
    return { success: true, message: 'Message sent via ' + channel };
  }
  const { data } = await api.post<ApiResponse<any>>('/recovery/outreach', { paymentId, channel });
  return data.data;
};

export const simulatePaymentSuccess = async (paymentId: string) => {
  if (!isBackendConfigured()) {
    await mockDelay(800);
    return { success: true, status: 'recovered', message: 'Payment marked as recovered' };
  }
  const { data } = await api.post<ApiResponse<any>>('/recovery/simulate-success', { paymentId });
  return data.data;
};

// ──────────────────────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────────────────────
export const getAnalytics = async (): Promise<AnalyticsData> => {
  if (!isBackendConfigured()) {
    await mockDelay(600);
    return MOCK_ANALYTICS;
  }
  const { data } = await api.get<ApiResponse<AnalyticsData>>('/analytics');
  return data.data;
};

// ──────────────────────────────────────────────────────────────
// Activity
// ──────────────────────────────────────────────────────────────
export const getActivity = async (limit = 50): Promise<ActivityEvent[]> => {
  if (!isBackendConfigured()) {
    await mockDelay(400);
    return MOCK_ACTIVITY;
  }
  const response = await api.get('/activity', { params: { limit, page: 1 } });
  const body = response.data;
  const events = Array.isArray(body?.data) ? body.data : body?.data?.data ?? [];
  return events;
};

// ──────────────────────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────────────────────
export const getSettings = async (): Promise<MerchantSettings> => {
  if (!isBackendConfigured()) {
    return {
      enableAiRecovery: true,
      autoStartRecovery: true,
      autoSendMessages: false,
      recoveryThreshold: 70,
      maxRetryAttempts: 3,
      emailAlerts: true,
      smsAlerts: false,
      alertEmail: 'merchant@recoverai.in',
      webhookEnabled: false,
    };
  }
  const { data } = await api.get<ApiResponse<MerchantSettings>>('/settings');
  return data.data;
};

export const updateSettings = async (
  settings: Partial<MerchantSettings>
): Promise<MerchantSettings> => {
  if (!isBackendConfigured()) {
    return settings as MerchantSettings;
  }
  const { data } = await api.put<ApiResponse<MerchantSettings>>('/settings', settings);
  return data.data;
};

export default api;
