// ============================================================
// RecoverAI — Top Navigation Bar
// ============================================================
import { useState, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, Zap, CheckCircle, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { getActivity } from '../../services/api';
import type { ActivityEvent } from '../../types';

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Revenue Recovery Dashboard',
    description: 'Monitor failed payments and recover lost revenue with AI',
  },
  '/payments': {
    title: 'Failed Payments',
    description: 'View and manage all failed payment transactions',
  },
  '/recovery': {
    title: 'AI Recovery Agent',
    description: 'Analyze payments and initiate intelligent recovery workflows',
  },
  '/analytics': {
    title: 'Recovery Analytics',
    description: 'Deep insights into recovery performance and AI effectiveness',
  },
  '/activity': {
    title: 'AI Activity',
    description: 'Real-time log of all AI recovery agent actions',
  },
  '/settings': {
    title: 'Settings',
    description: 'Configure your RecoverAI workspace',
  },
};

const formatTime = (iso?: string): string => {
  if (!iso) return 'Just now';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return '1d ago';
};

export const Topbar = () => {
  const { sidebarOpen, setSidebarOpen, addToast } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<ActivityEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const pageInfo = PAGE_TITLES[location.pathname] ?? PAGE_TITLES['/'];

  const loadNotifications = async () => {
    try {
      const activities = await getActivity(8);
      setNotifications(activities);
      setUnreadCount(activities.filter((a) => a.status !== 'success').length || activities.slice(0, 3).length);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [location.pathname]);

  const handleNotificationClick = (n: ActivityEvent) => {
    setShowNotifications(false);
    if (n.paymentId) {
      navigate(`/recovery?payment=${n.paymentId}`);
      addToast({
        type: 'info',
        title: 'Opening AI Recovery Agent',
        message: `Loaded context for payment ${n.paymentId}`,
      });
    } else {
      navigate('/activity');
    }
  };

  const handleGlobalSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/payments`);
    }
  };

  return (
    <header className="h-14 sm:h-16 flex items-center px-3 sm:px-6 bg-surface-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
      {/* Hamburger — visible on mobile & tablet */}
      <button
        onClick={() => {
          setSidebarOpen(!sidebarOpen);
          if (!showNotifications) loadNotifications();
        }}
        className="p-2 -ml-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors lg:hidden mr-2"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Page title (desktop & tablet) */}
      <div className="hidden sm:block">
        <h1 className="text-sm sm:text-base font-semibold text-slate-100 leading-tight">{pageInfo.title}</h1>
        <p className="text-[10px] sm:text-xs text-slate-500 hidden md:block">{pageInfo.description}</p>
      </div>

      <div className="flex-1" />

      {/* Search — hidden on mobile, visible md+ */}
      <div className="relative hidden md:block mr-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          placeholder="Search payments (Enter)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleGlobalSearch}
          className="w-52 lg:w-72 pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          id="global-search"
        />
      </div>

      {/* Notifications */}
      <div className="relative mr-3">
        <button
          id="notifications-btn"
          onClick={() => {
            setShowNotifications(!showNotifications);
            if (!showNotifications) {
              loadNotifications();
            }
          }}
          className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-surface-900 animate-pulse" />
          )}
        </button>

        {showNotifications && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowNotifications(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-88 card shadow-card-lg z-20 animate-fade-in divide-y divide-slate-800 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 flex items-center justify-between bg-slate-900/90 sticky top-0 backdrop-blur">
                <span className="text-sm font-semibold text-slate-200">
                  Live Notifications
                </span>
                <span className="badge bg-brand-600/20 text-brand-400 text-[10px]">
                  {notifications.length} events
                </span>
              </div>
              <div className="divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="px-4 py-3 flex items-start gap-3 hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.status === 'success'
                            ? 'bg-success-500'
                            : n.status === 'pending'
                            ? 'bg-warning-500'
                            : 'bg-brand-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {formatTime(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                          {n.description}
                        </p>
                        {n.paymentId && (
                          <span className="inline-block mt-1 font-mono text-[9px] text-brand-400 bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-800/40">
                            {n.paymentId}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 bg-slate-900/90 sticky bottom-0 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/activity');
                  }}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  View all activity →
                </button>
                <button
                  onClick={() => {
                    setUnreadCount(0);
                    addToast({ type: 'success', title: 'All notifications marked as read' });
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-400"
                >
                  Mark all read
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Merchant info — compact on mobile */}
      <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
        <div className="hidden sm:block text-right">
          <div className="text-xs font-medium text-slate-300">TechMart India</div>
          <div className="flex items-center gap-1 justify-end">
            <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-success-400 font-medium">Connected · Razorpay</span>
          </div>
        </div>
        <button
          id="user-menu-btn"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">TM</span>
          </div>
          <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
        </button>
      </div>

      {/* AI Status — hidden on small/medium screens */}
      <div className="hidden xl:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-800">
        <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse-slow" />
        <div className="flex items-center gap-1">
          <Zap size={11} className="text-brand-400" />
          <span className="text-[10px] text-brand-400 font-medium">AI Agent Active</span>
        </div>
      </div>
    </header>
  );
};
