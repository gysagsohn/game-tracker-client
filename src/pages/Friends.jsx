// src/pages/Friends.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../contexts/useAuth";
import api from "../lib/axios";
import FriendSearch from "../components/friends/FriendSearch";
import Skeleton from "../components/ui/Skeleton";

function UserRow({ user, right, subtitle }) {
  const name =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    "User";
  return (
    <div className="flex items-center justify-between gap-3 border border-[--color-border-muted] rounded-[var(--radius-standard)] p-2">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        {(user?.email || subtitle) && (
          <div className="text-xs text-secondary truncate">
            {subtitle || user?.email}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();
  const myId = user?._id;

  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "list";

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  // data
  const [friends, setFriends] = useState([]); // /friends/list/:id
  const [requests, setRequests] = useState([]); // /friends/requests  [{ user, status }]
  const [sent, setSent] = useState([]); // /friends/sent      [{ user, status }]
  const [suggested, setSuggested] = useState([]); // /friends/suggested

  // send-by-email form
  const [targetEmail, setTargetEmail] = useState("");
  const [sending, setSending] = useState(false);

  const setTab = (next) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  };

  // Load data for the current tab
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!myId) return;
      try {
        setLoading(true);
        setErr("");
        setOk("");

        if (tab === "list") {
          const res = await api.get(`/friends/list/${myId}`);
          const payload = res.data?.data || res.data || [];
          if (!ignore) setFriends(Array.isArray(payload) ? payload : []);
        } else if (tab === "requests") {
          const res = await api.get("/friends/requests");
          const payload = res.data?.data || res.data || [];
          if (!ignore) setRequests(Array.isArray(payload) ? payload : []);
        } else if (tab === "sent") {
          const res = await api.get("/friends/sent"); // Pending by default
          const payload = res.data?.data || res.data || [];
          if (!ignore) setSent(Array.isArray(payload) ? payload : []);
        } else if (tab === "suggested") {
          const res = await api.get("/friends/suggested");
          const payload = res.data?.data || res.data || [];
          if (!ignore) setSuggested(Array.isArray(payload) ? payload : []);
        }
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [tab, myId]);

  // counts shown on tabs
  const counts = useMemo(
    () => ({
      list: friends.length,
      requests: requests.length,
      sent: sent.length,
      suggested: suggested.length,
    }),
    [friends.length, requests.length, sent.length, suggested.length]
  );

  // Actions
  const accept = async (senderId) => {
    try {
      setErr("");
      setOk("");
      await api.post("/friends/respond", { senderId, action: "Accepted" });
      setRequests((prev) => prev.filter((r) => r.user?._id !== senderId));
      setOk("Friend request accepted.");
    } catch (e) {
      setErr(e.message || "Failed to accept.");
    }
  };

  const reject = async (senderId) => {
    try {
      setErr("");
      setOk("");
      await api.post("/friends/respond", { senderId, action: "Rejected" });
      setRequests((prev) => prev.filter((r) => r.user?._id !== senderId));
      setOk("Friend request rejected.");
    } catch (e) {
      setErr(e.message || "Failed to reject.");
    }
  };

  const unfriend = async (friendId) => {
    try {
      setErr("");
      setOk("");
      await api.post("/friends/unfriend", { friendId });
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      setOk("Removed from friends.");
    } catch (e) {
      setErr(e.message || "Failed to unfriend.");
    }
  };

  const sendByEmail = async (e) => {
    e.preventDefault();
    if (!targetEmail.trim()) return;
    try {
      setSending(true);
      setErr("");
      setOk("");
      await api.post("/friends/send", { email: targetEmail.trim() });
      setTargetEmail("");
      setOk("Friend request sent.");
      if (tab === "sent") {
        const res = await api.get("/friends/sent");
        setSent(res.data?.data || res.data || []);
      }
    } catch (e) {
      setErr(e.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  const addSuggested = async (u) => {
    if (!u?.email) return;
    try {
      setErr("");
      setOk("");
      await api.post("/friends/send", { email: u.email });
      setOk(
        `Friend request sent to ${u.firstName || ""} ${u.lastName || ""}`.trim()
      );
      if (tab === "sent") {
        const res = await api.get("/friends/sent");
        setSent(res.data?.data || res.data || []);
      }
    } catch (e) {
      setErr(e.message || "Failed to send request.");
    }
  };

  // UI helpers
  const TabButton = ({ id, children }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`px-3 py-2 rounded-[var(--radius-standard)] text-sm ${
        tab === id
          ? "bg-[color-mix(in_oklab,var(--color-border-muted)_25%,white)]"
          : "hover:bg-[color-mix(in_oklab,var(--color-border-muted)_20%,white)]"
      }`}
      aria-current={tab === id ? "page" : undefined}
    >
      {children}
    </button>
  );

  return (
    <main className="py-2 lg:py-6">
      <h1 className="h1 text-center mb-6 lg:mb-10">Friends</h1>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 justify-center mb-4">
        <TabButton id="list">
          My Friends {counts.list ? `(${counts.list})` : ""}
        </TabButton>
        <TabButton id="requests">
          Requests {counts.requests ? `(${counts.requests})` : ""}
        </TabButton>
        <TabButton id="sent">
          Sent {counts.sent ? `(${counts.sent})` : ""}
        </TabButton>
        <TabButton id="suggested">
          Suggested {counts.suggested ? `(${counts.suggested})` : ""}
        </TabButton>
      </div>
      <div className="mb-6">
        <FriendSearch />
      </div>

      {/* Quick send by email (visible on all tabs) */}
      <form
        onSubmit={sendByEmail}
        className="mx-auto max-w-xl mb-4 grid grid-cols-[1fr_auto] gap-2 items-end"
      >
        <Input
          label="Send a friend request by email"
          type="email"
          placeholder="friend@example.com"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={sending} className="btn-sm">
          {sending ? "Sending…" : "Send"}
        </Button>
      </form>

      {/* Feedback banners */}
      {err && (
        <div
          className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm mx-auto max-w-xl"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-warning) 40%, transparent)",
            background: "color-mix(in oklab, var(--color-warning) 10%, white)",
            color: "var(--color-warning)",
          }}
        >
          {err}
        </div>
      )}
      {ok && (
        <div
          className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm mx-auto max-w-xl"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-success) 40%, transparent)",
            background: "color-mix(in oklab, var(--color-success) 10%, white)",
          }}
        >
          {ok}
        </div>
      )}

      {/* Content per tab */}
      <div className="grid gap-3 max-w-3xl mx-auto">
        {loading ? (
          <div className="grid gap-3 max-w-3xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton variant="avatar" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-32" />
                      <Skeleton variant="text" className="w-48" />
                    </div>
                  </div>
                  <Skeleton variant="button" className="w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : tab === "list" ? (
          friends.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-secondary">You haven’t added any friends yet.</p>
            </Card>
          ) : (
            friends.map((u) => (
              <UserRow
                key={u._id}
                user={u}
                right={
                  <Button className="btn-sm" onClick={() => unfriend(u._id)}>
                    Unfriend
                  </Button>
                }
              />
            ))
          )
        ) : tab === "requests" ? (
          requests.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-secondary">No pending requests.</p>
            </Card>
          ) : (
            requests.map((r) => (
              <UserRow
                key={r?.user?._id}
                user={r.user}
                right={
                  <>
                    <Button className="btn-sm" onClick={() => accept(r.user._id)}>
                      Accept
                    </Button>
                    <Button className="btn-sm" onClick={() => reject(r.user._id)}>
                      Reject
                    </Button>
                  </>
                }
              />
            ))
          )
        ) : tab === "sent" ? (
          sent.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-secondary">No sent requests.</p>
            </Card>
          ) : (
            sent.map((r) => (
              <UserRow
                key={r?.user?._id}
                user={r.user}
                subtitle={`Status: ${r.status || "Pending"}`}
                right={null}
              />
            ))
          )
        ) : suggested.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-secondary">No suggestions right now.</p>
          </Card>
        ) : (
          suggested.map((u) => (
            <UserRow
              key={u._id}
              user={u}
              right={
                <Button
                  className="btn-sm"
                  onClick={() => addSuggested(u)}
                  disabled={!u.email}
                >
                  Add friend
                </Button>
              }
            />
          ))
        )}
      </div>
    </main>
  );
}
