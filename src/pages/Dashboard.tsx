// ============================================================
// RecoverAI — Dashboard Page
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
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  CreditCard,
  TrendingUp,
  IndianRupee,
  PercentCircle,
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Brain,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import type { DashboardData, RecentActivity } from '../types';
import {
  StatCard,
  ChartCard,
  LoadingState,
  ErrorState,
} from '../components/ui';
import { clsx } from 'clsx';

// ── Formatters ──────────────────────────────────────────────
const formatINR = (paise: number): string => {
  const rupees = paise / 100;
  if (rupees >= 10_00_000) {
    return `₹${(rupees / 10_00_000).toFixed(1)}L`;
  }
  if (rupees >= 1_000) {
    return `₹${(rupees / 1_000).toFixed(1)}K`;
  }
  return `₹${rupees.toLocaleString('en-IN')}`;
};

const formatTime = (iso: string): string => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Chart colours ────────────────────────────────────────────
const FAILURE_COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#6b7280'];

// ── Custom Tooltip ───────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-card-lg">
      <p className="font-semibold text-slate-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400 capitalize">{p.name}:</span>
          <span className="font-medium text-slate-200">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Activity row ─────────────────────────────────────────────
const ActivityRow = ({ item }: { item: RecentActivity }) => {
  const iconMap = {
    analyzed: { icon: Brain, color: 'text-brand-400', bg: 'bg-brand-600/10' },
    recovered: { icon: CheckCircle2, color: 'text-success-400', bg: 'bg-success-600/10' },
    recovery_initiated: { icon: Activity, color: 'text-warning-400', bg: 'bg-warning-600/10' },
    message_sent: { icon: ArrowRight, color: 'text-accent-400', bg: 'bg-accent-600/10' },
    retry_scheduled: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-700' },
  };
  const cfg = iconMap[item.type] ?? iconMap.retry_scheduled;
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20 -mx-5 px-5 transition-colors">
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
        <Icon size={14} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-300 truncate font-medium">
            {item.customerName}
          </p>
          <span className="text-[10px] text-slate-600 flex-shrink-0">
            {formatTime(item.timestamp)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed truncate">
          {item.action}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-slate-600">{item.paymentId}</span>
          <span className="text-[10px] text-slate-400 font-medium">
            {formatINR(item.amount)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────
const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardStats();
      setData(result);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error || !data) return <ErrorState message={error ?? 'Unknown error'} onRetry={fetchData} />;

  const { stats, revenueData, failureReasons, recoveryPerformance, recentActivity } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Payments"
          value={stats.totalPayments.toLocaleString('en-IN')}
          icon={CreditCard}
          iconColor="text-slate-300"
          iconBg="bg-slate-700"
          trend={{ value: 12.4, label: 'vs last month' }}
        />
        <StatCard
          label="Failed Payments"
          value={stats.failedPayments.toLocaleString('en-IN')}
          icon={AlertCircle}
          iconColor="text-danger-400"
          iconBg="bg-danger-600/10"
          trend={{ value: -3.1, positive: false }}
        />
        <StatCard
          label="Potential Revenue"
          value={formatINR(stats.potentialRevenue)}
          subValue="Total failed amount"
          icon={IndianRupee}
          iconColor="text-warning-400"
          iconBg="bg-warning-600/10"
        />
        <StatCard
          label="Recovered Revenue"
          value={formatINR(stats.recoveredRevenue)}
          subValue="Successfully recovered"
          icon={TrendingUp}
          iconColor="text-success-400"
          iconBg="bg-success-600/10"
          trend={{ value: 8.7 }}
        />
        <StatCard
          label="Recovery Rate"
          value={`${stats.recoveryRate}%`}
          subValue={`${stats.aiAnalysisCount} AI analyses`}
          icon={PercentCircle}
          iconColor="text-brand-400"
          iconBg="bg-brand-600/10"
          trend={{ value: 4.2 }}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Recovery Trend */}
        <ChartCard
          title="Revenue Recovery Trend"
          description="Failed vs recovered revenue over time"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatINR(v)}
                width={60}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#failedGrad)"
                name="Failed"
              />
              <Area
                type="monotone"
                dataKey="recovered"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#recoveredGrad)"
                name="Recovered"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-end">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-danger-500" />
              <span className="text-xs text-slate-500">Failed Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-success-500" />
              <span className="text-xs text-slate-500">Recovered Revenue</span>
            </div>
          </div>
        </ChartCard>

        {/* Failure Reasons */}
        <ChartCard
          title="Failure Reasons"
          description="Distribution of payment failures"
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={failureReasons}
                dataKey="count"
                nameKey="reason"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={3}
              >
                {failureReasons.map((_, idx) => (
                  <Cell key={idx} fill={FAILURE_COLORS[idx % FAILURE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [v, name]}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {failureReasons.map((r, idx) => (
              <div key={r.reason} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: FAILURE_COLORS[idx] }}
                  />
                  <span className="text-slate-400 truncate">{r.reason}</span>
                </div>
                <span className="text-slate-300 font-medium tabular-nums">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recovery Performance */}
        <ChartCard
          title="Recovery Performance"
          description="Weekly recovery attempts vs success"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={recoveryPerformance} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                itemStyle={{ color: '#e2e8f0', fontSize: 11 }}
              />
              <Bar dataKey="attempted" fill="#1e40af" radius={[3, 3, 0, 0]} name="Attempted" />
              <Bar dataKey="recovered" fill="#16a34a" radius={[3, 3, 0, 0]} name="Recovered" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Quick AI Stats */}
        <div className="card p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-0.5">AI Agent Summary</h3>
            <p className="text-xs text-slate-500">Current period performance</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'AI Analyses Run', value: stats.aiAnalysisCount.toLocaleString(), color: 'text-brand-400' },
              { label: 'Pending Recoveries', value: stats.pendingRecoveries.toString(), color: 'text-warning-400' },
              { label: 'Avg Recovery Time', value: `${stats.avgRecoveryTime}h`, color: 'text-slate-300' },
              { label: 'Recovery Rate', value: `${stats.recoveryRate}%`, color: 'text-success-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{item.label}</span>
                <span className={clsx('text-sm font-bold tabular-nums', item.color)}>{item.value}</span>
              </div>
            ))}
          </div>
          <Link
            to="/recovery"
            className="btn-primary w-full justify-center mt-auto text-xs"
          >
            <Brain size={14} />
            Open AI Agent
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <ChartCard
        title="Recent Recovery Activity"
        description="Latest AI decisions and recovery events"
        action={
          <Link to="/activity" className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        }
      >
        <div className="divide-y divide-slate-800/60">
          {recentActivity.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      </ChartCard>
    </div>
  );
};

export default Dashboard;
