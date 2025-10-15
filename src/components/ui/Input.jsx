export default function Input({ label, error, hint, className = "", wrapperClassName = "", ...props }) {
  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && <label className="mb-1 block text-sm font-medium text-secondary">{label}</label>}
      <input className={`input ${className}`} {...props} />
      {error && <p className="mt-1 text-sm" style={{ color: "var(--color-warning)" }}>{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-secondary">{hint}</p>}
    </div>
  );
}