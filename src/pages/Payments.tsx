// ============================================================
// RecoverAI — Failed Payments Page
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Brain,
  RefreshCw,
  X,
} from 'lucide-react';
import { getPayments } from '../services/api';
import type { Payment, PaymentStatus, FailureReason, PaymentsFilter } from '../types';
import { PaymentStatusBadge, RecoveryProbabilityBar, LoadingState, ErrorState, EmptyState } from '../components/ui';
import { PaymentDetailDrawer } from '../components/payments/PaymentDetailDrawer';
import { clsx } from 'clsx';

// ── Formatters ──────────────────────────────────────────────
const formatINR = (paise: number) =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));

const FAILURE_LABELS: Record<FailureReason, string> = {
  insufficient_funds: 'Insufficient Funds',
  card_declined: 'Card Declined',
  bank_timeout: 'Bank Timeout',
  network_error: 'Network Error',
  expired_card: 'Expired Card',
  authentication_failed: 'Auth Failed',
  limit_exceeded: 'Limit Exceeded',
  other: 'Other',
};

const STATUS_OPTIONS: { label: string; value: PaymentStatus | '' }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'AI Analyzed', value: 'ai_analyzed' },
  { label: 'Recovery Started', value: 'recovery_initiated' },
  { label: 'Recovered', value: 'recovered' },
  { label: 'Failed', value: 'failed' },
];

const REASON_OPTIONS: { label: string; value: FailureReason | '' }[] = [
  { label: 'All Reasons', value: '' },
  { label: 'Insufficient Funds', value: 'insufficient_funds' },
  { label: 'Card Declined', value: 'card_declined' },
  { label: 'Bank Timeout', value: 'bank_timeout' },
  { label: 'Network Error', value: 'network_error' },
  { label: 'Expired Card', value: 'expired_card' },
  { label: 'Auth Failed', value: 'authentication_failed' },
  { label: 'Limit Exceeded', value: 'limit_exceeded' },
];

// ── Component ────────────────────────────────────────────────
const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [reason, setReason] = useState<FailureReason | ''>('');
  const [sortBy, setSortBy] = useState<'amount' | 'recoveryProbability' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const filters: PaymentsFilter = {
      search: search || undefined,
      status: status || undefined,
      failureReason: reason || undefined,
      sortBy,
      sortOrder,
      page,
      limit: 8,
    };
    try {
      const result = await getPayments(filters);
      setPayments(result.data ?? []);
      setTotal(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
    } catch (err: unknown) {
      // Distinguish between actual server errors and empty result scenarios
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400 || status === 422) {
        // Validation error — treat as empty results with invalid filter
        setPayments([]);
        setTotal(0);
        setTotalPages(1);
      } else {
        setError('Failed to load payments. Please check your connection and retry.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, status, reason, sortBy, sortOrder, page]);


  useEffect(() => {
    setPage(1);
  }, [search, status, reason]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setReason('');
  };

  const hasFilters = search || status || reason;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="payment-search"
              type="text"
              placeholder="Search by ID, customer, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9"
            />
          </div>

          {/* Status filter */}
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as PaymentStatus | '')}
            className="input-base w-40"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Reason filter */}
          <select
            id="reason-filter"
            value={reason}
            onChange={(e) => setReason(e.target.value as FailureReason | '')}
            className="input-base w-44"
          >
            {REASON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-xs gap-1">
              <X size={12} /> Clear
            </button>
          )}

          <button onClick={fetchPayments} className="btn-secondary gap-1.5 ml-auto">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {loading ? 'Loading...' : `Showing ${payments.length} of ${total} payments`}
        </p>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <SlidersHorizontal size={12} />
          Sort: <span className="text-slate-300">{sortBy === 'createdAt' ? 'Date' : sortBy === 'amount' ? 'Amount' : 'Probability'}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingState message="Loading payments..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchPayments} />
        ) : payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description={
              search || status || reason
                ? `No payments match the selected filters. Try adjusting or clearing your filters.`
                : 'No payment records available.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Payment ID
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      <button
                        onClick={() => toggleSort('amount')}
                        className="flex items-center gap-1 ml-auto hover:text-slate-300 transition-colors"
                        id="sort-amount-btn"
                      >
                        Amount <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                      Failure
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                      Attempts
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      <button
                        onClick={() => toggleSort('recoveryProbability')}
                        className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                        id="sort-probability-btn"
                      >
                        Recovery % <ArrowUpDown size={11} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5">
                        <div>
                          <span className="font-mono text-xs font-medium text-slate-300">
                            {payment.id}
                          </span>
                          <div className="text-[10px] text-slate-600 mt-0.5 font-mono hidden sm:block">
                            {payment.razorpayPaymentId.slice(0, 18)}…
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                            {payment.customer.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate">
                              {payment.customer.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate hidden sm:block">
                              {payment.customer.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-bold text-slate-100 tabular-nums">
                          {formatINR(payment.amount)}
                        </span>
                      </td>

                      {/* Failure */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-400">
                          {FAILURE_LABELS[payment.failureReason]}
                        </span>
                      </td>

                      {/* Attempts */}
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <span className="text-xs text-slate-400 tabular-nums">
                          {payment.attemptCount}
                        </span>
                      </td>

                      {/* Recovery % */}
                      <td className="px-4 py-3.5">
                        <div className="w-28">
                          <RecoveryProbabilityBar value={payment.recoveryProbability} size="sm" />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <PaymentStatusBadge status={payment.status} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="text-xs text-slate-500">
                          {formatDate(payment.createdAt)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`analyze-btn-${payment.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(payment);
                          }}
                          className="btn-ghost p-1.5 text-brand-400 hover:text-brand-300 hover:bg-brand-600/10"
                          title="Analyze with AI"
                        >
                          <Brain size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary p-1.5 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={clsx(
                          'w-7 h-7 text-xs rounded font-medium transition-colors',
                          p === page
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary p-1.5 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedPayment && (
        <PaymentDetailDrawer
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

export default Payments;
