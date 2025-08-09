export default function Button({ className = "", disabled, children, ...props }) {
  return (
    <button className={`btn btn-primary ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}