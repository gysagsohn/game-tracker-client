import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import LiveRegion from "../components/a11y/LiveRegion";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import api from "../lib/axios";

export default function CheckEmailPage() {
  const [params] = useSearchParams();
  const location = useLocation();

  // Prefer query ?email=...; fallback to location.state?.email
  const emailFromQuery = params.get("email");
  const emailFromState = location.state?.email;
  const initialEmail = useMemo(() => emailFromQuery || emailFromState || "", [emailFromQuery, emailFromState]);

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (initialEmail && !email) setEmail(initialEmail);
  }, [initialEmail, email]);

  const resend = async (e) => {
    e.preventDefault();
    setOk(""); setErr("");
    if (!email.trim()) return setErr("Enter your email first.");
    setLoading(true);
    try {
      const res = await api.post("/auth/resend-verification-email", { email: email.trim() });
      setOk(res.data?.message || "Verification email resent.");
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-default flex items-center justify-center p-6">
      <div className="card shadow-card p-6 bg-card rounded-[var(--radius-standard)] w-full max-w-md text-center">
        <LiveRegion message={err || ok} />

        <h1 className="h1 mb-2">Check your email</h1>
        <p className="text-secondary mb-6">
          We’ve sent a verification link to {email ? <strong>{email}</strong> : "your email address"}.
          Click the link to activate your account.
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
        {err && (
          <div
            className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm"
            style={{
              borderColor: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
              background: "color-mix(in oklab, var(--color-warning) 10%, white)",
              color: "var(--color-warning)",
            }}
          >
            {err}
          </div>
        )}

        {/* Resend form */}
        <form onSubmit={resend} className="space-y-3 text-left">
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resending…" : "Resend verification email"}
          </Button>
        </form>

        <p className="text-sm text-secondary mt-4">
          Didn’t get it? Check spam, or try resending above.
        </p>

        <p className="text-center text-sm mt-6">
          Verified already?{" "}
          <Link to="/login" className="underline" style={{ color: "var(--color-cta)" }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
