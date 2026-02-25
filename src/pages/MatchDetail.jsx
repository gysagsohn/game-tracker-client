import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ActivityLog from "../components/matches/ActivityLog";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../contexts/useAuth";
import { useToast } from "../contexts/useToast";
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
function extractMatch(responseData) {
  if (!responseData) return null;
  if (responseData.data && responseData.data._id) return responseData.data;
  if (responseData._id) return responseData;
  return null;
}

export default function MatchDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const myId = user?._id ? String(user._id) : null;

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  // edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false); 
  const [formPlayers, setFormPlayers] = useState([]);
  const [formNotes, setFormNotes] = useState("");
  const [formDate, setFormDate] = useState("");

  const amCreator = useMemo(() => {
    const c = match?.createdBy;
    const cid = c ? String(idOf(c)) : null;
    return !!myId && !!cid && cid === myId;
  }, [match, myId]);

  const isPlayerInMatch = useMemo(() => {
    const ps = match?.players || [];
    return ps.some((p) => String(idOf(p.user)) === myId);
  }, [match, myId]);

  const canEdit = isPlayerInMatch || user?.role === "admin";

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

  function syncFormFromMatch(payload) {
    setFormPlayers(
      (payload?.players || []).map((p) => ({
        user: p.user
          ? { _id: idOf(p.user), firstName: p.user.firstName, lastName: p.user.lastName, email: p.user.email }
          : null,
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

  // Load
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/sessions/${id}`);
        const payload = extractMatch(res.data);
        if (!ignore) {
          setMatch(payload);
          syncFormFromMatch(payload);
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Failed to fetch match.";
        if (/not found/i.test(msg)) {
          toast.error("Match not found.");
          nav("/matches", { replace: true });
        } else if (/access denied|403/i.test(msg)) {
          toast.error("You don't have access to this match.");
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
    return () => { ignore = true; };
  }, [id, nav, toast]);

  async function handleConfirm() {
    try {
      await api.post(`/sessions/${id}/confirm`);
      setMatch((prev) => {
        if (!prev) return prev;
        const newPlayers = (prev.players || []).map((p) =>
          String(idOf(p.user)) === myId
            ? { ...p, confirmed: true, confirmedAt: new Date().toISOString() }
            : p
        );
        const allConfirmed = newPlayers.every((p) => (p.user ? p.confirmed : true));
        return { ...prev, players: newPlayers, matchStatus: allConfirmed ? "Confirmed" : "Pending" };
      });
      toast.success("Confirmed!");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to confirm.";
      if (/401|unauthorized/i.test(msg)) { nav("/login", { replace: true }); return; }
      toast.error(msg);
    }
  }

  async function handleDecline() {
    if (!confirm("Are you sure you want to decline this match?")) return;
    try {
      await api.post(`/sessions/${id}/decline`);
      toast.success("Match declined.");
      nav("/matches", { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to decline match.";
      if (/401|unauthorized/i.test(msg)) { nav("/login", { replace: true }); return; }
      toast.error(msg);
    }
  }

  async function handleRemind() {
    try {
      const res = await api.post(`/sessions/${id}/remind`);
      const count = res?.data?.data?.count;
      toast.success(`Reminder sent to ${typeof count === "number" ? count : "some"} player(s).`);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to send reminders.";
      if (/401|unauthorized/i.test(msg)) { nav("/login", { replace: true }); return; }
      toast.error(msg);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this match? This can't be undone.")) return;
    try {
      await api.delete(`/sessions/${id}`);
      toast.success("Match deleted.");
      nav("/matches", { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete match.";
      if (/401|unauthorized/i.test(msg)) { nav("/login", { replace: true }); return; }
      toast.error(msg);
    }
  }

  function onChangePlayer(idx, field, val) {
    setFormPlayers((rows) =>
      rows.map((r, i) =>
        i === idx
          ? { ...r, [field]: field === "score" ? (val === "" ? "" : Number(val)) : val }
          : r
      )
    );
  }

  async function handleSave() {
    if (saving) return; // prevent double-submit
    try {
      setSaving(true);
      const payload = {
        players: formPlayers.map((p) => ({
          user: p.user ? idOf(p.user) : null,
          name: p.name || "",
          email: p.email || "",
          score: p.score === "" ? undefined : Number(p.score),
          result: p.result || "",
          // confirmed is server-managed, intentionally omitted
        })),
        notes: formNotes,
        date: formDate ? new Date(formDate).toISOString() : undefined,
      };

      const res = await api.put(`/sessions/${id}`, payload);

      const updated = extractMatch(res.data);

      if (!updated) {
        throw new Error("Unexpected response from server. Please refresh and try again.");
      }

      setMatch(updated);
      syncFormFromMatch(updated);
      setEditing(false);
      toast.success("Match updated.");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update match.";
      if (/401|unauthorized/i.test(msg)) { nav("/login", { replace: true }); return; }
      toast.error(msg);
    } finally {
      setSaving(false);
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
                      {p.result && (
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5"
                          style={badgeStyles(p.result)}
                        >
                          {p.result}
                        </span>
                      )}
                      {typeof p.score === "number" && <span>Score: {p.score}</span>}
                      {p.user ? (
                        p.confirmed ? (
                          <span aria-label="Confirmed" title="Confirmed">✓</span>
                        ) : (
                          <span aria-label="Pending" title="Pending">○</span>
                        )
                      ) : (
                        <span className="text-secondary" title="Guest">Guest</span>
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
                  <>
                    <Button className="btn-sm" onClick={handleConfirm}>
                      Confirm I'm in
                    </Button>
                    <Button className="btn-sm btn-warning" onClick={handleDecline}>
                      Decline Match
                    </Button>
                  </>
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
              {/* Date only editable by creator */}
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
                      const disableGuestForNonCreator = isGuest && !amCreator && user?.role !== "admin";
                      const rowEditable = canEdit && !disableGuestForNonCreator;

                      return (
                        <tr key={idx} className="border-t" style={{ borderColor: "var(--color-border-muted)" }}>
                          <td className="py-2 pr-2">
                            <div className="font-medium">{p.name || "Player"}</div>
                            {p.user ? (
                              <div className="text-xs text-secondary">{p.user.email}</div>
                            ) : (
                              <div className="text-xs text-secondary">
                                Guest{p.email ? ` • ${p.email}` : ""}
                              </div>
                            )}
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              className="input"
                              value={p.score}
                              onChange={(e) => onChangePlayer(idx, "score", e.target.value)}
                              disabled={!rowEditable}
                              placeholder="—"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <select
                              className="input"
                              value={p.result || ""}
                              onChange={(e) => onChangePlayer(idx, "result", e.target.value)}
                              disabled={!rowEditable}
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
                              <div className="text-xs text-secondary">Creator-only</div>
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
                  placeholder="Add any notes…"
                />
              </div>

              <div className="flex gap-2">
                <Button className="btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <button
                  className="btn btn-sm"
                  disabled={saving}
                  onClick={() => {
                    syncFormFromMatch(match);
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
          <ActivityLog session={match} />
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