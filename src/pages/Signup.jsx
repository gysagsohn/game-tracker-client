// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";
import PasswordStrength from "../components/ui/PasswordStrength";
import { useAuth } from "../contexts/AuthContext";
import { isEmail, passwordStrength, validatePasswordStrict } from "../utils/validators";

export default function SignupPage() {
  const nav = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(form.password);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (name === "email") {
      setErrors((er) => ({ ...er, email: isEmail(value) ? "" : "Enter a valid email address." }));
    }
    if (name === "firstName") {
      setErrors((er) => ({ ...er, firstName: value.trim() ? "" : "First name is required." }));
    }
    if (name === "lastName") {
      setErrors((er) => ({ ...er, lastName: value.trim() ? "" : "Last name is required." }));
    }
    if (name === "password") {
      const res = validatePasswordStrict(value);
      setErrors((er) => ({
        ...er,
        password: res.ok ? "" : res.message,
        confirm: confirm === value ? "" : "Passwords do not match.",
      }));
    }
  };

  const onChangeConfirm = (e) => {
    const v = e.target.value;
    setConfirm(v);
    setErrors((er) => ({ ...er, confirm: v === form.password ? "" : "Passwords do not match." }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const emailErr = isEmail(form.email) ? "" : "Enter a valid email address.";
    const pwRes = validatePasswordStrict(form.password);
    const pwErr = pwRes.ok ? "" : pwRes.message;
    const fnErr = form.firstName.trim() ? "" : "First name is required.";
    const lnErr = form.lastName.trim() ? "" : "Last name is required.";
    const confErr = confirm === form.password ? "" : "Passwords do not match.";

    const nextErrors = { email: emailErr, password: pwErr, firstName: fnErr, lastName: lnErr, confirm: confErr };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    setFormError("");

    try {
      await signup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      
    nav(`/check-email?email=${encodeURIComponent(form.email.trim())}`, {
        state: { email: form.email.trim() }, // also pass in state as fallback
      });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading ||
    Object.values(errors).some(Boolean) ||
    !form.firstName ||
    !form.lastName ||
    !form.email ||
    !form.password ||
    !confirm;

  return (
    <div className="min-h-screen bg-default flex items-center justify-center p-6">
      <div className="card shadow-card p-6 bg-card rounded-[var(--radius-standard)] w-full max-w-md text-center">
        {/* ARIA live region to announce errors */}
        <div aria-live="polite" className="sr-only">
          {formError || Object.values(errors).find(Boolean) || ""}
        </div>

        <h1 className="h1 mb-2">Create account</h1>
        <p className="text-secondary mb-6">Start tracking wins &amp; losses</p>

        {formError && (
          <div
            className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm"
            style={{
              borderColor: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
              background: "color-mix(in oklab, var(--color-warning) 10%, white)",
              color: "var(--color-warning)",
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-left">
          <Input
            label="First name"
            name="firstName"
            value={form.firstName}
            onChange={onChange}
            required
          />
          {errors.firstName && (
            <p className="text-sm mt-1" style={{ color: "var(--color-warning)" }}>
              {errors.firstName}
            </p>
          )}

          <Input
            label="Last name"
            name="lastName"
            value={form.lastName}
            onChange={onChange}
            required
          />
          {errors.lastName && (
            <p className="text-sm mt-1" style={{ color: "var(--color-warning)" }}>
              {errors.lastName}
            </p>
          )}

          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
          />
          {errors.email && (
            <p className="text-sm mt-1" style={{ color: "var(--color-warning)" }}>
              {errors.email}
            </p>
          )}

          <PasswordInput
            label="Password"
            name="password"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            autoComplete="new-password"
          />
          <PasswordStrength score={strength.score} label={strength.label} />

          <PasswordInput
            label="Confirm password"
            name="confirm"
            value={confirm}
            onChange={onChangeConfirm}
            onBlur={onChangeConfirm}
            error={errors.confirm}
            autoComplete="new-password"
          />

          <Button type="submit" disabled={submitDisabled} className="w-full">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
                Creating…
              </span>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          Have an account?{" "}
          <Link to="/login" className="underline" style={{ color: "var(--color-cta)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
