// ============================================================
// RecoverAI — Core TypeScript Types & Interfaces
// ============================================================

export type PaymentStatus =
  | 'pending'
  | 'ai_analyzed'
  | 'recovery_initiated'
  | 'recovered'
  | 'failed';

export type FailureReason =
  | 'insufficient_funds'
  | 'card_declined'
  | 'bank_timeout'
  | 'network_error'
  | 'expired_card'
  | 'authentication_failed'
  | 'limit_exceeded'
  | 'other';

export type RecoveryAction =
  | 'RETRY_PAYMENT'
  | 'SEND_REMINDER'
  | 'SEND_PAYMENT_LINK'
  | 'WAIT_AND_RETRY'
  | 'MANUAL_REVIEW';

export type CustomerReliability = 'HIGH' | 'MEDIUM' | 'LOW';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

// ──────────────────────────────────────────────────────────────
// Customer
// ──────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarInitials: string;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  successRate: number;
  avgTransactionValue: number;
  customerSince: string;
  riskScore: number; // 0–100 (lower = safer)
  segment: 'premium' | 'regular' | 'new' | 'at_risk';
}

// ──────────────────────────────────────────────────────────────
// Payment
// ──────────────────────────────────────────────────────────────
export interface PaymentAttempt {
  attemptNumber: number;
  timestamp: string;
  status: 'success' | 'failed';
  failureReason?: FailureReason;
  gatewayCode?: string;
}

export interface Payment {
  id: string;
  razorpayPaymentId: string;
  customer: Customer;
  amount: number; // in paise
  currency: string;
  failureReason: FailureReason;
  failureMessage: string;
  gatewayCode: string;
  status: PaymentStatus;
  attemptCount: number;
  attempts: PaymentAttempt[];
  recoveryProbability: number; // 0–100
  createdAt: string;
  updatedAt: string;
  orderId: string;
  description: string;
  bank?: string;
  card?: {
    network: string;
    last4: string;
    type: string;
  };
  // Backend alias fields (optional, for compatibility)
  customerName?: string;
  customerEmail?: string;
}

// ──────────────────────────────────────────────────────────────
// AI Analysis
// ──────────────────────────────────────────────────────────────
export interface AIAnalysis {
  paymentId: string;
  failureAnalysis: string;
  customerReliability: CustomerReliability;
  recoveryProbability: number;
  recommendedAction: RecoveryAction;
  bestRetryTime: string;
  priority: Priority;
  reasoning: string;
  confidenceScore: number; // 0–100
  suggestedMessage: string;    // mapped from backend recoveryMessage
  recoveryMessage?: string;    // raw backend field alias
  reasoningPoints?: string[];  // structured decision points
  expectedRecoveryValue?: number; // expected recoverable amount in INR
  analysisTimestamp: string;
  agentVersion: string;
  status?: string;
}

export interface MerchantSettings {
  enableAiRecovery: boolean;
  autoStartRecovery: boolean;
  autoSendMessages: boolean;
  recoveryThreshold: number;
  maxRetryAttempts: number;
  emailAlerts: boolean;
  smsAlerts: boolean;
  alertEmail: string;
  webhookEnabled: boolean;
}

// ──────────────────────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalPayments: number;
  failedPayments: number;
  potentialRevenue: number; // in paise
  recoveredRevenue: number; // in paise
  recoveryRate: number; // percentage
  aiAnalysisCount: number;
  avgRecoveryTime: number; // in hours
  pendingRecoveries: number;
}

export interface RevenueDataPoint {
  month: string;
  failed: number;
  recovered: number;
}

export interface FailureReasonDataPoint {
  reason: string;
  count: number;
  percentage: number;
}

export interface RecoveryPerformanceDataPoint {
  week: string;
  attempted: number;
  recovered: number;
  rate: number;
}

export interface RecentActivity {
  id: string;
  type:
    | 'analyzed'
    | 'recovery_initiated'
    | 'recovered'
    | 'message_sent'
    | 'retry_scheduled';
  paymentId: string;
  customerName: string;
  amount: number;
  action: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

export interface DashboardData {
  stats: DashboardStats;
  revenueData: RevenueDataPoint[];
  failureReasons: FailureReasonDataPoint[];
  recoveryPerformance: RecoveryPerformanceDataPoint[];
  recentActivity: RecentActivity[];
}

// ──────────────────────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────────────────────
export interface AnalyticsData {
  overview: {
    failedRevenue: number;
    recoveredRevenue: number;
    recoveryRate: number;
    avgRecoveryTime: number;
    aiRecommendedRecoveries: number;
  };
  revenueOverTime: RevenueDataPoint[];
  recoveryRateByReason: Array<{
    reason: string;
    total: number;
    recovered: number;
    rate: number;
  }>;
  probabilityDistribution: Array<{
    range: string;
    count: number;
  }>;
  aiPerformance: {
    totalRecommendations: number;
    successfulRecoveries: number;
    avgConfidence: number;
    bestStrategy: RecoveryAction;
    strategyBreakdown: Array<{
      action: RecoveryAction;
      count: number;
      successRate: number;
    }>;
  };
}

// ──────────────────────────────────────────────────────────────
// Activity
// ──────────────────────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  type:
    | 'ai_analysis'
    | 'probability_calculated'
    | 'action_recommended'
    | 'workflow_started'
    | 'message_sent'
    | 'retry_attempted'
    | 'payment_recovered'
    | 'payment_failed_retry';
  title: string;
  description: string;
  paymentId: string;
  customerName?: string;
  metadata?: Record<string, string | number | boolean>;
  timestamp: string;
  status: 'success' | 'pending' | 'failed' | 'info';
}

// ──────────────────────────────────────────────────────────────
// API Responses
// ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentsFilter {
  status?: PaymentStatus;
  failureReason?: FailureReason;
  search?: string;
  sortBy?: 'amount' | 'recoveryProbability' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ──────────────────────────────────────────────────────────────
// Recovery Workflow
// ──────────────────────────────────────────────────────────────
export type WorkflowStage =
  | 'failed_payment'
  | 'ai_analysis'
  | 'recovery_strategy'
  | 'customer_outreach'
  | 'payment_retry'
  | 'recovered';

export interface RecoveryWorkflowStatus {
  paymentId: string;
  currentStage: WorkflowStage;
  stages: Array<{
    stage: WorkflowStage;
    label: string;
    completedAt?: string;
    status: 'completed' | 'active' | 'pending' | 'failed';
  }>;
  startedAt: string;
  estimatedCompletionAt?: string;
}

// ──────────────────────────────────────────────────────────────
// UI State
// ──────────────────────────────────────────────────────────────
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface AppStore {
  toasts: ToastMessage[];
  sidebarOpen: boolean;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
}
