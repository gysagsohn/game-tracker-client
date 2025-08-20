// src/pages/NewMatch.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GameSelect from "../components/forms/GameSelect";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../contexts/useAuth";
import api from "../lib/axios";

const RESULT_OPTIONS = ["Win", "Loss", "Draw"]; // must match backend enum

export default function NewMatchPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [game, setGame] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    result: "Win",
    score: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      if (!game?._id) throw new Error("Please select a game.");

      const displayName =
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        user?.email ||
        "Player";

      const payload = {
        game: game._id,                          // <- ObjectId required
        date: form.date,                         // backend accepts Date
        players: [
          {
            user: user?._id || null,            // null if you ever allow guests
            name: displayName,                  // <- required
            email: user?.email,                 // optional
            result: form.result,                // "Win" | "Loss" | "Draw"
            score: form.score ? Number(form.score) : undefined,
          },
        ],
        notes: form.notes?.trim() || undefined,
        // createdBy: user?._id  // usually set in controller via auth middleware; omit if server handles it
      };

      await api.post("/sessions", payload);
      nav("/matches");
    } catch (e) {
      setErr(e.message || "Failed to create match.");
    } finally {
      setLoading(false);
    }
  };

  const disable = loading || !game?._id;

  return (
    <main className="py-2 lg:py-6">
      <h1 className="h1 text-center mb-6 lg:mb-10">Log a New Match</h1>

      <Card className="p-6 max-w-xl mx-auto">
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

        <form onSubmit={onSubmit} className="grid gap-4">
          <GameSelect value={game} onChange={setGame} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-secondary">Date</label>
              <input
                type="date"
                className="input"
                name="date"
                value={form.date}
                onChange={onChange}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-secondary">Your result</label>
              <select className="input" name="result" value={form.result} onChange={onChange}>
                {RESULT_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-secondary">Your score (optional)</label>
            <input
              className="input"
              name="score"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g., 42"
              value={form.score}
              onChange={onChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-secondary">Notes (optional)</label>
            <textarea
              className="input"
              name="notes"
              rows={3}
              placeholder="Anything to remember about this match…"
              value={form.notes}
              onChange={onChange}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={loading} disabled={disable} className="w-full">
              Save Match
            </Button>
            <button type="button" className="btn w-full" onClick={() => nav("/matches")}>
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </main>
  );
}
