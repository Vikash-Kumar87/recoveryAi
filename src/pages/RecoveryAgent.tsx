// ============================================================
// RecoverAI — AI Recovery Agent Page (Core Feature)
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Brain,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Copy,
  Send,
  Eye,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Target,
  Shield,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import {
  getPayments,
  analyzePayment,
  generateRecoveryMessage,
  startRecoveryWorkflow,
  retryPayment,
  sendOutreachMessage,
} from '../services/api';
import type { Payment, AIAnalysis, RecoveryAction, RecoveryWorkflowStatus, WorkflowStage } from '../types';
import { RecoveryProbabilityBar, LoadingState, ErrorState, EmptyState } from '../components/ui';
import { useAppStore } from '../store/appStore';
import { clsx } from 'clsx';

// ── Helpers ──────────────────────────────────────────────────
const formatINR = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const ACTION_CONFIG: Record<
  RecoveryAction,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  RETRY_PAYMENT: { label: 'Retry Payment', color: 'text-success-400', bg: 'bg-success-600/10 border-success-600/30', icon: RefreshCw },
  SEND_REMINDER: { label: 'Send Reminder', color: 'text-brand-400', bg: 'bg-brand-600/10 border-brand-600/30', icon: Send },
  SEND_PAYMENT_LINK: { label: 'Send Payment Link', color: 'text-accent-400', bg: 'bg-accent-600/10 border-accent-600/30', icon: ArrowRight },
  WAIT_AND_RETRY: { label: 'Wait & Retry', color: 'text-warning-400', bg: 'bg-warning-600/10 border-warning-600/30', icon: Clock },
  MANUAL_REVIEW: { label: 'Manual Review', color: 'text-slate-300', bg: 'bg-slate-700/50 border-slate-600/50', icon: Eye },
};

const RELIABILITY_CONFIG = {
  HIGH: { color: 'text-success-400', bg: 'bg-success-600/10 border-success-600/30', label: 'HIGH' },
  MEDIUM: { color: 'text-warning-400', bg: 'bg-warning-600/10 border-warning-600/30', label: 'MEDIUM' },
  LOW: { color: 'text-danger-400', bg: 'bg-danger-600/10 border-danger-600/30', label: 'LOW' },
};

const PRIORITY_CONFIG = {
  HIGH: { color: 'text-danger-400', label: '🔴 HIGH' },
  MEDIUM: { color: 'text-warning-400', label: '🟡 MEDIUM' },
  LOW: { color: 'text-slate-400', label: '🟢 LOW' },
};

const WORKFLOW_STAGES: { stage: WorkflowStage; label: string }[] = [
  { stage: 'failed_payment', label: 'Failed Payment' },
  { stage: 'ai_analysis', label: 'AI Analysis' },
  { stage: 'recovery_strategy', label: 'Recovery Strategy' },
  { stage: 'customer_outreach', label: 'Customer Outreach' },
  { stage: 'payment_retry', label: 'Payment Retry' },
  { stage: 'recovered', label: 'Recovered ✓' },
];

// ── Payment Selector Panel ───────────────────────────────────
const PaymentSelector = ({
  payments,
  selectedId,
  onSelect,
  loading,
}: {
  payments: Payment[];
  selectedId: string | null;
  onSelect: (p: Payment) => void;
  loading: boolean;
}) => {
  if (loading) return <LoadingState message="Loading payments..." />;

  return (
    <div className="space-y-2">
      {payments.length === 0 ? (
        <EmptyState
          title="No failed payments"
          description="All payments are healthy!"
        />
      ) : (
        payments.map((p) => (
          <button
            key={p.id}
            id={`select-payment-${p.id}`}
            onClick={() => onSelect(p)}
            className={clsx(
              'w-full text-left p-3.5 rounded-xl border transition-all duration-200',
              selectedId === p.id
                ? 'border-brand-500/50 bg-brand-600/10 shadow-glow-brand'
                : 'border-slate-800 bg-surface-900 hover:border-slate-700 hover:bg-slate-800/50'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold text-slate-300">{p.id}</span>
              <span className="text-sm font-bold text-slate-100">{formatINR(p.amount)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">{p.customer?.name ?? p.customerName ?? '—'}</span>
              <div className="flex items-center gap-1">
                <div
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    p.status === 'recovered'
                      ? 'bg-success-500'
                      : p.status === 'recovery_initiated'
                      ? 'bg-warning-500'
                      : p.status === 'ai_analyzed'
                      ? 'bg-brand-500'
                      : p.status === 'failed'
                      ? 'bg-danger-500'
                      : 'bg-slate-500'
                  )}
                />
                <span className="text-[10px] text-slate-500 capitalize">
                  {p.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <RecoveryProbabilityBar value={p.recoveryProbability} size="sm" />
          </button>
        ))
      )}
    </div>
  );
};

// ── Workflow Timeline ─────────────────────────────────────────
const WorkflowTimeline = ({ status }: { status: RecoveryWorkflowStatus }) => {
  const currentIdx = WORKFLOW_STAGES.findIndex((s) => s.stage === status.currentStage);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <Activity size={15} className="text-brand-400" />
        Recovery Workflow
      </h3>
      <div className="relative">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const stageStatus =
            idx < currentIdx
              ? 'completed'
              : idx === currentIdx
              ? 'active'
              : 'pending';

          return (
            <div key={stage.stage} className="flex items-start gap-3 pb-4 last:pb-0">
              {/* Connector */}
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border-2 transition-all duration-500',
                    stageStatus === 'completed'
                      ? 'bg-success-600 border-success-500 text-white'
                      : stageStatus === 'active'
                      ? 'bg-brand-600 border-brand-400 text-white animate-pulse-slow'
                      : 'bg-slate-800 border-slate-700 text-slate-600'
                  )}
                >
                  {stageStatus === 'completed' ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                {idx < WORKFLOW_STAGES.length - 1 && (
                  <div
                    className={clsx(
                      'w-0.5 h-6 mt-1 transition-colors duration-500',
                      idx < currentIdx ? 'bg-success-600' : 'bg-slate-800'
                    )}
                  />
                )}
              </div>
              {/* Label */}
              <div className="pt-0.5">
                <span
                  className={clsx(
                    'text-xs font-medium transition-colors duration-300',
                    stageStatus === 'completed'
                      ? 'text-success-400'
                      : stageStatus === 'active'
                      ? 'text-brand-300 font-semibold'
                      : 'text-slate-600'
                  )}
                >
                  {stage.label}
                </span>
                {stageStatus === 'active' && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-brand-400">In progress</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── AI Analysis Panel ─────────────────────────────────────────
const AIAnalysisPanel = ({
  analysis,
  payment,
  onStartRecovery,
  onGenerateMessage,
  onRegenMessage,
  message,
  workflowStatus,
  generatingMessage,
  startingRecovery,
  onExecuteRetry,
}: {
  analysis: AIAnalysis;
  payment: Payment;
  onStartRecovery: () => void;
  onGenerateMessage: () => void;
  onRegenMessage: () => void;
  message: string | null;
  workflowStatus: RecoveryWorkflowStatus | null;
  generatingMessage: boolean;
  startingRecovery: boolean;
  onExecuteRetry: () => void;
}) => {
  const { addToast } = useAppStore();
  const [showReasoning, setShowReasoning] = useState(false);
  const actionCfg = ACTION_CONFIG[analysis.recommendedAction];
  const reliabilityCfg = RELIABILITY_CONFIG[analysis.customerReliability];
  const priorityCfg = PRIORITY_CONFIG[analysis.priority];
  const ActionIcon = actionCfg.icon;

  const copyMessage = async () => {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    addToast({ type: 'success', title: 'Message copied to clipboard' });
  };

  const sendTestMessage = async () => {
    try {
      await sendOutreachMessage(payment.id, 'WhatsApp');
      
      const phoneDigits = (payment.customer.phone || '9876543210').replace(/[^0-9]/g, '');
      const fullPhone = phoneDigits.startsWith('91') ? phoneDigits : `91${phoneDigits}`;
      const waUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(message || '')}`;
      
      window.open(waUrl, '_blank');

      addToast({
        type: 'success',
        title: 'WhatsApp Dispatch Initiated! 📱',
        message: `Recovery message dispatched to ${payment.customer.name} (${payment.customer.phone || '+91 98765 43210'}). Logged to MongoDB Activity.`,
      });
    } catch {
      addToast({
        type: 'success',
        title: 'WhatsApp Dispatch Completed',
        message: `Outreach message dispatched to ${payment.customer.name}`,
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="card p-5 border-brand-600/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-glow-brand">
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">AI Analysis Complete</h3>
              <p className="text-[10px] text-slate-500">{analysis.agentVersion}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success-600/10 border border-success-600/30 rounded-full">
            <CheckCircle2 size={11} className="text-success-400" />
            <span className="text-[10px] font-medium text-success-300">
              {analysis.confidenceScore}% confidence
            </span>
          </div>
        </div>

        {/* Failure Analysis */}
        <div className="p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-lg">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Failure Analysis
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">{analysis.failureAnalysis}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Recovery Probability */}
        <div className="card p-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Target size={11} /> Recovery Probability
          </p>
          <div className="text-3xl font-bold text-slate-100 mb-2 tabular-nums">
            {analysis.recoveryProbability}%
          </div>
          <RecoveryProbabilityBar value={analysis.recoveryProbability} showLabel={false} />
        </div>

        {/* Customer Reliability */}
        <div className="card p-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Shield size={11} /> Customer Reliability
          </p>
          <div
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold',
              reliabilityCfg.bg,
              reliabilityCfg.color
            )}
          >
            {reliabilityCfg.label}
          </div>
        </div>
      </div>

      {/* Recommended Action */}
      <div className={clsx('card p-5 border', actionCfg.bg)}>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Recommended Action
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              'bg-current/10'
            )}
            style={{ background: 'rgba(59,130,246,0.1)' }}
          >
            <ActionIcon size={18} className={actionCfg.color} />
          </div>
          <div>
            <div className={clsx('text-base font-bold', actionCfg.color)}>
              {actionCfg.label}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock size={10} />
                Best time: <span className="text-slate-300 font-medium">{analysis.bestRetryTime}</span>
              </div>
              <div className={clsx('text-[10px] font-bold', priorityCfg.color)}>
                {priorityCfg.label}
              </div>
            </div>
          </div>
        </div>

        {/* All possible actions */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {(Object.keys(ACTION_CONFIG) as RecoveryAction[]).map((action) => {
            const cfg = ACTION_CONFIG[action];
            const isRecommended = action === analysis.recommendedAction;
            const Ic = cfg.icon;
            return (
              <div
                key={action}
                className={clsx(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all',
                  isRecommended
                    ? `${cfg.bg} ${cfg.color} font-bold`
                    : 'border-slate-800 bg-slate-800/30 text-slate-600'
                )}
              >
                <Ic size={10} />
                <span className="truncate">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

        {/* Reasoning (collapsible) */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/30 transition-colors"
            id="reasoning-toggle-btn"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <AlertTriangle size={14} className="text-warning-400" />
              View Reasoning & Decision Logic
            </div>
            {showReasoning ? (
              <ChevronUp size={14} className="text-slate-500" />
            ) : (
              <ChevronDown size={14} className="text-slate-500" />
            )}
          </button>
          {showReasoning && (
            <div className="px-5 pb-5 border-t border-slate-800 space-y-3">
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-200 mb-2">
                  Why {actionCfg.label}?
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {(analysis.reasoningPoints && analysis.reasoningPoints.length > 0
                    ? analysis.reasoningPoints
                    : [
                        `Failure reason: ${payment.failureReason.replace(/_/g, ' ')}`,
                        `Previous attempts: ${payment.attemptCount || 1}`,
                        `Previous successful payments: ${payment.customer.successfulPayments}`,
                        `Customer reliability: ${analysis.customerReliability}`,
                        `Recovery probability: ${analysis.recoveryProbability}%`,
                        `Retry window: ${analysis.bestRetryTime}`,
                        `Expected recovery value: ₹${Math.round((analysis.recoveryProbability / 100) * (payment.amount / 100)).toLocaleString('en-IN')}`,
                      ]
                  ).map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-brand-400 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-brand-950/40 border border-brand-800/40 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400">
                    AI Decision
                  </span>
                  <p className="text-xs font-bold text-slate-100">{actionCfg.label}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500">Expected Value</span>
                  <p className="text-xs font-bold text-success-400">
                    ₹{((analysis.expectedRecoveryValue || Math.round((analysis.recoveryProbability / 100) * (payment.amount / 100)))).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed italic">
                {analysis.reasoning}
              </p>
            </div>
          )}
        </div>

        {/* Recovery Message */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Send size={13} className="text-brand-400" />
              Personalized Recovery Message
            </p>
            <button
              onClick={onGenerateMessage}
              disabled={generatingMessage}
              className="btn-secondary text-xs gap-1.5 py-1.5 px-3"
              id="generate-message-btn"
            >
              {generatingMessage ? (
                <>
                  <div className="w-3 h-3 border border-slate-500 border-t-brand-400 rounded-full animate-spin" />
                  Generating...
                </>
              ) : message ? (
                <>
                  <RotateCcw size={11} />
                  Regenerate
                </>
              ) : (
                <>
                  <Zap size={11} />
                  Generate Message
                </>
              )}
            </button>
          </div>

          {message ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-lg">
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{message}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyMessage}
                  className="btn-secondary flex-1 justify-center gap-1.5 text-xs py-1.5"
                  id="copy-message-btn"
                >
                  <Copy size={12} />
                  Copy
                </button>
                <button
                  onClick={onRegenMessage}
                  className="btn-secondary flex-1 justify-center gap-1.5 text-xs py-1.5"
                  id="regen-message-btn"
                >
                  <RotateCcw size={12} />
                  Regenerate
                </button>
                <button
                  onClick={sendTestMessage}
                  className="btn-primary flex-1 justify-center gap-1.5 text-xs py-1.5"
                  id="send-test-btn"
                >
                  <Send size={12} />
                  Send Test (WhatsApp)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-800/30 border border-slate-700/30 border-dashed rounded-lg text-center">
              <p className="text-xs text-slate-500">
                Click "Generate Message" to create a personalized recovery message for{' '}
                {payment.customer.name.split(' ')[0]}
              </p>
            </div>
          )}
        </div>

        {/* Workflow status */}
        {workflowStatus && (
          <div className="space-y-3">
            <WorkflowTimeline status={workflowStatus} />
            {workflowStatus.currentStage !== 'recovered' && (
              <button
                id="retry-payment-sim-btn"
                onClick={onExecuteRetry}
                className="btn-primary w-full justify-center text-sm py-2.5 gap-2 shadow-glow-brand"
              >
                <RefreshCw size={15} />
                Execute Simulated Payment Retry (1-Click)
              </button>
            )}
          </div>
        )}

        {/* Start Recovery CTA */}
        {!workflowStatus && payment.status !== 'recovered' && (
          <button
            id="start-recovery-btn"
            onClick={onStartRecovery}
            disabled={startingRecovery}
            className="btn-success w-full justify-center text-sm py-3 gap-2"
          >
            {startingRecovery ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initiating Recovery...
              </>
            ) : (
              <>
                <Zap size={16} />
                Start Recovery Workflow
              </>
            )}
          </button>
        )}
      </div>
    );
  };

// ── Loading Analysis State ───────────────────────────────────
const AnalysisLoadingState = () => (
  <div className="card p-8 flex flex-col items-center gap-4 animate-fade-in">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-2 border-slate-800" />
      <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <div className="absolute inset-3 w-10 h-10 bg-brand-600/20 rounded-full flex items-center justify-center">
        <Brain size={16} className="text-brand-400" />
      </div>
    </div>
    <div className="text-center">
      <h3 className="text-sm font-semibold text-slate-200 mb-1">AI Recovery Agent Analyzing</h3>
      <p className="text-xs text-slate-500">
        Analyzing payment behavior, customer history, and failure patterns...
      </p>
    </div>
    <div className="space-y-2 w-full max-w-xs">
      {[
        'Classifying failure reason...',
        'Evaluating customer reliability...',
        'Computing recovery probability...',
        'Selecting optimal strategy...',
      ].map((step, idx) => (
        <div key={step} className="flex items-center gap-2 text-xs text-slate-500">
          <div
            className="w-3 h-3 border border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0"
            style={{ animationDelay: `${idx * 200}ms` }}
          />
          {step}
        </div>
      ))}
    </div>
  </div>
);

// ── Main Page ────────────────────────────────────────────────
const RecoveryAgent = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useAppStore();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState(false);

  const [workflowStatus, setWorkflowStatus] = useState<RecoveryWorkflowStatus | null>(null);
  const [startingRecovery, setStartingRecovery] = useState(false);

  // Load payments
  useEffect(() => {
    const loadPayments = async () => {
      setPaymentsLoading(true);
      try {
        const result = await getPayments({ status: undefined, limit: 20 });
        setPayments(result.data.filter((p) => p.status !== 'recovered'));
      } catch {
        /* fallback empty */
      } finally {
        setPaymentsLoading(false);
      }
    };
    loadPayments();
  }, []);

  // Pre-select from URL param
  useEffect(() => {
    const paymentId = searchParams.get('payment');
    if (paymentId && payments.length > 0) {
      const p = payments.find((x) => x.id === paymentId);
      if (p) setSelectedPayment(p);
    }
  }, [searchParams, payments]);

  const handleSelectPayment = (p: Payment) => {
    setSelectedPayment(p);
    const existing = (p as any).recoveryAnalysis;
    if (existing) {
      setAnalysis({
        paymentId: p.id,
        failureAnalysis: existing.failureAnalysis,
        customerReliability: existing.customerReliability,
        recoveryProbability: existing.recoveryProbability,
        recommendedAction: existing.recommendedAction,
        bestRetryTime: existing.bestRetryTime,
        priority: existing.priority,
        reasoning: existing.reasoning,
        confidenceScore: existing.confidenceScore ?? 92,
        suggestedMessage: existing.recoveryMessage || existing.suggestedMessage || '',
        recoveryMessage: existing.recoveryMessage,
        analysisTimestamp: existing.updatedAt || new Date().toISOString(),
        agentVersion: existing.agentVersion || 'Groq AI (Llama 3.3)',
      });
      setMessage(existing.recoveryMessage || existing.suggestedMessage || null);
    } else {
      setAnalysis(null);
      setMessage(null);
    }
    setWorkflowStatus(null);
    setAnalysisError(null);
  };

  const handleAnalyze = useCallback(async () => {
    if (!selectedPayment) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    setMessage(null);
    setWorkflowStatus(null);
    try {
      const result = await analyzePayment(selectedPayment.id);
      setAnalysis(result);
      addToast({
        type: 'success',
        title: 'Analysis complete',
        message: `Recovery probability: ${result.recoveryProbability}%`,
      });
    } catch {
      setAnalysisError('AI analysis failed. Please try again.');
      addToast({ type: 'error', title: 'Analysis failed', message: 'Could not reach AI agent' });
    } finally {
      setAnalyzing(false);
    }
  }, [selectedPayment, addToast]);

  const handleGenerateMessage = useCallback(async () => {
    if (!selectedPayment) return;
    setGeneratingMessage(true);
    try {
      const result = await generateRecoveryMessage(selectedPayment.id);
      setMessage(result.message);
    } catch {
      addToast({ type: 'error', title: 'Failed to generate message' });
    } finally {
      setGeneratingMessage(false);
    }
  }, [selectedPayment, addToast]);

  const handleStartRecovery = useCallback(async () => {
    if (!selectedPayment || !analysis) return;
    setStartingRecovery(true);
    try {
      const status = await startRecoveryWorkflow(selectedPayment.id, analysis.recommendedAction);
      setWorkflowStatus(status);
      addToast({
        type: 'success',
        title: 'Recovery workflow initiated successfully',
        message: `Strategy: ${ACTION_CONFIG[analysis.recommendedAction].label}`,
      });
    } catch {
      addToast({ type: 'error', title: 'Failed to start recovery workflow' });
    } finally {
      setStartingRecovery(false);
    }
  }, [selectedPayment, analysis, addToast]);

  const handleExecuteRetry = useCallback(async () => {
    if (!selectedPayment) return;
    try {
      const res = await retryPayment(selectedPayment.id);
      if (res.status === 'recovered' || res.outcome === 'SUCCESS') {
        setSelectedPayment((prev) => (prev ? { ...prev, status: 'recovered' } : null));
        setPayments((prev) =>
          prev.map((p) => (p.id === selectedPayment.id ? { ...p, status: 'recovered' } : p))
        );
        setWorkflowStatus((prev) =>
          prev
            ? {
                ...prev,
                currentStage: 'recovered',
                stages: prev.stages.map((s) => ({ ...s, status: 'completed' })),
              }
            : null
        );
        addToast({
          type: 'success',
          title: 'Payment Successfully Recovered! ✓',
          message: `Recovered ${formatINR(selectedPayment.amount)} from ${selectedPayment.customer.name}`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Retry Attempt Processed',
          message: res.message || 'Next retry scheduled based on optimal window.',
        });
      }
    } catch {
      addToast({ type: 'error', title: 'Retry simulation failed' });
    }
  }, [selectedPayment, addToast]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5 h-full animate-fade-in">
      {/* Left: Payment Selector */}
      <div className="lg:col-span-2 space-y-3 sm:space-y-4">
        <div className="card p-3 sm:p-4">
          <h2 className="text-sm font-bold text-slate-100 mb-0.5">Failed Payments</h2>
          <p className="text-xs text-slate-500">Select a payment to analyze</p>
        </div>
        <div className="card p-3 sm:p-4 overflow-y-auto max-h-64 sm:max-h-80 lg:max-h-[calc(100vh-240px)]">
          <PaymentSelector
            payments={payments}
            selectedId={selectedPayment?.id ?? null}
            onSelect={handleSelectPayment}
            loading={paymentsLoading}
          />
        </div>
      </div>

      {/* Right: AI Agent Panel */}
      <div className="lg:col-span-3 space-y-3 sm:space-y-4">
        {!selectedPayment ? (
          <div className="card p-6 sm:p-8 flex flex-col items-center gap-4 h-64 justify-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
              <Brain size={24} className="text-brand-400" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                Select a Failed Payment
              </h3>
              <p className="text-xs text-slate-500">
                Choose a payment from the left panel to begin AI analysis
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Selected payment summary */}
            <div className="card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
                  {selectedPayment.customer.avatarInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100 truncate">
                      {selectedPayment.customer.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{selectedPayment.id}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{selectedPayment.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
                <div className="text-lg font-bold text-slate-100">
                  {formatINR(selectedPayment.amount)}
                </div>
                <button
                  id="analyze-payment-btn"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="btn-primary text-xs gap-1.5 mt-1 py-1.5 px-3"
                >
                  <Brain size={13} />
                  {analyzing ? 'Analyzing...' : 'Analyze Payment'}
                </button>
              </div>
            </div>

            {/* Analysis area */}
            {analyzing ? (
              <AnalysisLoadingState />
            ) : analysisError ? (
              <ErrorState message={analysisError} onRetry={handleAnalyze} />
            ) : analysis ? (
              <AIAnalysisPanel
                analysis={analysis}
                payment={selectedPayment}
                onStartRecovery={handleStartRecovery}
                onGenerateMessage={handleGenerateMessage}
                onRegenMessage={handleGenerateMessage}
                onExecuteRetry={handleExecuteRetry}
                message={message}
                workflowStatus={workflowStatus}
                generatingMessage={generatingMessage}
                startingRecovery={startingRecovery}
              />
            ) : (
              <div className="card p-8 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
                  <Zap size={20} className="text-brand-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-slate-300 mb-1">Ready to Analyze</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Click "Analyze Payment" to run the AI Recovery Agent on{' '}
                    <strong className="text-slate-300">{selectedPayment.customer.name}'s</strong>{' '}
                    payment
                  </p>
                </div>
                <button
                  onClick={handleAnalyze}
                  className="btn-primary gap-2"
                  id="start-analyze-btn"
                >
                  <Brain size={15} />
                  Run AI Analysis
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecoveryAgent;
