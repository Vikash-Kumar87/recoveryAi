// ============================================================
// RecoverAI — AI Activity Timeline Page
// ============================================================
import { useEffect, useState } from 'react';
import {
  Brain,
  Target,
  Zap,
  Activity,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCwIcon,
} from 'lucide-react';
import { getActivity } from '../services/api';
import type { ActivityEvent } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/ui';
import { clsx } from 'clsx';

const EVENT_CONFIG: Record<
  ActivityEvent['type'],
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bg: string;
    border: string;
  }
> = {
  ai_analysis: { icon: Brain, color: 'text-brand-400', bg: 'bg-brand-600/10', border: 'border-brand-600/20' },
  probability_calculated: { icon: Target, color: 'text-accent-400', bg: 'bg-accent-600/10', border: 'border-accent-600/20' },
  action_recommended: { icon: Zap, color: 'text-warning-400', bg: 'bg-warning-600/10', border: 'border-warning-600/20' },
  workflow_started: { icon: Activity, color: 'text-brand-400', bg: 'bg-brand-600/10', border: 'border-brand-600/20' },
  message_sent: { icon: Send, color: 'text-accent-400', bg: 'bg-accent-600/10', border: 'border-accent-600/20' },
  retry_attempted: { icon: RefreshCw, color: 'text-warning-400', bg: 'bg-warning-600/10', border: 'border-warning-600/20' },
  payment_recovered: { icon: CheckCircle2, color: 'text-success-400', bg: 'bg-success-600/10', border: 'border-success-600/20' },
  payment_failed_retry: { icon: XCircle, color: 'text-danger-400', bg: 'bg-danger-600/10', border: 'border-danger-600/20' },
};

const STATUS_COLORS = {
  success: 'text-success-400 bg-success-600/10 border-success-600/30',
  pending: 'text-warning-400 bg-warning-600/10 border-warning-600/30',
  failed: 'text-danger-400 bg-danger-600/10 border-danger-600/30',
  info: 'text-brand-400 bg-brand-600/10 border-brand-600/30',
};

const formatTime = (iso: string): string => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso));
};

const ActivityCard = ({ event }: { event: ActivityEvent }) => {
  const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.ai_analysis;
  const Icon = cfg.icon;

  return (
    <div className={clsx('card-hover p-4 flex items-start gap-4 animate-fade-in')}>
      {/* Icon */}
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
          cfg.bg,
          cfg.border
        )}
      >
        <Icon size={16} className={cfg.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h4 className="text-xs font-semibold text-slate-200 leading-snug">{event.title}</h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={clsx(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                STATUS_COLORS[event.status]
              )}
            >
              {event.status}
            </span>
            <span className="text-[10px] text-slate-600 whitespace-nowrap">
              {formatTime(event.timestamp)}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-2">{event.description}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-mono text-slate-600 bg-slate-800 px-2 py-0.5 rounded">
            {event.paymentId}
          </span>
          {event.customerName && (
            <span className="text-[10px] text-slate-500">{event.customerName}</span>
          )}
          {event.metadata &&
            Object.entries(event.metadata)
              .slice(0, 3)
              .map(([k, v]) => (
                <span key={k} className="text-[10px] text-slate-600">
                  <span className="text-slate-500">{k}:</span>{' '}
                  <span className="text-slate-400 font-medium">{String(v)}</span>
                </span>
              ))}
        </div>
      </div>
    </div>
  );
};

const ActivityPage = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filtered, setFiltered] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActivity();
      setEvents(result);
    } catch {
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...events];
    if (statusFilter) result = result.filter((e) => e.status === statusFilter);
    if (typeFilter) result = result.filter((e) => e.type === typeFilter);
    setFiltered(result);
  }, [events, statusFilter, typeFilter]);

  const stats = {
    total: events.length,
    success: events.filter((e) => e.status === 'success').length,
    pending: events.filter((e) => e.status === 'pending').length,
    failed: events.filter((e) => e.status === 'failed').length,
  };

  if (loading) return <LoadingState message="Loading AI activity..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-slate-300' },
          { label: 'Successful', value: stats.success, color: 'text-success-400' },
          { label: 'Pending', value: stats.pending, color: 'text-warning-400' },
          { label: 'Failed', value: stats.failed, color: 'text-danger-400' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={clsx('text-2xl font-bold tabular-nums', s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter size={13} />
          Filter:
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base w-36 text-xs"
          id="activity-status-filter"
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="info">Info</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-base w-44 text-xs"
          id="activity-type-filter"
        >
          <option value="">All Types</option>
          <option value="ai_analysis">AI Analysis</option>
          <option value="probability_calculated">Probability</option>
          <option value="action_recommended">Action Recommended</option>
          <option value="workflow_started">Workflow Started</option>
          <option value="message_sent">Message Sent</option>
          <option value="retry_attempted">Retry Attempted</option>
          <option value="payment_recovered">Payment Recovered</option>
          <option value="payment_failed_retry">Failed Retry</option>
        </select>

        <button
          onClick={() => { setStatusFilter(''); setTypeFilter(''); }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear
        </button>

        <button
          onClick={fetchData}
          className="btn-secondary gap-1.5 text-xs ml-auto"
          id="refresh-activity-btn"
        >
          <RefreshCwIcon size={12} />
          Refresh
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState title="No activity events" description="No events match your current filters" />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {filtered.length} of {events.length} events
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse-slow" />
                <span className="text-[10px] text-brand-400 font-medium">AI Agent Active</span>
              </div>
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[17px] top-0 bottom-0 w-px bg-slate-800" />
              <div className="space-y-3 pl-10">
                {filtered.map((event) => (
                  <ActivityCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
