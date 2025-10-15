import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../contexts/useAuth";
import api from "../lib/axios";
import Skeleton from "../components/ui/Skeleton";

function idOf(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && v._id) return v._id;
  return null;
}

function badgeClassForResult(r) {
  switch (r) {
    case "Win":
      return "bg-[color-mix(in_oklab,var(--color-success)_18%,white)]";
    case "Loss":
      return "bg-[color-mix(in_oklab,var(--color-warning)_18%,white)]";
    case "Draw":
      return "bg-[color-mix(in_oklab,var(--color-border-muted)_40%,white)]";
    default:
      return "";
  }
}

export default function MatchesPage() {
  const { user } = useAuth();
  const myId = user?._id ? String(user._id) : null;

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ result: "all", q: "" });
  const [confirmingId, setConfirmingId] = useState(null);
  const [remindingId, setRemindingId] = useState(null);
  const [remindMsg, setRemindMsg] = useState("");

  // Load my sessions
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/sessions");
        const payload = res.data?.data || res.data || [];
        if (!ignore) setMatches(Array.isArray(payload) ? payload : []);
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load matches.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Derived list with filters
  const list = useMemo(() => {
    let out = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filters.result !== "all") {
      out = out.filter((m) => {
        const me =
          (m?.players || []).find((p) => String(idOf(p.user)) === myId) || null;
        return (me?.result || "") === filters.result;
      });
    }

    const q = filters.q.trim().toLowerCase();
    if (q) {
      out = out.filter((m) => {
        const name = m?.game?.name || m?.game?.title || "";
        return String(name).toLowerCase().includes(q);
      });
    }
    return out;
  }, [matches, filters, myId]);

  const confirmMe = async (matchId) => {
    try {
      setConfirmingId(matchId);
      await api.post(`/sessions/${matchId}/confirm`);
      setMatches((prev) =>
        prev.map((m) => {
          if (m._id !== matchId) return m;
          const players = (m.players || []).map((p) =>
            String(idOf(p.user)) === myId
              ? { ...p, confirmed: true, confirmedAt: new Date().toISOString() }
              : p
          );
          const allConfirmed =
            players.length > 0 &&
            players.every((p) => (p.user ? p.confirmed : true));
          return { ...m, players, matchStatus: allConfirmed ? "Confirmed" : "Pending" };
        })
      );
    } catch (e) {
      setError(e.message || "Failed to confirm match.");
    } finally {
      setConfirmingId(null);
    }
  };

  const remindPlayers = async (matchId) => {
    try {
      setRemindMsg("");
      setRemindingId(matchId);
      const res = await api.post(`/sessions/${matchId}/remind`);
      const count =
        res?.data?.data?.count ??
        (res?.data?.message?.toLowerCase().includes("sent") ? "some" : 0);
      setRemindMsg(`Reminder sent to ${count} unconfirmed player(s).`);
    } catch (e) {
      setError(e.message || "Failed to send reminders.");
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <main className="py-2 lg:py-6">
      {/* Header with "+ New Match" button */}
      <div className="max-w-3xl mx-auto mb-6 lg:mb-10 px-1
                      flex flex-col items-center
                      md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        {/* Centered title; spans on md */}
        <h1 className="h1 text-center md:col-span-3">Match History</h1>

        {/* Action: small gap under title on mobile; none on md */}
        <div className="mt-2 md:mt-0 md:col-start-3 md:justify-self-end">
          <Link to="/matches/new" className="btn btn-primary md:btn">
            + New Match
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md sm:mx-auto md:max-w-lg">
        <input
          className="input col-span-2 md:col-span-1"
          placeholder="Search by game…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className="input md:col-span-1"
          value={filters.result}
          onChange={(e) => setFilters((f) => ({ ...f, result: e.target.value }))}
        >
          <option value="all">All results</option>
          <option value="Win">Wins</option>
          <option value="Loss">Losses</option>
          <option value="Draw">Draws</option>
        </select>
      </div>

      {/* Errors / success */}
      {error && (
        <div
          className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm mx-auto max-w-lg"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-warning) 40%, transparent)",
            background: "color-mix(in oklab, var(--color-warning) 10%, white)",
            color: "var(--color-warning)",
          }}
        >
          {error}
        </div>
      )}
      {remindMsg && (
        <div
          className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm mx-auto max-w-lg"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-success) 40%, transparent)",
            background: "color-mix(in oklab, var(--color-success) 10%, white)",
          }}
        >
          {remindMsg}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-3 max-w-3xl mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton variant="title" className="w-40" />
                <Skeleton variant="text" className="w-24" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-16" />
                <Skeleton className="w-20" />
                <Skeleton className="w-24 ml-3" />
                <Skeleton className="w-16" />
              </div>
              <div className="flex gap-2 mb-2">
                <Skeleton className="w-20 h-6 rounded-full" />
                <Skeleton className="w-20 h-6 rounded-full" />
                <Skeleton className="w-24 h-6 rounded-full" />
              </div>
              <Skeleton variant="text" className="w-full" />
            </Card>
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="p-6 text-center max-w-2xl mx-auto">
          <p className="text-secondary">
            No matches found.{" "}
            <Link
              to="/matches/new"
              className="underline"
              style={{ color: "var(--color-cta)" }}
            >
              Log your first one
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 max-w-3xl mx-auto">
          {list.map((m) => {
            const createdBy = String(idOf(m.createdBy));
            const amCreator = myId && createdBy === myId;

            const me =
              (m?.players || []).find((p) => String(idOf(p.user)) === myId) ||
              (m?.players || [])[0] ||
              null;

            const myResult = me?.result || "—";
            const canConfirm = !!me && me.confirmed === false;
            const hasUnconfirmedOthers = (m.players || []).some(
              (p) => p.user && String(idOf(p.user)) !== myId && !p.confirmed
            );
            const canRemind =
              m.matchStatus === "Pending" && amCreator && hasUnconfirmedOthers;

            const myBadge =
              myResult !== "—" ? (
                <span
                  className={`px-2 py-0.5 rounded text-xs ${badgeClassForResult(
                    myResult
                  )}`}
                >
                  {myResult}
                </span>
              ) : (
                <span>—</span>
              );

            return (
              <Card key={m._id} className="p-4">
                {/* Top row: game + date + quick nav */}
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-sm">
                    <Link
                      to={`/matches/${m._id}`}
                      className="underline hover:no-underline"
                      style={{ color: "var(--color-cta)" }}
                    >
                      {m?.game?.name || "Game"}
                    </Link>
                  </h3>
                  <span className="text-xs text-secondary">
                    {m?.date ? new Date(m.date).toLocaleDateString() : ""}
                  </span>
                </div>

                {/* Status + your result */}
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      m.matchStatus === "Confirmed"
                        ? "bg-[color-mix(in_oklab,var(--color-success)_15%,white)]"
                        : "bg-[color-mix(in_oklab,var(--color-border-muted)_35%,white)]"
                    }`}
                  >
                    {m.matchStatus || "Pending"}
                  </span>

                  <span className="ml-3 font-medium">Your result:</span>
                  {myBadge}
                </div>

                {/* Players (tiny guest hints) */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {(m.players || []).map((p, idx) => {
                    const isGuest = !p.user;
                    const guestIcon = amCreator ? "✎" : "🔒"; // creator can edit, others read-only
                    return (
                      <span
                        key={`${String(idOf(p.user)) || "guest"}-${idx}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[--color-border-muted] px-2 py-0.5 text-xs"
                        title={
                          isGuest
                            ? amCreator
                              ? "Guest • you can edit this player"
                              : "Guest • read-only"
                            : ""
                        }
                      >
                        <span>{p.name || "Player"}</span>
                        {isGuest && (
                          <span className="ml-1 px-1 rounded bg-[color-mix(in_oklab,var(--color-border-muted)_35%,white)]">
                            Guest {guestIcon}
                          </span>
                        )}
                        {p.confirmed ? (
                          <span title="Confirmed" aria-label="Confirmed">
                            ✔︎
                          </span>
                        ) : (
                          <span title="Pending" aria-label="Pending">
                            ⧗
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* Notes */}
                {m?.notes && (
                  <p className="text-sm text-secondary mt-2">{m.notes}</p>
                )}

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  {canConfirm && (
                    <Button
                      className="btn-sm"
                      onClick={() => confirmMe(m._id)}
                      disabled={confirmingId === m._id}
                    >
                      {confirmingId === m._id ? "Confirming…" : "Confirm I'm in"}
                    </Button>
                  )}

                  {canRemind && (
                    <Button
                      className="btn-sm"
                      onClick={() => remindPlayers(m._id)}
                      disabled={remindingId === m._id}
                    >
                      {remindingId === m._id ? "Sending…" : "Remind players"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
