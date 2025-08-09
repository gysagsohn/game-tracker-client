export default function Card({ className = "", children }) {
  return (
    <div className={`bg-card rounded-[var(--radius-standard)] shadow-card border border-[--color-border-muted]/60 ${className}`}>
      {children}
    </div>
  );
}