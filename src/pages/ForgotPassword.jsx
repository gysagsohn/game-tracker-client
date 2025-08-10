
import { useState } from "react";
import { Link } from "react-router-dom";
import GoogleButton from "../components/GoogleButton";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api from "../lib/axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOk("");
    setError("");
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setOk(res.data?.message || "Reset link sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Detect “Google-only” hint from API response
  const googleOnly = /google\s*sign[- ]?in/i.test(error);

  return (
    <div className="min-h-screen bg-default flex items-center justify-center p-6">
      <div className="card shadow-card p-6 bg-card rounded-[var(--radius-standard)] w-full max-w-md text-center">
        {/* SR announcement for screen readers */}
        <div aria-live="polite" className="sr-only">{ok || error}</div>

        <h1 className="h1 mb-2">Forgot password</h1>
        <p className="text-secondary mb-6">
          Enter your email and we’ll send you a password reset link.
        </p>

        {ok && (
          <div
            className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm"
            style={{
              borderColor: "color-mix(in oklab, var(--color-success) 40%, transparent)",
              background: "color-mix(in oklab, var(--color-success) 10%, white)",
            }}
          >
            {ok}
          </div>
        )}

        {error && (
          <div
            className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm"
            style={{
              borderColor: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
              background: "color-mix(in oklab, var(--color-warning) 10%, white)",
              color: "var(--color-warning)",
            }}
          >
            {error}
          </div>
        )}

        {/* Extra hint + Google button if this account is Google-only */}
        {googleOnly && (
          <div
            className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm text-left"
            style={{
              borderColor: "#4285F4",
              background: "color-mix(in oklab, #4285F4 8%, white)",
            }}
          >
            <p className="mb-3 text-primary">
              This account uses <strong>Google sign-in</strong>. Use the button below to continue.
            </p>
            <GoogleButton className="w-full" />
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button className="w-full" type="submit" loading={loading} disabled={loading}>
            Send reset link
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          Remembered?{" "}
          <Link to="/login" className="underline" style={{ color: "var(--color-cta)" }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
