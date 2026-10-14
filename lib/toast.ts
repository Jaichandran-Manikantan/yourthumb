export type ToastKind = "error" | "success";

export type AppToast = {
  id: string;
  kind: ToastKind;
  message: string;
  persist?: boolean;
};

type Listener = (toasts: AppToast[]) => void;

let toasts: AppToast[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

function push(kind: ToastKind, message: string, persist = false) {
  const toast: AppToast = {
    id: crypto.randomUUID(),
    kind,
    message,
    persist,
  };
  toasts = persist
    ? [...toasts.filter((item) => !(item.persist && item.kind === kind)), toast]
    : [...toasts, toast];
  emit();
  if (!persist) {
    window.setTimeout(() => dismiss(toast.id), 4000);
  }
  return toast.id;
}

export function dismiss(id: string) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function dismissPersistent(kind?: ToastKind) {
  toasts = toasts.filter((item) => !item.persist || (kind && item.kind !== kind));
  emit();
}

export const toast = {
  error(message: string, options?: { persist?: boolean }) {
    return push("error", message, options?.persist ?? false);
  },
  success(message: string) {
    return push("success", message);
  },
  dismiss,
};

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}
