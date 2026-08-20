// ============================================================
// RecoverAI — Zustand Global State Store
// ============================================================
import { create } from 'zustand';
import type { AppStore, ToastMessage } from '../types';

export const useAppStore = create<AppStore>((set) => ({
  toasts: [],
  sidebarOpen: true,

  addToast: (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    // Auto-remove after duration (default 4s)
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration ?? 4000);
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },
}));
