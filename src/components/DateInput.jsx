// src/components/DateInput.jsx
import { useEffect, useId, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

function toStartOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function DateInput({ label = "Date", value, onChange }) {
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
      </label>
      <button
        id={inputId}
        type="button"
        className="input w-full text-left flex items-center justify-between"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{selected.toLocaleDateString()}</span>
        <span aria-hidden>📅</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-card border p-2">
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
            captionLayout="dropdown"
            initialFocus
          />
        </div>
      )}
    </div>
  );
}
