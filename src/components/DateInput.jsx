// src/components/forms/DateInput.jsx
import { useEffect, useId, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

function toStartOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function DateInput({ label = "Date", value, onChange, required }) {
  const [open, setOpen] = useState(false);
  const inputId = useId();

  // default to today (start of day)
  const selected = useMemo(
    () => (value ? new Date(value) : toStartOfDay(new Date())),
    [value]
  );

  useEffect(() => {
    if (!value && onChange) onChange(toStartOfDay(new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <label htmlFor={inputId} className="block text-sm font-medium mb-1">
        {label}
        {required ? <span className="text-[--color-warning]"> *</span> : null}
      </label>

      {/* Looks like an input; no calendar icon */}
      <button
        id={inputId}
        type="button"
        className="input w-full text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-required={required || undefined}  // <- uses the prop to silence ESLint
      >
        {selected.toLocaleDateString()}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="
            absolute z-50 mt-2 bg-white rounded-xl shadow-card border p-2
            w-[18rem] max-w-[calc(100vw-2rem)] right-0
          "
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return;
              const start = toStartOfDay(d);
              onChange?.(start);
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
