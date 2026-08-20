// ============================================================
// RecoverAI — Reusable UI Components
// ============================================================
import { RefreshCw, AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

// ──────────────────────────────────────────────────────────────
// StatCard
// ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  loading?: boolean;
}

export const StatCard = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-brand-400',
  iconBg = 'bg-brand-600/10',
  trend,
  loading = false,
}: StatCardProps) => {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl shimmer" />
          <div className="w-16 h-5 rounded shimmer" />
        </div>
        <div className="w-24 h-7 rounded shimmer mb-1" />
        <div className="w-32 h-4 rounded shimmer" />
      </div>
    );
  }

  return (
    <div className="card-hover p-5 group animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend && (
          <div
            className={clsx(
              'flex items-center gap-0.5 text-xs font-medium',
              trend.positive !== false ? 'text-success-400' : 'text-danger-400'
            )}
          >
            <span>{trend.positive !== false ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-100 mb-0.5 tracking-tight">
        {value}
      </div>
      <div className="text-sm text-slate-500 font-medium">{label}</div>
      {subValue && (
        <div className="text-xs text-slate-600 mt-1">{subValue}</div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// ChartCard
// ──────────────────────────────────────────────────────────────
interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const ChartCard = ({
  title,
  description,
  children,
  action,
  className = '',
  loading = false,
}: ChartCardProps) => {
  return (
    <div className={clsx('card p-5', className)}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// LoadingState (full page)
// ──────────────────────────────────────────────────────────────
export const LoadingState = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fade-in">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-2 border-slate-800" />
      <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
    <p className="text-sm text-slate-400">{message}</p>
  </div>
);

// ──────────────────────────────────────────────────────────────
// LoadingSpinner (inline)
// ──────────────────────────────────────────────────────────────
export const LoadingSpinner = ({ size = 20 }: { size?: number }) => (
  <Loader2 size={size} className="text-brand-400 animate-spin" />
);

// ──────────────────────────────────────────────────────────────
// EmptyState
// ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}

export const EmptyState = ({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fade-in">
    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
      <Icon size={24} className="text-slate-500" />
    </div>
    <div className="text-center">
      <h3 className="text-sm font-semibold text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-xs">{description}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ──────────────────────────────────────────────────────────────
// ErrorState
// ──────────────────────────────────────────────────────────────
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Failed to load data. Please try again.',
  onRetry,
}: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4 animate-fade-in">
    <div className="w-14 h-14 rounded-2xl bg-danger-600/10 border border-danger-600/20 flex items-center justify-center">
      <AlertCircle size={24} className="text-danger-400" />
    </div>
    <div className="text-center">
      <h3 className="text-sm font-semibold text-danger-300 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs">{message}</p>
    </div>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary text-xs gap-1.5">
        <RefreshCw size={13} />
        Retry
      </button>
    )}
  </div>
);

// ──────────────────────────────────────────────────────────────
// PaymentStatusBadge
// ──────────────────────────────────────────────────────────────
import type { PaymentStatus } from '../../types';

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
    dot: 'bg-slate-400',
  },
  ai_analyzed: {
    label: 'AI Analyzed',
    className: 'bg-brand-600/15 text-brand-300 border-brand-600/30',
    dot: 'bg-brand-400',
  },
  recovery_initiated: {
    label: 'Recovery Started',
    className: 'bg-warning-600/15 text-warning-300 border-warning-600/30',
    dot: 'bg-warning-400',
  },
  recovered: {
    label: 'Recovered',
    className: 'bg-success-600/15 text-success-300 border-success-600/30',
    dot: 'bg-success-400',
  },
  failed: {
    label: 'Failed',
    className: 'bg-danger-600/15 text-danger-300 border-danger-600/30',
    dot: 'bg-danger-400',
  },
};

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        config.className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      {config.label}
    </span>
  );
};

// ──────────────────────────────────────────────────────────────
// RecoveryProbabilityBar
// ──────────────────────────────────────────────────────────────
export const RecoveryProbabilityBar = ({
  value,
  showLabel = true,
  size = 'md',
}: {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}) => {
  const color =
    value >= 75
      ? 'bg-success-500'
      : value >= 50
      ? 'bg-brand-500'
      : value >= 30
      ? 'bg-warning-500'
      : 'bg-danger-500';

  const textColor =
    value >= 75
      ? 'text-success-400'
      : value >= 50
      ? 'text-brand-400'
      : value >= 30
      ? 'text-warning-400'
      : 'text-danger-400';

  return (
    <div className="flex items-center gap-2">
      <div className={clsx('flex-1 bg-slate-800 rounded-full overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={clsx('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className={clsx('text-xs font-semibold tabular-nums w-8 text-right', textColor)}>
          {value}%
        </span>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Divider
// ──────────────────────────────────────────────────────────────
export const Divider = ({ className = '' }: { className?: string }) => (
  <div className={clsx('border-t border-slate-800', className)} />
);

// ──────────────────────────────────────────────────────────────
// Section header
// ──────────────────────────────────────────────────────────────
export const SectionHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-lg font-bold text-slate-100">{title}</h2>
      {description && (
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
    {action}
  </div>
);
