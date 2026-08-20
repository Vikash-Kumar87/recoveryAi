// ============================================================
// RecoverAI — Bottom Navigation Bar (Mobile + Tablet only)
// ============================================================
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Brain,
  BarChart3,
  Activity,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/payments', icon: CreditCard, label: 'Payments', badge: '25' },
  { to: '/recovery', icon: Brain, label: 'AI Agent' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-900/95 backdrop-blur-md border-t border-slate-800 safe-area-bottom">
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-0.5 rounded-lg transition-all duration-200 relative min-h-[52px]',
                isActive
                  ? 'text-brand-400'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand-500 rounded-full" />
              )}

              {/* Icon with optional badge */}
              <div className="relative">
                <item.icon
                  size={20}
                  className={clsx(
                    'transition-transform duration-200',
                    isActive ? 'scale-110' : 'scale-100'
                  )}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-brand-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center leading-none">
                    25
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  'text-[9px] font-medium leading-none truncate max-w-full',
                  isActive ? 'text-brand-400' : 'text-slate-500'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
