
export default function PasswordStrength({ score = 0, label = "Weak" }) {
  const segments = [0, 1, 2];
  const active = (i) => i < score;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {segments.map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-[var(--radius-standard)]"
            style={{
              background: active(i)
                ? (score === 3 ? "var(--color-success)" : "var(--color-cta)")
                : "var(--color-border-muted)"
            }}
          />
        ))}
      </div>
      <div className="mt-1 text-xs text-secondary">{label}</div>
    </div>
  );
}
