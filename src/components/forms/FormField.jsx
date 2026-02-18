
import { FaExclamationCircle } from 'react-icons/fa';

/**
 * Reusable form field with built-in validation display
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required,
  disabled,
  className = '',
  wrapperClassName = '',
  min,
  max,
  step,
  autoComplete,
  ...props
}) {
  const showError = touched && error;
  const inputId = `field-${name}`;

  return (
    <div className={wrapperClassName}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-primary)' }}
        >
          {label}
          {required && <span className="text-[var(--color-warning)] ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        className={`input w-full ${showError ? 'border-[var(--color-warning)]' : ''} ${className}`}
        aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={showError ? `${inputId}-error` : undefined}
        {...props}
      />
      
      {showError && (
        <div
          id={`${inputId}-error`}
          className="mt-1 flex items-center gap-1 text-sm text-[var(--color-warning)]"
          role="alert"
        >
          <FaExclamationCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
