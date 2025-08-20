// src/contexts/ToastProvider.jsx
import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";
import { ToastContext } from "./toastContext";

let _id = 0;
function nextId() {
  _id = (_id + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now()}_${_id}`;
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const add = useCallback(
    ({ type = "info", title, message, duration, sticky = false }) => {
      const id = nextId();
      const toast = { id, type, title, message, createdAt: Date.now() };
      setToasts((ts) => [toast, ...ts].slice(0, 6));

      const ms =
        typeof duration === "number"
          ? duration
          : type === "success"
          ? 3000
          : type === "error"
          ? 4500
          : 3500;

      if (!sticky && ms > 0) {
        const timer = setTimeout(() => dismiss(id), ms);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const clear = useCallback(() => {
    setToasts([]);
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  }, []);

  const api = useMemo(
    () => ({
      success: (msg, opts) => add({ type: "success", message: msg, ...opts }),
      error: (msg, opts) => add({ type: "error", message: msg, ...opts }),
      info: (msg, opts) => add({ type: "info", message: msg, ...opts }),
      loading: (msg, opts) => add({ type: "loading", message: msg, sticky: true, ...opts }),
      dismiss,
      clear,
    }),
    [add, dismiss, clear]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(<ToastViewport toasts={toasts} dismiss={dismiss} />, document.body)}
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, dismiss }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="
        pointer-events-none fixed z-[9999]
        inset-x-0 bottom-4 flex flex-col items-center gap-2
        md:inset-auto md:right-4 md:bottom-4 md:items-end
      "
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }) {
  const { type, title, message } = toast;

  const scheme =
    type === "success"
      ? {
          border: "color-mix(in oklab, var(--color-success) 45%, transparent)",
          bg: "color-mix(in oklab, var(--color-success) 12%, white)",
          icon: <FaCheckCircle className="shrink-0" />,
        }
      : type === "error"
      ? {
          border: "color-mix(in oklab, var(--color-warning) 45%, transparent)",
          bg: "color-mix(in oklab, var(--color-warning) 12%, white)",
          icon: <FaExclamationTriangle className="shrink-0" />,
        }
      : type === "loading"
      ? {
          border: "color-mix(in oklab, var(--color-cta) 45%, transparent)",
          bg: "color-mix(in oklab, var(--color-cta) 12%, white)",
          icon: (
            <svg className="shrink-0 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          ),
        }
      : {
          border: "color-mix(in oklab, var(--color-cta) 45%, transparent)",
          bg: "color-mix(in oklab, var(--color-cta) 12%, white)",
          icon: <FaInfoCircle className="shrink-0" />,
        };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className="
        pointer-events-auto w-[min(92vw,420px)]
        border rounded-[var(--radius-standard)] shadow-card
        backdrop-blur-[2px]
        transition-all duration-300 ease-out
        translate-y-0 opacity-100
        px-3 py-2
      "
      style={{ borderColor: scheme.border, background: scheme.bg }}
    >
      <div className="flex items-start gap-2">
        <div className="icon-primary">{scheme.icon}</div>
        <div className="min-w-0">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {message && <div className="text-sm text-primary break-words">{message}</div>}
        </div>
        <button
          onClick={onClose}
          className="ml-auto icon-secondary hover:icon-primary"
          aria-label="Dismiss"
          title="Dismiss"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
}
