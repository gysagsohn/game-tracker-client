// src/components/DateInput.jsx
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

function toStartOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Props:
 * - value: Date | string | null
 * - onChange: (Date) => void
 * - label?: string
 * - required?: boolean
 * - className?: string
 */
export default function DateInput({
  label = "Date",
  value,
  onChange,
  required,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const wrapRef = useRef(null);

  const selected = useMemo(() => {
    if (!value) return toStartOfDay(new Date());
    const d = value instanceof Date ? value : new Date(value);
    return toStartOfDay(d);
  }, [value]);

  // default to today
  useEffect(() => {
    if (!value && onChange) onChange(toStartOfDay(new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <label htmlFor={inputId} className="block text-sm font-medium mb-1">
        {label}
        {required ? <span className="text-[var(--color-warning)]"> *</span> : null}
      </label>

      {/* Inline button so the “box” hugs the date text */}
      <button
        id={inputId}
        type="button"
        className={`input inline-block w-auto min-w-[9.5rem] ${className}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-required={required || undefined}
      >
        {selected.toLocaleDateString()}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="absolute z-50 top-full left-0 mt-2 bg-white rounded-xl shadow-card border p-2 overflow-hidden date-popover"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return;
              onChange?.(toStartOfDay(d));
              setOpen(false);
            }}
            weekStartsOn={1}
            captionLayout="dropdown-buttons"
            className="rdp-compact"
          />
        </div>
      )}
    </div>
  );
}
