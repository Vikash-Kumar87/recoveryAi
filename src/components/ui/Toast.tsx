// ============================================================
// RecoverAI — Toast Notification System
// ============================================================
import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { clsx } from 'clsx';
import type { ToastMessage } from '../../types';

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    bg: 'bg-success-600/10 border-success-600/30',
    icon_color: 'text-success-400',
    title_color: 'text-success-300',
  },
  error: {
    icon: XCircle,
    bg: 'bg-danger-600/10 border-danger-600/30',
    icon_color: 'text-danger-400',
    title_color: 'text-danger-300',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-600/10 border-warning-600/30',
    icon_color: 'text-warning-400',
    title_color: 'text-warning-300',
  },
  info: {
    icon: Info,
    bg: 'bg-brand-600/10 border-brand-600/30',
    icon_color: 'text-brand-400',
    title_color: 'text-brand-300',
  },
};

interface SingleToastProps {
  toast: ToastMessage;
}

const SingleToast = ({ toast }: SingleToastProps) => {
  const { removeToast } = useAppStore();
  const config = TOAST_CONFIG[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-card-lg',
        'backdrop-blur-md animate-fade-in w-full max-w-sm',
        'bg-surface-900/95',
        config.bg
      )}
      role="alert"
    >
      <Icon size={18} className={clsx('flex-shrink-0 mt-0.5', config.icon_color)} />
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-semibold', config.title_color)}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const Toast = () => {
  const { toasts } = useAppStore();

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <SingleToast toast={toast} />
        </div>
      ))}
    </div>
  );
};
