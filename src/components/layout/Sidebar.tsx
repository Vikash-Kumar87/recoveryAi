// ============================================================
// RecoverAI — Sidebar Navigation (Desktop + Tablet drawer)
// ============================================================
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Brain,
  BarChart3,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { clsx } from 'clsx';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  badge?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/payments', icon: CreditCard, label: 'Failed Payments', badge: '25' },
  { to: '/recovery', icon: Brain, label: 'AI Recovery Agent' },
  { to: '/analytics', icon: BarChart3, label: 'Recovery Analytics' },
  { to: '/activity', icon: Activity, label: 'AI Activity' },
];

const BOTTOM_NAV: NavItem[] = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const location = useLocation();

  return (
    <>
      {/* Mobile/Tablet backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 h-full z-40 flex flex-col',
          'bg-surface-900 border-r border-slate-800',
          'transition-all duration-300 ease-in-out',
          // Desktop: collapsed = icon-only (w-16), expanded = full (w-60)
          'lg:translate-x-0',
          // Mobile/Tablet: off-screen when closed, slides in as full drawer when open
          sidebarOpen
            ? 'translate-x-0 w-64 lg:w-60'
            : '-translate-x-full lg:translate-x-0 lg:w-16'
        )}
      >
        {/* Logo header */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow-brand">
              <Zap size={16} className="text-white" />
            </div>
            {/* Show label when open on any screen size */}
            <div className={clsx('flex flex-col min-w-0 transition-all duration-200', sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden lg:opacity-0 lg:w-0')}>
              <span className="text-sm font-bold text-slate-100 leading-tight whitespace-nowrap">
                RecoverAI
              </span>
              <span className="text-[10px] text-brand-400 font-medium tracking-wide whitespace-nowrap">
                AI Recovery Agent
              </span>
            </div>
          </div>

          {/* Mobile/Tablet close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className={clsx(
              'ml-auto p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors lg:hidden',
              sidebarOpen ? 'flex' : 'hidden'
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* Primary navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {PRIMARY_NAV.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-brand-400 bg-brand-600/10 border border-brand-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent'
                )}
                onClick={() => {
                  // Close sidebar on mobile/tablet after navigation
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon
                  size={18}
                  className={clsx('flex-shrink-0', isActive ? 'text-brand-400' : '')}
                />
                <span
                  className={clsx(
                    'flex-1 truncate transition-all duration-200 whitespace-nowrap',
                    sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  )}
                >
                  {item.label}
                </span>
                {sidebarOpen && item.badge && (
                  <span className="badge bg-brand-600/20 text-brand-400 border border-brand-600/30 text-[10px] flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom navigation */}
        <div className="px-2 pb-4 space-y-0.5 border-t border-slate-800 pt-3">
          {BOTTOM_NAV.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-brand-400 bg-brand-600/10 border border-brand-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent'
                )}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <span
                  className={clsx(
                    'truncate transition-all duration-200 whitespace-nowrap',
                    sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* User profile card (only when sidebar is open) */}
          <div
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg bg-slate-800/50 border border-slate-700/50 overflow-hidden transition-all duration-200',
              sidebarOpen ? 'opacity-100' : 'opacity-0 h-0 py-0 mt-0 border-0'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">RZ</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-300 truncate">
                Razorpay Merchant
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                demo@razorpay.com
              </div>
            </div>
          </div>
        </div>

        {/* Desktop collapse/expand toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={clsx(
            'hidden lg:flex absolute -right-3 top-20 w-6 h-6',
            'items-center justify-center rounded-full',
            'bg-slate-700 border border-slate-600 text-slate-400',
            'hover:bg-slate-600 hover:text-slate-200 transition-all duration-200 shadow-lg'
          )}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>
    </>
  );
};
