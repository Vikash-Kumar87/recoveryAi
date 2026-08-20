// ============================================================
// RecoverAI — Root Layout (Mobile + Tablet + Desktop)
// ============================================================
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { Toast } from '../ui/Toast';
import { useAppStore } from '../../store/appStore';
import { clsx } from 'clsx';

export const Layout = () => {
  const { sidebarOpen } = useAppStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar: hidden on mobile, slides on tablet, fixed on desktop */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={clsx(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          // Desktop: shifts with sidebar
          sidebarOpen ? 'lg:ml-60' : 'lg:ml-16',
          // Mobile/Tablet: full width (no offset)
          'ml-0'
        )}
      >
        <Topbar />
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav for mobile & tablet only */}
      <BottomNav />

      {/* Toast container */}
      <Toast />
    </div>
  );
};
