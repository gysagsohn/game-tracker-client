export default function Button({ className = "", disabled, loading, children, ...props }) {
  const isDisabled = disabled || loading;
  return (
    <button
      className={`btn btn-primary relative ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="absolute left-3 inline-block animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      )}
      <span className={loading ? "opacity-70" : ""}>{children}</span>
    </button>
  );
}