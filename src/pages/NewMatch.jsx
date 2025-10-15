import { formatISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DateInput from "../components/DateInput.jsx";
import GameSelect from "../components/forms/GameSelect";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../contexts/useAuth";
import { useToast } from "../contexts/useToast";
import api from "../lib/axios";

const RESULT_OPTIONS = ["Win", "Loss", "Draw"]; // must match backend enum

function idOf(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && v._id) return v._id;
  return null;
}

export default function NewMatchPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const location = useLocation();

  // Game & date (store Date object)
  const [game, setGame] = useState(null);
  const [date, setDate] = useState(() => new Date());
  const [notes, setNotes] = useState("");

  // Friends (for “Add friend”)
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Players (seed with you)
  const displayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    "Player";

  const [players, setPlayers] = useState([
    {
      kind: "self",
      user: {
        _id: user?._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      },
      name: displayName,
      email: user?.email,
      result: "Win",
      score: "",
      invited: false,
      confirmed: true,
    },
  ]);

  // “Add friend” UI
  const [friendIdToAdd, setFriendIdToAdd] = useState("");

  // “Add guest” UI
  const [guest, setGuest] = useState({ name: "", email: "", invited: false });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Load friend list
  useEffect(() => {
    let ignore = false;
    async function loadFriends() {
      if (!user?._id) return;
      try {
        setFriendsLoading(true);
        const res = await api.get(`/friends/list/${user._id}`);
        const payload = res.data?.data || res.data || [];
        if (!ignore) setFriends(Array.isArray(payload) ? payload : []);
      } catch (e) {
        console.warn("Failed to load friends:", e?.message);
      } finally {
        if (!ignore) setFriendsLoading(false);
      }
    }
    loadFriends();
    return () => {
      ignore = true;
    };
  }, [user?._id]);

  // If navigated from Add Game, you could auto-select the new game id (optional)
  useEffect(() => {
    const gid = location.state?.justAddedGameId;
    if (!gid) return;
    // If GameSelect supports a controlled id prop you can wire it here.
  }, [location.state]);

  const friendOptions = useMemo(() => {
    const already = new Set(
      players.map((p) => (p.user ? String(idOf(p.user)) : null)).filter(Boolean)
    );
    return friends.filter((f) => !already.has(String(idOf(f))));
  }, [friends, players]);

  function onChangePlayer(idx, field, val) {
    setPlayers((rows) =>
      rows.map((r, i) =>
        i === idx
          ? {
              ...r,
              [field]:
                field === "score"
                  ? val === ""
                    ? ""
                    : Number(val)
                  : field === "invited"
                  ? !!val
                  : val,
            }
          : r
      )
    );
  }

  function removePlayer(idx) {
    setPlayers((rows) => rows.filter((_, i) => i !== idx));
  }

  function addFriend() {
    if (!friendIdToAdd) return;
    const friend = friends.find((f) => String(idOf(f)) === String(friendIdToAdd));
    if (!friend) return;
    const exists = players.some(
      (p) => p.user && String(idOf(p.user)) === String(friendIdToAdd)
    );
    if (exists) {
      toast.info("That friend is already on the match.");
      setFriendIdToAdd("");
      return;
    }
    setPlayers((rows) => [
      ...rows,
      {
        kind: "user",
        user: friend,
        name:
          `${friend.firstName || ""} ${friend.lastName || ""}`.trim() ||
          friend.email ||
          "Player",
        email: friend.email || "",
        result: "",
        score: "",
        invited: false,
        confirmed: false,
      },
    ]);
    setFriendIdToAdd("");
  }

  function addGuest() {
    const n = guest.name.trim();
    const e = guest.email.trim();
    if (!n) {
      toast.error("Guest name is required.");
      return;
    }
    if (guest.invited && !e) {
      toast.error("Enter an email to send an invite.");
      return;
    }
    setPlayers((rows) => [
      ...rows,
      {
        kind: "guest",
        user: null,
        name: n,
        email: e || "",
        result: "",
        score: "",
        invited: !!guest.invited,
        confirmed: true, // backend auto-confirms guests
      },
    ]);
    setGuest({ name: "", email: "", invited: false });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!game?._id) {
      setErr("Please select a game.");
      return;
    }
    if (players.length < 1) {
      setErr("Add at least yourself or one player.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        game: game._id,
        // send ISO; default to today if date somehow null
        date: formatISO(date || new Date()),
        notes: notes?.trim() || undefined,
        players: players.map((p) => ({
          user: p.user ? idOf(p.user) : null,
          name: p.name || "",
          email: p.email || "",
          score: p.score === "" ? undefined : Number(p.score),
          result: p.result || "",
          invited: p.kind === "guest" ? !!p.invited : false,
        })),
      };

      const res = await api.post("/sessions", payload);
      const created = res?.data?.data || res?.data;
      toast.success("Match created!");
      if (created?._id) {
        nav(`/matches/${created._id}`);
      } else {
        nav("/matches");
      }
    } catch (e) {
      const msg = e?.message || "Failed to create match.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const disableSave = saving || !game?._id || players.length < 1;

  return (
    <main className="py-2 lg:py-6">
      <h1 className="h1 text-center mb-6 lg:mb-10">Log a New Match</h1>

      <Card className="p-6 max-w-3xl mx-auto">
        {err && (
          <div
            className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm"
            style={{
              borderColor:
                "color-mix(in oklab, var(--color-warning) 40%, transparent)",
              background:
                "color-mix(in oklab, var(--color-warning) 10%, white)",
              color: "var(--color-warning)",
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-5">
          {/* Game + helper link */}
          <div>
            <GameSelect value={game} onChange={setGame} allowCreate={true} />
            <div className="mt-1">
              <Link
                to="/games/new"
                className="underline text-sm"
                style={{ color: "var(--color-cta)" }}
              >
                Can’t find your game? Add it
              </Link>
            </div>
          </div>

          {/* Date (inline box, compact calendar) */}
          <div className="max-w-xs">
            <DateInput label="Date" value={date} onChange={setDate} required />
          </div>

          {/* Players table */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Players</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-secondary">
                  <tr>
                    <th className="py-2 pr-2">Name</th>
                    <th className="py-2 pr-2">Type</th>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2 pr-2">Score</th>
                    <th className="py-2 pr-2">Result</th>
                    <th className="py-2 pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, idx) => (
                    <tr
                      key={idx}
                      className="border-t"
                      style={{ borderColor: "var(--color-border-muted)" }}
                    >
                      <td className="py-2 pr-2">
                        {p.kind === "guest" ? (
                          <Input
                            value={p.name}
                            onChange={(e) =>
                              onChangePlayer(idx, "name", e.target.value)
                            }
                            placeholder="Guest name"
                          />
                        ) : (
                          <div className="font-medium">{p.name}</div>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <span className="text-xs text-secondary">
                          {p.kind === "self"
                            ? "You"
                            : p.kind === "user"
                            ? "User"
                            : "Guest"}
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        {p.kind === "guest" ? (
                          <Input
                            value={p.email}
                            onChange={(e) =>
                              onChangePlayer(idx, "email", e.target.value)
                            }
                            placeholder="guest@example.com"
                          />
                        ) : (
                          <span className="text-xs text-secondary">
                            {p.email || "—"}
                          </span>
                        )}
                        {p.kind === "guest" && (
                          <label className="mt-1 block text-xs">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={!!p.invited}
                              onChange={(e) =>
                                onChangePlayer(
                                  idx,
                                  "invited",
                                  e.target.checked
                                )
                              }
                            />
                            Send invite email
                          </label>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="input"
                          type="number"
                          value={p.score}
                          onChange={(e) =>
                            onChangePlayer(idx, "score", e.target.value)
                          }
                          placeholder="—"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          className="input"
                          value={p.result || ""}
                          onChange={(e) =>
                            onChangePlayer(idx, "result", e.target.value)
                          }
                        >
                          <option value="">—</option>
                          {RESULT_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        {p.kind === "self" ? (
                          <span className="text-xs text-secondary">You</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => removePlayer(idx)}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add friend */}
            <div className="mt-3 grid gap-2 sm:flex sm:items-end">
              <div className="sm:w-80">
                <label className="mb-1 block text-sm text-secondary">
                  Add friend
                </label>
                <select
                  className="input"
                  value={friendIdToAdd}
                  onChange={(e) => setFriendIdToAdd(e.target.value)}
                  disabled={friendsLoading || friendOptions.length === 0}
                >
                  <option value="">
                    {friendsLoading ? "Loading friends…" : "Select a friend…"}
                  </option>
                  {friendOptions.map((f) => (
                    <option key={String(idOf(f))} value={String(idOf(f))}>
                      {`${f.firstName || ""} ${f.lastName || ""}`.trim() ||
                        f.email}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                className="btn-sm"
                onClick={addFriend}
                disabled={!friendIdToAdd}
              >
                Add friend
              </Button>
            </div>

            {/* Add guest */}
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-secondary">
                  Guest name
                </label>
                <Input
                  value={guest.name}
                  onChange={(e) =>
                    setGuest((g) => ({ ...g, name: e.target.value }))
                  }
                  placeholder="Guest name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-secondary">
                  Guest email (optional)
                </label>
                <Input
                  value={guest.email}
                  onChange={(e) =>
                    setGuest((g) => ({ ...g, email: e.target.value }))
                  }
                  placeholder="guest@example.com"
                />
                <label className="mt-1 block text-xs">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={guest.invited}
                    onChange={(e) =>
                      setGuest((g) => ({ ...g, invited: e.target.checked }))
                    }
                  />
                  Send invite email
                </label>
              </div>
              <div className="flex items-end">
                <Button type="button" className="btn-sm" onClick={addGuest}>
                  Add guest
                </Button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm text-secondary">
              Notes (optional)
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Anything to remember about this match…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              loading={saving}
              disabled={disableSave}
              className="w-full"
            >
              Save Match
            </Button>
            <button
              type="button"
              className="btn w-full"
              onClick={() => nav("/matches")}
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </main>
  );
}
