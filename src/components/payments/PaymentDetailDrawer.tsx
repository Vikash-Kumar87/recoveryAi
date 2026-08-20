// ============================================================
// RecoverAI — Payment Detail Drawer
// ============================================================
import { useEffect, useRef } from 'react';
import {
  X,
  User,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Brain,
  ArrowRight,
  Shield,
  Calendar,
  Hash,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Payment, PaymentAttempt } from '../../types';
import { PaymentStatusBadge, RecoveryProbabilityBar } from '../ui';

interface Props {
  payment: Payment;
  onClose: () => void;
}

const formatINR = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));

const AttemptRow = ({ attempt }: { attempt: PaymentAttempt }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        attempt.status === 'success'
          ? 'bg-success-600/20 text-success-400'
          : 'bg-danger-600/20 text-danger-400'
      }`}
    >
      {attempt.status === 'success' ? (
        <CheckCircle2 size={12} />
      ) : (
        <XCircle size={12} />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">
          Attempt #{attempt.attemptNumber}
        </span>
        <span
          className={`text-[10px] font-medium ${
            attempt.status === 'success' ? 'text-success-400' : 'text-danger-400'
          }`}
        >
          {attempt.status === 'success' ? 'Success' : 'Failed'}
        </span>
      </div>
      {attempt.gatewayCode && (
        <span className="text-[10px] font-mono text-slate-600">{attempt.gatewayCode}</span>
      )}
      <div className="text-[10px] text-slate-500 mt-0.5">{formatDate(attempt.timestamp)}</div>
    </div>
  </div>
);

const InfoRow = ({
  label,
  value,
  icon: Icon,
  mono = false,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-0">
    <div className="flex items-center gap-2 text-xs text-slate-500">
      {Icon && <Icon size={13} className="text-slate-600" />}
      {label}
    </div>
    <span
      className={`text-xs text-slate-300 font-medium max-w-48 text-right truncate ${
        mono ? 'font-mono' : ''
      }`}
    >
      {value}
    </span>
  </div>
);

export const PaymentDetailDrawer = ({ payment, onClose }: Props) => {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const segment = payment.customer.segment;
  const segmentColors: Record<string, string> = {
    premium: 'text-brand-400 bg-brand-600/10 border-brand-600/30',
    regular: 'text-slate-300 bg-slate-700/50 border-slate-600/50',
    new: 'text-success-400 bg-success-600/10 border-success-600/30',
    at_risk: 'text-danger-400 bg-danger-600/10 border-danger-600/30',
  };

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Panel */}
      <div ref={panelRef} className="drawer-panel animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-surface-900 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-100">{payment.id}</span>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{payment.description}</p>
          </div>
          <button
            onClick={onClose}
            id="drawer-close-btn"
            className="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount + CTA */}
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">Payment Amount</p>
              <p className="text-3xl font-bold text-slate-100">{formatINR(payment.amount)}</p>
              <p className="text-xs text-slate-500 mt-1">{payment.currency} • Order {payment.orderId}</p>
            </div>
            <button
              id="analyze-cta-btn"
              onClick={() => {
                onClose();
                navigate(`/recovery?payment=${payment.id}`);
              }}
              className="btn-primary gap-2 flex-shrink-0"
            >
              <Brain size={16} />
              Analyze with AI
            </button>
          </div>

          {/* Recovery Probability */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Recovery Probability</span>
              <span className="text-sm font-bold text-slate-200">
                {payment.recoveryProbability}%
              </span>
            </div>
            <RecoveryProbabilityBar value={payment.recoveryProbability} showLabel={false} />
            <p className="text-[10px] text-slate-600 mt-2">
              Based on failure type, customer history, and transaction patterns
            </p>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <User size={13} /> Customer Information
            </h3>
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                  {payment.customer.avatarInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {payment.customer.name}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border capitalize ${segmentColors[segment] ?? segmentColors.regular}`}
                    >
                      {segment.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{payment.customer.email}</p>
                </div>
              </div>
              <InfoRow icon={Hash} label="Phone" value={payment.customer.phone} />
              <InfoRow icon={Calendar} label="Customer Since" value={payment.customer.customerSince} />
              <InfoRow icon={TrendingUp} label="Success Rate" value={`${payment.customer.successRate}%`} />
              <InfoRow icon={CreditCard} label="Total Payments" value={payment.customer.totalPayments} />
              <InfoRow icon={Shield} label="Risk Score" value={`${payment.customer.riskScore}/100`} />
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CreditCard size={13} /> Payment Information
            </h3>
            <div className="card p-4">
              <InfoRow label="Payment ID" value={payment.razorpayPaymentId} mono />
              <InfoRow label="Order ID" value={payment.orderId} mono />
              <InfoRow icon={Building2} label="Bank" value={payment.bank ?? 'Unknown'} />
              {payment.card && (
                <InfoRow
                  label="Card"
                  value={`${payment.card.network} ••••${payment.card.last4} (${payment.card.type})`}
                />
              )}
              <InfoRow icon={Clock} label="Created" value={formatDate(payment.createdAt)} />
              <InfoRow label="Failure Code" value={payment.gatewayCode} mono />
            </div>
          </div>

          {/* Failure Details */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <XCircle size={13} /> Failure Details
            </h3>
            <div className="card p-4">
              <div className="flex items-start gap-2.5 p-3 bg-danger-600/5 border border-danger-600/20 rounded-lg">
                <XCircle size={14} className="text-danger-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  {payment.failureMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Attempt History */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Clock size={13} /> Attempt History ({payment.attemptCount} total)
            </h3>
            <div className="card p-4">
              {payment.attempts.map((a) => (
                <AttemptRow key={a.attemptNumber} attempt={a} />
              ))}
            </div>
          </div>

          {/* CTA Footer */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClose();
                navigate(`/recovery?payment=${payment.id}`);
              }}
              className="btn-primary flex-1 justify-center"
              id="drawer-analyze-btn"
            >
              <Brain size={15} />
              Analyze with AI
              <ArrowRight size={13} />
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
