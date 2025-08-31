// src/pages/AddGame.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../contexts/useAuth";
import { useToast } from "../contexts/useToast";
import api from "../lib/axios";

export default function AddGamePage() {
  const nav = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.name.trim()) return setErr("Game name is required.");
    try {
      setLoading(true);
      const res = await api.post("/games", { name: form.name.trim() });
      const game = res?.data?.data || res?.data;
      toast.success("Game added!");
      nav("/matches/new", { state: { justAddedGameId: game?._id } });
    } catch (e) {
      const msg = e?.message || "Failed to add game.";
      toast.error(msg);
      if (/401|unauthorized/i.test(msg)) nav("/login", { replace: true });
      else setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user?._id) {
    return (
      <main className="py-2 lg:py-6">
        <Card className="p-6 max-w-md mx-auto text-center">
          <p className="text-secondary mb-3">Please sign in to add a game.</p>
          <Link to="/login" className="underline" style={{ color: "var(--color-cta)" }}>
            Go to login
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="py-2 lg:py-6">
      <Card className="p-6 max-w-md mx-auto">
        <h1 className="h1 mb-2">Add a game</h1>
        <p className="text-secondary mb-4">Create a new game so you can log matches against it.</p>

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

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Game name"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="e.g., Chess, FIFA 24, Catan"
            required
          />

          <div className="flex items-center gap-2">
            <Button type="submit" className="btn-primary" disabled={loading || !form.name.trim()}>
              {loading ? "Adding…" : "Add game"}
            </Button>
            <Link to="/matches/new" className="underline text-sm" style={{ color: "var(--color-cta)" }}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
