
export function isEmail(value = "") {
  const v = String(value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Strict: use for Signup
export function validatePasswordStrict(value = "") {
  const v = String(value);
  if (v !== v.trim()) return { ok: false, message: "Password must not start or end with spaces." };
  if (/\s/.test(v)) return { ok: false, message: "Password must not contain spaces." };
  if (v.length < 8) return { ok: false, message: "At least 8 characters required." };
  if (!/[A-Za-z]/.test(v)) return { ok: false, message: "Include at least one letter." };
  if (!/[0-9]/.test(v)) return { ok: false, message: "Include at least one number." };
  if (!/[^A-Za-z0-9]/.test(v)) return { ok: false, message: "Include at least one symbol." };
  return { ok: true };
}

// Login: prevent common mistakes, don’t block legacy pw formats
export function validatePasswordLogin(value = "") {
  const v = String(value);
  if (v.trim().length === 0) return { ok: false, message: "Password is required." };
  if (v !== v.trim()) return { ok: false, message: "Password must not start or end with spaces." };
  if (/\s/.test(v)) return { ok: false, message: "Password must not contain spaces." };
  return { ok: true };
}

// Simple strength score 0-3
export function passwordStrength(value = "") {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Za-z]/.test(value) && /[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const label = ["Weak", "Weak", "Medium", "Strong"][score];
  return { score, label };
}
