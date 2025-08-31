import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../contexts/useToast";
import api from "../lib/axios";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing token.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password has been reset. Please log in.");
      nav("/login", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-default flex items-center justify-center p-6">
      <div className="card shadow-card p-6 bg-card rounded-[var(--radius-standard)] w-full max-w-md">
        <h1 className="h1 mb-2">Reset password</h1>
        <p className="text-secondary mb-6">Choose a new password for your account.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
          <Button className="w-full" type="submit" loading={loading} disabled={loading || !token}>
            Reset password
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          <Link to="/login" className="underline" style={{ color: "var(--color-cta)" }}>
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
