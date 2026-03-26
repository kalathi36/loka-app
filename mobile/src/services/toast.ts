export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
  id?: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toast: ToastPayload) => void;

const listeners = new Set<ToastListener>();

export const subscribeToToast = (listener: ToastListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const showToast = (toast: ToastPayload) => {
  const payload = {
    duration: 2800,
    ...toast,
    id: toast.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };

  listeners.forEach((listener) => listener(payload));
};
