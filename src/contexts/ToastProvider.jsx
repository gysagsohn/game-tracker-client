import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";
import { ToastContext } from "./toastContext";

// Simple id generator for toasts
let _id = 0;
function nextId() {
  _id = (_id + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now()}_${_id}`;
}

/**
 * ToastProvider
 * - Stores toasts in state and exposes helpers via context
 * - Renders a portal (SSR-safe) into document.body
 */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const [mounted, setMounted] = useState(false); // SSR-safe portal flag

  // On mount, mark as mounted so we can safely call createPortal
  useEffect(() => setMounted(true), []);

  // Remove a toast and clear its timer
  const dismiss = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  // Add a toast, optionally with auto-dismiss
  const add = useCallback(
    ({ type = "info", title, message, duration, sticky = false }) => {
      const id = nextId();
      const toast = { id, type, title, message, createdAt: Date.now() };
      setToasts((ts) => [toast, ...ts].slice(0, 6)); // keep at most 6

      // Default durations by type (if not explicitly provided)
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

  // Clear all toasts (and timers)
  const clear = useCallback(() => {
    setToasts([]);
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  }, []);

  // Public API
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
      {/* SSR-safe portal: only render when mounted in the browser */}
      {mounted && typeof document !== "undefined"
        ? createPortal(<ToastViewport toasts={toasts} dismiss={dismiss} />, document.body)
        : null}
    </ToastContext.Provider>
  );
}

/** Renders the toast stack */
function ToastViewport({ toasts, dismiss }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="
        pointer-events-none fixed z-[9999]
        inset-x-0 bottom-20 flex flex-col items-center gap-2 px-4
        md:inset-auto md:right-6 md:bottom-6 md:top-auto md:items-end md:px-0
      "
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

/** Individual toast UI */
function ToastItem({ toast, onClose }) {
  const { type, title, message } = toast;

  const scheme =
    type === "success"
      ? {
          border: "color-mix(in oklab, var(--color-success) 50%, transparent)",
          bg: "color-mix(in oklab, var(--color-success) 15%, white)",
          icon: <FaCheckCircle className="shrink-0 text-[var(--color-success)]" size={18} />,
        }
      : type === "error"
      ? {
          border: "color-mix(in oklab, var(--color-warning) 50%, transparent)",
          bg: "color-mix(in oklab, var(--color-warning) 15%, white)",
          icon: <FaExclamationTriangle className="shrink-0 text-[var(--color-warning)]" size={18} />,
        }
      : type === "loading"
      ? {
          border: "color-mix(in oklab, var(--color-cta) 50%, transparent)",
          bg: "color-mix(in oklab, var(--color-cta) 15%, white)",
          icon: (
            <svg className="shrink-0 h-5 w-5 animate-spin text-[var(--color-cta)]" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          ),
        }
      : {
          border: "color-mix(in oklab, var(--color-cta) 50%, transparent)",
          bg: "color-mix(in oklab, var(--color-cta) 15%, white)",
          icon: <FaInfoCircle className="shrink-0 text-[var(--color-cta)]" size={18} />,
        };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className="
        pointer-events-auto w-[min(90vw,420px)]
        border-2 rounded-xl shadow-lg
        backdrop-blur-sm
        px-4 py-3
        animate-in slide-in-from-bottom-5 fade-in-0 duration-300
      "
      style={{
        borderColor: scheme.border,
        background: scheme.bg,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{scheme.icon}</div>
        <div className="flex-1 min-w-0">
          {title && <div className="text-sm font-semibold text-primary mb-0.5">{title}</div>}
          {message && <div className="text-sm text-primary">{message}</div>}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-secondary hover:text-primary transition-colors p-1 -mt-1 -mr-2"
          aria-label="Dismiss"
          title="Dismiss"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </div>
  );
}
