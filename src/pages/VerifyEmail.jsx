import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import api from "../lib/axios";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const nav = useNavigate();

  const [state, setState] = useState({
    loading: true,
    ok: "",
    error: "",
  });

  useEffect(() => {
    async function run() {
      if (!token) {
        setState({ loading: false, ok: "", error: "Missing or invalid verification token." });
        return;
      }
      try {
        const res = await api.get("/auth/verify-email", { params: { token } });
        setState({ loading: false, ok: res.data?.message || "Email verified successfully.", error: "" });
        // Optional: redirect to login after a short delay
        setTimeout(() => nav("/login"), 1500);
      } catch (e) {
        setState({ loading: false, ok: "", error: e.message || "Verification failed." });
      }
    }
    run();
  }, [token, nav]);

  const [email, setEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  const resend = async (e) => {
    e.preventDefault();
    setResendMsg("");
    if (!email.trim()) return setResendMsg("Enter your email first.");
    try {
      const res = await api.post("/auth/resend-verification-email", { email: email.trim() });
      setResendMsg(res.data?.message || "Verification email resent.");
    } catch (err) {
      setResendMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-default flex items-center justify-center p-6">
      <div className="card shadow-card p-6 bg-card rounded-[var(--radius-standard)] w-full max-w-md text-center">
        <h1 className="h1 mb-2">Verify your email</h1>
        <p className="text-secondary mb-6">
          We’re confirming your email address. This only takes a moment.
        </p>

        {state.loading && (
          <div className="mb-4 text-secondary inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
            Verifying…
          </div>
        )}

        {!state.loading && state.ok && (
          <div
            className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm"
            style={{
              borderColor: "color-mix(in oklab, var(--color-success) 40%, transparent)",
              background: "color-mix(in oklab, var(--color-success) 10%, white)",
            }}
          >
            {state.ok}
          </div>
        )}

        {!state.loading && state.error && (
          <>
            <div
              className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm"
              style={{
                borderColor: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
                background: "color-mix(in oklab, var(--color-warning) 10%, white)",
                color: "var(--color-warning)",
              }}
            >
              {state.error}
            </div>

            {/* Resend flow */}
            <form onSubmit={resend} className="space-y-3 text-left">
              <label className="mb-1 block text-sm text-secondary" htmlFor="resend-email">Email</label>
              <input
                id="resend-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full">Resend verification email</Button>
            </form>

            {resendMsg && (
              <p className="mt-3 text-sm" style={{ color: resendMsg.toLowerCase().includes("resent") ? "var(--color-success)" : "var(--color-warning)" }}>
                {resendMsg}
              </p>
            )}
          </>
        )}

        <p className="text-center text-sm mt-6">
          Done?{" "}
          <Link to="/login" className="underline" style={{ color: "var(--color-cta)" }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
