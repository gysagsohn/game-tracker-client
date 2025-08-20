// src/pages/MatchDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useToast } from "../contexts/toastContext";
import { useAuth } from "../contexts/useAuth";
import api from "../lib/axios";

function idOf(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && v._id) return v._id;
  return null;
}

export default function MatchDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const myId = user?._id ? String(user._id) : null;

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [reminding, setReminding] = useState(false);

  // Load one match
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get(`/sessions/${id}`);
        const payload = res.data?.data || res.data || null;
        if (!ignore) setMatch(payload);
      } catch (e) {
        if (!ignore) {
          setMatch(null);
          toast.error(e.message || "Failed to load match.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, toast]);

  const me = useMemo(() => {
    if (!match || !myId) return null;
    return (match.players || []).find((p) => String(idOf(p.user)) === myId) || null;
  }, [match, myId]);

  const createdByMe = useMemo(() => {
    if (!match || !myId) return false;
    return String(idOf(match.createdBy)) === myId;
  }, [match, myId]);

  const hasUnconfirmedOthers = useMemo(() => {
    if (!match) return false;
    return (match.players || []).some(
      (p) => p.user && String(idOf(p.user)) !== myId && !p.confirmed
    );
  }, [match, myId]);

  const canConfirmMe = Boolean(me && !me.confirmed);
  const canRemind = match?.matchStatus === "Pending" && createdByMe && hasUnconfirmedOthers;

  // Actions
  const confirmMe = async () => {
    try {
      setConfirming(true);
      await api.post(`/sessions/${id}/confirm`);
      // Optimistic local update
      setMatch((prev) => {
        if (!prev) return prev;
        const players = (prev.players || []).map((p) =>
          String(idOf(p.user)) === myId ? { ...p, confirmed: true, confirmedAt: new Date().toISOString() } : p
        );
        const allConfirmed = players.length > 0 && players.every((p) => (p.user ? p.confirmed : true));
        return { ...prev, players, matchStatus: allConfirmed ? "Confirmed" : prev.matchStatus };
      });
      toast.success("Confirmed. Thanks!");
    } catch (e) {
      toast.error(e.message || "Failed to confirm.");
    } finally {
      setConfirming(false);
    }
  };

  const remindPlayers = async () => {
    try {
      setReminding(true);
      const res = await api.post(`/sessions/${id}/remind`);
      const count =
        res?.data?.data?.count ??
        (res?.data?.message?.toLowerCase().includes("sent") ? "some" : 0);
      toast.success(`Reminder sent to ${count} unconfirmed player(s).`);
    } catch (e) {
      toast.error(e.message || "Failed to send reminders.");
    } finally {
      setReminding(false);
    }
  };

  // Quick helpers
  const dateStr = match?.date ? new Date(match.date).toLocaleString() : "";
  const gameName = match?.game?.name || "Game";
  const statusBadge =
    match?.matchStatus === "Confirmed"
      ? "bg-[color-mix(in_oklab,var(--color-success)_15%,white)]"
      : "bg-[color-mix(in_oklab,var(--color-border-muted)_35%,white)]";

  return (
    <main className="py-2 lg:py-6">
      <div className="mb-4">
        <Link to="/matches" className="text-sm underline" style={{ color: "var(--color-cta)" }}>
          ← Back to matches
        </Link>
      </div>

      <h1 className="h1 text-center mb-6 lg:mb-10">Match Details</h1>

      {loading ? (
        <div className="max-w-3xl mx-auto grid gap-3">
          <Card className="p-4">
            <div className="h-5 w-40 bg-[--color-border-muted] rounded mb-3 animate-pulse" />
            <div className="h-3 w-56 bg-[--color-border-muted] rounded animate-pulse" />
          </Card>
          <Card className="p-4">
            <div className="h-4 w-24 bg-[--color-border-muted] rounded mb-2 animate-pulse" />
            <div className="h-3 w-64 bg-[--color-border-muted] rounded animate-pulse" />
            <div className="h-3 w-52 bg-[--color-border-muted] rounded mt-2 animate-pulse" />
          </Card>
        </div>
      ) : !match ? (
        <Card className="p-6 max-w-2xl mx-auto text-center">
          <p className="text-secondary">Match not found or access denied.</p>
          <div className="mt-3">
            <button className="btn btn-sm" onClick={() => nav(0)}>Try again</button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 max-w-3xl mx-auto">
          {/* Header / summary */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="h2">{gameName}</h2>
                <div className="text-sm text-secondary mt-1">{dateStr}</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${statusBadge}`}>
                {match.matchStatus || "Pending"}
              </span>
            </div>

            {match.notes && (
              <p className="text-sm text-secondary mt-3 whitespace-pre-wrap">{match.notes}</p>
            )}
          </Card>

          {/* Players */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">Players</h3>
            <div className="grid gap-2">
              {(match.players || []).map((p, idx) => {
                const isMe = String(idOf(p.user)) === myId;
                return (
                  <div
                    key={`${String(idOf(p.user)) || "guest"}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 border border-[--color-border-muted] rounded-[var(--radius-standard)] p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.name || (isMe ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "You" : "Player")}
                        {isMe && <span className="ml-2 text-xs text-secondary">(you)</span>}
                      </div>
                      {p.email && <div className="text-xs text-secondary truncate">{p.email}</div>}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-secondary">Result:</span>
                      <span>{p.result || "—"}</span>

                      <span className="ml-3 text-secondary">Score:</span>
                      <span>{typeof p.score === "number" ? p.score : "—"}</span>

                      <span
                        className={`ml-3 text-xs px-2 py-0.5 rounded ${
                          p.confirmed
                            ? "bg-[color-mix(in_oklab,var(--color-success)_15%,white)]"
                            : "bg-[color-mix(in_oklab,var(--color-border-muted)_35%,white)]"
                        }`}
                        title={p.confirmed ? "Confirmed" : "Pending"}
                      >
                        {p.confirmed ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {canConfirmMe && (
                <Button className="btn-sm" onClick={confirmMe} disabled={confirming}>
                  {confirming ? "Confirming…" : "Confirm I'm in"}
                </Button>
              )}
              {canRemind && (
                <Button className="btn-sm" onClick={remindPlayers} disabled={reminding}>
                  {reminding ? "Sending…" : "Remind players"}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
