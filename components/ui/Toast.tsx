"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { IconCheck, IconX } from "@/components/ui/Icon";

export type ToastTone = "info" | "success" | "error";

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="toast-stack"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "toast-item",
              toast.tone === "success" ? "toast-success" : "",
              toast.tone === "error" ? "toast-error" : "",
            ].join(" ")}
            role="status"
          >
            {toast.tone === "success" ? (
              <IconCheck size={14} className="shrink-0 text-[var(--success-text)]" />
            ) : toast.tone === "error" ? (
              <IconX size={14} className="shrink-0 text-[var(--danger-text)]" />
            ) : null}
            <span className="text-sm text-[var(--text-secondary)]">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
