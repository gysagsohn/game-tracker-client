import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

/**
 * Accessible alert banner
 * - variant: "info" | "success" | "warn" | "error"
 * - title?: optional strong heading
 * - children: message body (can be plain text or <p/> nodes)
 * - onClose?: show a dismiss (X) and call onClose()
 */
export default function Alert({ variant = "info", title, children, onClose, className = "" }) {
  const scheme =
    variant === "success"
      ? {
          role: "status",
          icon: <FaCheckCircle className="shrink-0" />,
          iconColor: "var(--color-success)",
          border: "color-mix(in oklab, var(--color-success) 50%, transparent)",
          bg: "color-mix(in oklab, var(--color-success) 12%, white)",
          text: "var(--color-primary)",
        }
      : variant === "warn"
      ? {
          role: "alert",
          icon: <FaExclamationTriangle className="shrink-0" />,
          iconColor: "var(--color-warning)",
          border: "color-mix(in oklab, var(--color-warning) 50%, transparent)",
          bg: "color-mix(in oklab, var(--color-warning) 12%, white)",
          text: "var(--color-primary)",
        }
      : variant === "error"
      ? {
          role: "alert",
          icon: <FaTimesCircle className="shrink-0" />,
          iconColor: "var(--color-warning)",
          border: "color-mix(in oklab, var(--color-warning) 55%, transparent)",
          bg: "color-mix(in oklab, var(--color-warning) 14%, white)",
          text: "var(--color-warning)",
        }
      : {
          role: "status",
          icon: <FaInfoCircle className="shrink-0" />,
          iconColor: "var(--color-cta)",
          border: "color-mix(in oklab, var(--color-cta) 50%, transparent)",
          bg: "color-mix(in oklab, var(--color-cta) 10%, white)",
          text: "var(--color-primary)",
        };

  return (
    <div
      role={scheme.role}
      className={`border-2 rounded-xl px-4 py-3 shadow-sm backdrop-blur-sm ${className}`}
      style={{ borderColor: scheme.border, background: scheme.bg, color: scheme.text }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5" style={{ color: scheme.iconColor }}>{scheme.icon}</div>
        <div className="flex-1 min-w-0">
          {title && <div className="text-sm font-semibold mb-0.5">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-secondary hover:text-primary transition-colors p-1 -mt-1 -mr-2"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <FaTimes size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
