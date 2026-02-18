import { useEffect, useMemo, useState } from "react";
import api from "../../lib/axios";
import Button from "../ui/Button";

const RESULT_OPTIONS = ["", "Win", "Loss", "Draw"]; // "" = unset

function displayNameFor(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Me";
}

export default function PlayersField({ me, value = [], onChange }) {
  const myId = me?._id ? String(me._id) : null;

  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendError, setFriendError] = useState("");

  // Guest inputs
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Ensure "me" exists once & normalize me's fields
  const players = useMemo(() => {
    if (!myId) return value;
    const exists = value.some((p) => String(p.user?._id || p.user) === myId);
    if (!exists) {
      return [
        {
          user: myId,
          name: displayNameFor(me),
          email: me?.email,
          confirmed: true,
          invited: false,
          result: value.find((p) => String(p.user?._id || p.user) === myId)?.result || "",
          score: value.find((p) => String(p.user?._id || p.user) === myId)?.score,
        },
        ...value,
      ];
    }
    return value.map((p) =>
      String(p.user?._id || p.user) === myId
        ? { ...p, user: myId, name: displayNameFor(me), email: me?.email, confirmed: true, invited: false }
        : p
    );
  }, [value, me, myId]);

  useEffect(() => {
    // Push normalized players up if they changed identity
    if (players !== value) onChange?.(players);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  // Load friend list of current user
  useEffect(() => {
    if (!myId) return;
    let ignore = false;
    async function loadFriends() {
      try {
        setLoadingFriends(true);
        setFriendError("");
        const res = await api.get(`/friends/list/${myId}`);
        const raw = res.data?.data || res.data || [];
        const normalized = Array.isArray(raw)
          ? raw.map((u) => ({
              _id: u._id,
              name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Friend",
              email: u.email || "",
            }))
          : [];
        if (!ignore) setFriends(normalized);
      } catch (e) {
        if (!ignore) {
          setFriendError(e.message || "Failed to load friends.");
          setFriends([]);
        }
      } finally {
        if (!ignore) setLoadingFriends(false);
      }
    }
    loadFriends();
    return () => { ignore = true; };
  }, [myId]);

  const addFriend = (friendId) => {
    if (!friendId) return;
    const f = friends.find((x) => x._id === friendId);
    if (!f) return;
    const already = players.some((p) => String(p.user?._id || p.user) === friendId);
    if (already) return;

    onChange?.([
      ...players,
      {
        user: friendId,
        name: f.name,
        email: f.email,
        result: "",
        confirmed: false, // invited, needs confirmation
        invited: true,
      },
    ]);
  };

  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    const email = guestEmail.trim() || undefined;
    onChange?.([
      ...players,
      {
        user: null, // guest
        name,
        email,
        result: "",
        confirmed: true, // guests auto-confirmed
        invited: false,
      },
    ]);
    setGuestName("");
    setGuestEmail("");
  };

  const updatePlayer = (idx, patch) => {
    onChange?.(players.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const removePlayer = (idx) => {
    const p = players[idx];
    if (String(p?.user?._id || p?.user) === myId) return; // cannot remove me
    onChange?.(players.filter((_, i) => i !== idx));
  };

  const friendOptions = friends.filter(
    (f) => !players.some((p) => String(p.user?._id || p.user) === String(f._id))
  );

  return (
    <div className="grid gap-3">
      <label className="block text-sm font-medium text-secondary">Players</label>

      {/* Current players */}
      <div className="grid gap-2">
        {players.length === 0 ? (
          <div className="text-sm text-secondary">No players yet.</div>
        ) : (
          players.map((p, idx) => {
            const isMe = String(p.user?._id || p.user) === myId;
            return (
              <div
                key={`${String(p.user?._id || p.user) || "guest"}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 border border-[--color-border-muted] rounded-[var(--radius-standard)] p-2"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {p.name || (isMe ? displayNameFor(me) : "Player")}
                    {isMe && <span className="ml-2 text-xs text-secondary">(you)</span>}
                  </div>
                  {p.email && <div className="text-xs text-secondary">{p.email}</div>}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="input !py-1 !px-2 text-sm"
                    value={p.result || ""}
                    onChange={(e) => updatePlayer(idx, { result: e.target.value })}
                  >
                    {RESULT_OPTIONS.map((r) => (
                      <option key={r || "unset"} value={r}>
                        {r ? r : "— Result"}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input !py-1 !px-2 text-sm w-24"
                    placeholder="Score"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={p.score ?? ""}
                    onChange={(e) =>
                      updatePlayer(idx, {
                        score: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />

                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      p.confirmed
                        ? "bg-[color-mix(in oklab,var(--color-success)_15%,white)]"
                        : "bg-[color-mix(in oklab,var(--color-border-muted)_35%,white)]"
                    }`}
                    title={p.confirmed ? "Confirmed" : "Pending"}
                  >
                    {p.confirmed ? "Confirmed" : "Pending"}
                  </span>

                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => removePlayer(idx)}
                    disabled={isMe}
                    title={isMe ? "You must be part of the match" : "Remove player"}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add friend */}
      <div className="grid sm:grid-cols-[1fr_auto] gap-2">
        <select
          className="input"
          disabled={!myId || loadingFriends || friendOptions.length === 0}
          onChange={(e) => addFriend(e.target.value)}
          defaultValue=""
          aria-label="Add friend"
        >
          <option value="" disabled>
            {loadingFriends
              ? "Loading friends…"
              : friendOptions.length === 0
              ? friendError
                ? "Friends unavailable (try again later)"
                : "No more friends to add"
              : "Add friend…"}
          </option>
          {friendOptions.map((f) => (
            <option key={f._id} value={f._id}>
              {f.name} {f.email ? `— ${f.email}` : ""}
            </option>
          ))}
        </select>
        <div />
      </div>

      {/* Add guest */}
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input
          className="input"
          placeholder="Guest name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
        <input
          className="input"
          placeholder="Guest email (optional)"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
        />
        <Button type="button" className="btn-sm" onClick={addGuest} disabled={!guestName.trim()}>
          + Add guest
        </Button>
      </div>
    </div>
  );
}
