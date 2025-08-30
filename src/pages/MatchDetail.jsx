// src/pages/MatchDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ActivityLog from "../components/matches/ActivityLog";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useToast } from "../contexts/ToastProvider";
import { useAuth } from "../contexts/useAuth";
import api from "../lib/axios";

function idOf(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && v._id) return v._id;
  return null;
}

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "";
  }
}

function toDateInputValue(d) {
  if (!d) return "";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function badgeStyles(result) {
  if (result === "Win") {
    return {
      borderColor: "color-mix(in oklab, var(--color-success) 45%, transparent)",
      background: "color-mix(in oklab, var(--color-success) 14%, white)",
    };
  }
  if (result === "Loss") {
    return {
      borderColor: "color-mix(in oklab, var(--color-warning) 45%, transparent)",
      background: "color-mix(in oklab, var(--color-warning) 12%, white)",
    };
  }
  if (result === "Draw") {
    return {
      borderColor: "color-mix(in oklab, var(--color-border-muted) 60%, transparent)",
      background: "color-mix(in oklab, var(--color-border-muted) 22%, white)",
    };
  }
  return {
    borderColor: "color-mix(in oklab, var(--color-border-muted) 60%, transparent)",
    background: "color-mix(in oklab, var(--color-border-muted) 12%, white)",
  };
}

export default function MatchDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const myId = user?._id ? String(user._id) : null;

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  // edit state
  const [editing, setEditing] = useState(false);
  const [formPlayers, setFormPlayers] = useState([]);
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState(""); // yyyy-mm-dd

  const amCreator = useMemo(() => {
    const c = match?.createdBy;
    const cid = c ? String(idOf(c)) : null;
    return !!myId && !!cid && cid === myId;
  }, [match, myId]);

  const canEdit = amCreator || user?.role === "admin";

  const me = useMemo(() => {
    const ps = match?.players || [];
    return ps.find((p) => String(idOf(p.user)) === myId) || null;
  }, [match, myId]);

  const canConfirm = !!me && me.confirmed === false;

  const hasUnconfirmedOthers = useMemo(() => {
    const ps = match?.players || [];
    return ps.some((p) => p.user && String(idOf(p.user)) !== myId && !p.confirmed);
  }, [match, myId]);

  const canRemind = amCreator && match?.matchStatus === "Pending" && hasUnconfirmedOthers;

  // Load
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/sessions/${id}`);
        const payload = res.data?.data || res.data;
        if (!ignore) {
          setMatch(payload);
          // prime edit form
          setFormPlayers(
            (payload?.players || []).map((p) => ({
              user: p.user ? { _id: idOf(p.user), firstName: p.user.firstName, lastName: p.user.lastName, email: p.user.email } : null,
              name: p.name || "",
              email: p.email || "",
              score: typeof p.score === "number" ? p.score : "",
              result: p.result || "",
              confirmed: !!p.confirmed,
            }))
          );
          setFormNotes(payload?.notes || "");
          setFormDate(toDateInputValue(payload?.date));
        }
      } catch (e) {
        // Redirects for common errors
        const msg = e?.message || "Failed to fetch match.";
        if (/not found/i.test(msg)) {
          toast.error("Match not found.");
          nav("/matches", { replace: true });
        } else if (/access denied|403/i.test(msg)) {
          toast.error("You don’t have access to this match.");
          nav("/matches", { replace: true });
        } else if (/401|unauthorized/i.test(msg)) {
          nav("/login", { replace: true });
        } else {
          setError(msg);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id, nav, toast]);

  // Derived activity log (from available fields)
  const activityItems = useMemo(() => {
    if (!match) return [];
    const items = [];
    if (match.createdAt) {
      const by = match.createdBy
        ? `${match.createdBy.firstName || ""} ${match.createdBy.lastName || ""}`.trim() || "Someone"
        : "Someone";
      items.push({ type: "created", text: `Created by ${by}`, date: match.createdAt });
    }
    // updates
    if (match.updatedAt && match.updatedAt !== match.createdAt) {
      const by = match.lastEditedBy
        ? `${match.lastEditedBy.firstName || ""} ${match.lastEditedBy.lastName || ""}`.trim() || "Someone"
        : "Someone";
      items.push({ type: "updated", text: `Updated by ${by}`, date: match.updatedAt });
    }
    // confirmations
    (match.players || []).forEach((p) => {
      if (p.confirmed && p.confirmedAt) {
        const who = p.user
          ? `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim() || p.name || "Player"
          : p.name || "Guest";
        items.push({ type: "confirmed", text: `${who} confirmed`, date: p.confirmedAt });
      }
    });
    // sort desc
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [match]);

  // Handlers
  async function handleConfirm() {
    try {
      await api.post(`/sessions/${id}/confirm`);
      // refresh or update local state optimistically
      setMatch((prev) => {
        if (!prev) return prev;
        const newPlayers = (prev.players || []).map((p) =>
          String(idOf(p.user)) === myId ? { ...p, confirmed: true, confirmedAt: new Date().toISOString() } : p
        );
        const allConfirmed = newPlayers.every((p) => (p.user ? p.confirmed : true));
        return { ...prev, players: newPlayers, matchStatus: allConfirmed ? "Confirmed" : "Pending" };
      });
      toast.success("Confirmed!");
    } catch (e) {
      const msg = e?.message || "Failed to confirm.";
      if (/401|unauthorized/i.test(msg)) {
        nav("/login", { replace: true });
        return;
      }
      toast.error(msg);
    }
  }

  async function handleRemind() {
    try {
      const res = await api.post(`/sessions/${id}/remind`);
      const count = res?.data?.data?.count;
      toast.success(`Reminder sent to ${typeof count === "number" ? count : "some"} player(s).`);
    } catch (e) {
      const msg = e?.message || "Failed to send reminders.";
      if (/401|unauthorized/i.test(msg)) {
        nav("/login", { replace: true });
        return;
      }
      toast.error(msg);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this match? This can’t be undone.")) return;
    try {
      await api.delete(`/sessions/${id}`);
      toast.success("Match deleted.");
      nav("/matches", { replace: true });
    } catch (e) {
      const msg = e?.message || "Failed to delete match.";
      if (/401|unauthorized/i.test(msg)) {
        nav("/login", { replace: true });
        return;
      }
      toast.error(msg);
    }
  }

  function onChangePlayer(idx, field, val) {
    setFormPlayers((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, [field]: field === "score" ? (val === "" ? "" : Number(val)) : val } : r))
    );
  }

  async function handleSave() {
    try {
      const payload = {
        // Allow creator/admin to update players, notes, and date
        players: canEdit
          ? formPlayers.map((p) => ({
              user: p.user ? idOf(p.user) : null,
              name: p.name || "",
              email: p.email || "",
              score: p.score === "" ? undefined : Number(p.score),
              result: p.result || "",
              // confirmed stays server-managed
            }))
          : undefined,
        notes: canEdit ? formNotes : undefined,
        date: canEdit && formDate ? new Date(formDate).toISOString() : undefined,
      };

      const res = await api.put(`/sessions/${id}`, payload);
      const updated = res.data?.data || res.data;

      setMatch(updated);
      setEditing(false);
      toast.success("Match updated.");
      // Optional: go back to list after save
      // nav("/matches");
    } catch (e) {
      const msg = e?.message || "Failed to update match.";
      if (/401|unauthorized/i.test(msg)) {
        nav("/login", { replace: true });
        return;
      }
      toast.error(msg);
    }
  }

  if (loading) {
    return (
      <main className="py-2 lg:py-6">
        <div className="grid gap-3 max-w-3xl mx-auto">
          <Card className="p-4">
            <div className="h-6 w-40 bg-[--color-border-muted] rounded mb-3 animate-pulse" />
            <div className="h-3 w-56 bg-[--color-border-muted] rounded mb-2 animate-pulse" />
            <div className="h-3 w-48 bg-[--color-border-muted] rounded animate-pulse" />
          </Card>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="py-2 lg:py-6">
        <Card className="p-4 max-w-2xl mx-auto">
          <p className="text-secondary">{error}</p>
          <div className="mt-3">
            <Link to="/matches" className="underline" style={{ color: "var(--color-cta)" }}>
              Back to matches
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (!match) return null;

  return (
    <main className="py-2 lg:py-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto px-1">
        <h1 className="h1">
          {match?.game?.name || "Game"}{" "}
          <span className="text-secondary text-sm font-normal">({fmtDate(match.date)})</span>
        </h1>
        <div className="hidden md:block">
          <Button className="btn-sm" onClick={() => nav("/matches")}>Back to matches</Button>
        </div>
      </div>

      <section className="grid gap-6 lg:gap-8 max-w-4xl mx-auto mt-4">
        {/* Summary card */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Status:</span>
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={
                  match.matchStatus === "Confirmed"
                    ? {
                        border: "color-mix(in oklab, var(--color-success) 45%, transparent)",
                        background: "color-mix(in oklab, var(--color-success) 12%, white)",
                      }
                    : {
                        border: "color-mix(in oklab, var(--color-border-muted) 60%, transparent)",
                        background: "color-mix(in oklab, var(--color-border-muted) 22%, white)",
                      }
                }
              >
                {match.matchStatus}
              </span>
            </div>

            <div className="text-xs text-secondary">
              {match.createdBy && (
                <span className="mr-3">
                  Created by{" "}
                  <strong>
                    {match.createdBy.firstName} {match.createdBy.lastName}
                  </strong>{" "}
                  on {fmtDate(match.createdAt)}
                </span>
              )}
              {match.lastEditedBy && (
                <span>
                  • Last edited by{" "}
                  <strong>
                    {match.lastEditedBy.firstName} {match.lastEditedBy.lastName}
                  </strong>{" "}
                  on {fmtDate(match.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Players card */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Players</h3>

          {/* read mode */}
          {!editing && (
            <>
              <div className="flex flex-wrap gap-2">
                {(match.players || []).map((p, idx) => {
                  const myRow = String(idOf(p.user)) === myId;
                  return (
                    <span
                      key={`${idOf(p.user) || "guest"}-${idx}`}
                      className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs"
                      style={{ borderColor: "var(--color-border-muted)" }}
                      title={p.user ? (p.confirmed ? "Confirmed" : "Pending confirmation") : "Guest"}
                    >
                      <span className="font-medium">{p.name || "Player"}</span>
                      {/* result chip */}
                      {p.result && (
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5"
                          style={badgeStyles(p.result)}
                        >
                          {p.result}
                        </span>
                      )}
                      {/* score */}
                      {typeof p.score === "number" && <span>Score: {p.score}</span>}
                      {/* confirmation */}
                      {p.user ? (
                        p.confirmed ? (
                          <span aria-label="Confirmed" title="Confirmed">✔︎</span>
                        ) : (
                          <span aria-label="Pending" title="Pending">⧗</span>
                        )
                      ) : (
                        <span className="text-secondary" title="Guest">Guest</span>
                      )}
                      {/* hint for guardrails */}
                      {!canEdit && !p.user && (
                        <span className="text-secondary" title="Only the match creator can edit guest players.">
                          (creator-only)
                        </span>
                      )}
                      {myRow && !p.confirmed && (
                        <span className="text-secondary" title="You can confirm below.">(you)</span>
                      )}
                    </span>
                  );
                })}
              </div>

              {/* actions row */}
              <div className="mt-4 flex flex-wrap gap-2">
                {canConfirm && (
                  <Button className="btn-sm" onClick={handleConfirm}>
                    Confirm I’m in
                  </Button>
                )}
                {canRemind && (
                  <Button className="btn-sm" onClick={handleRemind}>
                    Remind players
                  </Button>
                )}
                {canEdit && (
                  <Button className="btn-sm" onClick={() => setEditing(true)}>
                    Edit match
                  </Button>
                )}
                {amCreator && (
                  <button className="btn btn-warning btn-sm" onClick={handleDelete}>
                    Delete match
                  </button>
                )}
              </div>
            </>
          )}

          {/* edit mode */}
          {editing && (
            <div className="space-y-4">
              {amCreator && (
                <div className="max-w-xs">
                  <label className="mb-1 block text-sm text-secondary">Match date</label>
                  <input
                    type="date"
                    className="input"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-secondary">
                    <tr>
                      <th className="py-2 pr-2">Player</th>
                      <th className="py-2 pr-2">Score</th>
                      <th className="py-2 pr-2">Result</th>
                      <th className="py-2 pr-2">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formPlayers.map((p, idx) => {
                      const isGuest = !p.user;
                      const rowEditable = canEdit && (amCreator || !isGuest ? canEdit : amCreator);
                      // Guardrail: guests editable only by creator/admin
                      const disableGuestForNonCreator = isGuest && !amCreator && user?.role !== "admin";

                      return (
                        <tr key={idx} className="border-t" style={{ borderColor: "var(--color-border-muted)" }}>
                          <td className="py-2 pr-2">
                            <div className="font-medium">{p.name || "Player"}</div>
                            {p.user ? (
                              <div className="text-xs text-secondary">{p.user.email}</div>
                            ) : (
                              <div className="text-xs text-secondary">Guest{p.email ? ` • ${p.email}` : ""}</div>
                            )}
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              className="input"
                              value={p.score}
                              onChange={(e) => onChangePlayer(idx, "score", e.target.value)}
                              disabled={!rowEditable || disableGuestForNonCreator}
                              placeholder="—"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <select
                              className="input"
                              value={p.result || ""}
                              onChange={(e) => onChangePlayer(idx, "result", e.target.value)}
                              disabled={!rowEditable || disableGuestForNonCreator}
                            >
                              <option value="">—</option>
                              <option value="Win">Win</option>
                              <option value="Loss">Loss</option>
                              <option value="Draw">Draw</option>
                            </select>
                          </td>
                          <td className="py-2 pr-2">
                            <span className="text-xs text-secondary">{isGuest ? "Guest" : "User"}</span>
                            {disableGuestForNonCreator && (
                              <div className="text-xs text-secondary">Creator-only for guests</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="mb-1 block text-sm text-secondary">Notes</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Add any notes…"
                />
              </div>

              <div className="flex gap-2">
                <Button className="btn-sm" onClick={handleSave}>
                  Save changes
                </Button>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    // reset form from current match
                    setFormPlayers(
                      (match?.players || []).map((p) => ({
                        user: p.user ? { _id: idOf(p.user), firstName: p.user.firstName, lastName: p.user.lastName, email: p.user.email } : null,
                        name: p.name || "",
                        email: p.email || "",
                        score: typeof p.score === "number" ? p.score : "",
                        result: p.result || "",
                        confirmed: !!p.confirmed,
                      }))
                    );
                    setFormNotes(match?.notes || "");
                    setFormDate(toDateInputValue(match?.date));
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Activity log */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Activity</h3>
          <ActivityLog items={activityItems} />
        </Card>

        {/* Mobile back link */}
        <div className="md:hidden text-center">
          <Link to="/matches" className="underline" style={{ color: "var(--color-cta)" }}>
            Back to matches
          </Link>
        </div>
      </section>
    </main>
  );
}
