// ============================================================
// RecoverAI — Recovery Analytics Page
// ============================================================
import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  IndianRupee,
  Clock,
  Brain,
  CheckCircle2,
  Percent,
  Award,
} from 'lucide-react';
import { getAnalytics } from '../services/api';
import type { AnalyticsData, RecoveryAction } from '../types';
import { StatCard, ChartCard, LoadingState, ErrorState } from '../components/ui';
import { clsx } from 'clsx';

const formatINR = (paise: number): string => {
  const r = paise / 100;
  if (r >= 10_00_000) return `₹${(r / 10_00_000).toFixed(1)}L`;
  if (r >= 1_000) return `₹${(r / 1_000).toFixed(1)}K`;
  return `₹${r.toLocaleString('en-IN')}`;
};

const ACTION_LABELS: Record<RecoveryAction, string> = {
  RETRY_PAYMENT: 'Retry Payment',
  SEND_REMINDER: 'Send Reminder',
  SEND_PAYMENT_LINK: 'Payment Link',
  WAIT_AND_RETRY: 'Wait & Retry',
  MANUAL_REVIEW: 'Manual Review',
};

const ACTION_COLORS: Record<RecoveryAction, string> = {
  RETRY_PAYMENT: '#22c55e',
  SEND_REMINDER: '#3b82f6',
  SEND_PAYMENT_LINK: '#8b5cf6',
  WAIT_AND_RETRY: '#eab308',
  MANUAL_REVIEW: '#6b7280',
};

const REASON_COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#eab308', '#ef4444'];

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAnalytics();
      setData(result);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading analytics..." />;
  if (error || !data) return <ErrorState message={error ?? 'Unknown error'} onRetry={fetchData} />;

  const { overview, revenueOverTime, recoveryRateByReason, probabilityDistribution, aiPerformance } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Failed Revenue"
          value={formatINR(overview.failedRevenue)}
          icon={IndianRupee}
          iconColor="text-danger-400"
          iconBg="bg-danger-600/10"
        />
        <StatCard
          label="Recovered Revenue"
          value={formatINR(overview.recoveredRevenue)}
          icon={TrendingUp}
          iconColor="text-success-400"
          iconBg="bg-success-600/10"
          trend={{ value: 8.7 }}
        />
        <StatCard
          label="Recovery Rate"
          value={`${overview.recoveryRate}%`}
          icon={Percent}
          iconColor="text-brand-400"
          iconBg="bg-brand-600/10"
          trend={{ value: 4.2 }}
        />
        <StatCard
          label="Avg Recovery Time"
          value={`${overview.avgRecoveryTime}h`}
          icon={Clock}
          iconColor="text-warning-400"
          iconBg="bg-warning-600/10"
        />
        <StatCard
          label="AI Recoveries"
          value={overview.aiRecommendedRecoveries.toLocaleString()}
          icon={Brain}
          iconColor="text-accent-400"
          iconBg="bg-accent-600/10"
          trend={{ value: 12.1 }}
        />
      </div>

      {/* Revenue over time + By reason */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title="Revenue Recovery Over Time"
          description="Monthly failed vs recovered revenue"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={revenueOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="failedG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recovG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatINR} width={60} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                formatter={(v: number, n: string) => [formatINR(v), n === 'failed' ? 'Failed' : 'Recovered']}
              />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="url(#failedG)" name="failed" />
              <Area type="monotone" dataKey="recovered" stroke="#22c55e" strokeWidth={2} fill="url(#recovG)" name="recovered" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Probability distribution */}
        <ChartCard title="Probability Distribution" description="Payments by recovery probability range">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={probabilityDistribution} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="range" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Payments">
                {probabilityDistribution.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={['#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e'][idx]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recovery rate by reason */}
      <ChartCard title="Recovery Rate by Failure Reason" description="Success rates across different failure categories">
        <div className="space-y-3 mt-1">
          {recoveryRateByReason.map((item, idx) => (
            <div key={item.reason} className="flex items-center gap-4">
              <div className="w-28 text-xs text-slate-400 text-right flex-shrink-0">{item.reason}</div>
              <div className="flex-1 bg-slate-800 rounded-full h-5 overflow-hidden flex items-center">
                <div
                  className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                  style={{
                    width: `${item.rate}%`,
                    background: REASON_COLORS[idx % REASON_COLORS.length],
                  }}
                >
                  <span className="text-[10px] font-bold text-white">{item.rate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="text-xs text-slate-500 w-20 text-right flex-shrink-0">
                {item.recovered}/{item.total}
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* AI Performance */}
      <div>
        <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Brain size={16} className="text-brand-400" />
          AI Agent Performance
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Summary Stats */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Overall Performance
            </h3>
            <div className="space-y-4">
              {[
                {
                  label: 'Total Recommendations',
                  value: aiPerformance.totalRecommendations.toLocaleString(),
                  icon: Brain,
                  color: 'text-brand-400',
                },
                {
                  label: 'Successful Recoveries',
                  value: aiPerformance.successfulRecoveries.toLocaleString(),
                  icon: CheckCircle2,
                  color: 'text-success-400',
                },
                {
                  label: 'Average Confidence',
                  value: `${aiPerformance.avgConfidence}%`,
                  icon: Percent,
                  color: 'text-warning-400',
                },
                {
                  label: 'Best Strategy',
                  value: ACTION_LABELS[aiPerformance.bestStrategy],
                  icon: Award,
                  color: 'text-accent-400',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <item.icon size={13} className={item.color} />
                    {item.label}
                  </div>
                  <span className={clsx('text-sm font-bold', item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy breakdown */}
          <ChartCard title="Strategy Success Rates" description="Performance of each AI recovery action">
            <div className="space-y-3 mt-1">
              {aiPerformance.strategyBreakdown.map((s) => (
                <div key={s.action} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: ACTION_COLORS[s.action] }}
                  />
                  <span className="text-xs text-slate-400 w-28 flex-shrink-0">
                    {ACTION_LABELS[s.action]}
                  </span>
                  <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-1.5"
                      style={{
                        width: `${s.successRate}%`,
                        background: ACTION_COLORS[s.action],
                      }}
                    >
                      <span className="text-[9px] font-bold text-white">{s.successRate}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 w-8 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
