// src/pages/Friends.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../contexts/useAuth";
import api from "../lib/axios";

function UserRow({ user, right }) {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "User";
  return (
    <div className="flex items-center justify-between gap-3 border border-[--color-border-muted] rounded-[var(--radius-standard)] p-2">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        {user?.email && <div className="text-xs text-secondary truncate">{user.email}</div>}
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

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);  // incoming
  const [sent, setSent] = useState([]);          // NEW: outgoing you sent
  const [suggested, setSuggested] = useState([]);

  const [targetEmail, setTargetEmail] = useState("");
  const [sending, setSending] = useState(false);

  const setTab = (next) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  };

  // Fetch helpers
  const fetchFriendsList = useCallback(async () => {
    const res = await api.get(`/friends/list/${myId}`);
    const payload = res.data?.data || res.data || [];
    setFriends(Array.isArray(payload) ? payload : []);
  }, [myId]);

  const fetchPendingRequests = useCallback(async () => {
    const res = await api.get("/friends/requests");
    const payload = res.data?.data || res.data || [];
    setRequests(Array.isArray(payload) ? payload : []);
  }, []);

  const fetchSent = useCallback(async () => {
    const res = await api.get("/friends/sent"); // returns [{ user, status }]
    const payload = res.data?.data || res.data || [];
    setSent(Array.isArray(payload) ? payload : []);
  }, []);

  // Load per tab
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!myId) return;
      try {
        setLoading(true);
        setErr("");
        setOk("");
        if (tab === "list") {
          if (!ignore) await fetchFriendsList();
        } else if (tab === "requests") {
          if (!ignore) await fetchPendingRequests();
        } else if (tab === "sent") {
          if (!ignore) await fetchSent();
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
    return () => { ignore = true; };
  }, [tab, myId, fetchFriendsList, fetchPendingRequests, fetchSent]);

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
      setErr(""); setOk("");
      await api.post("/friends/respond", { senderId, action: "Accepted" });
      await Promise.all([fetchPendingRequests(), fetchFriendsList()]);
      setOk("Friend request accepted.");
    } catch (e) {
      setErr(e.message || "Failed to accept.");
    }
  };

  const reject = async (senderId) => {
    try {
      setErr(""); setOk("");
      await api.post("/friends/respond", { senderId, action: "Rejected" });
      await fetchPendingRequests();
      setOk("Friend request rejected.");
    } catch (e) {
      setErr(e.message || "Failed to reject.");
    }
  };

  const unfriend = async (friendId) => {
    try {
      setErr(""); setOk("");
      await api.post("/friends/unfriend", { friendId });
      await fetchFriendsList();
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
      setErr(""); setOk("");
      await api.post("/friends/send", { email: targetEmail.trim() });
      setTargetEmail("");
      setOk("Friend request sent.");
      // Optionally refresh sent tab if user is on it
      if (tab === "sent") await fetchSent();
    } catch (e) {
      setErr(e.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  const addSuggested = async (u) => {
    if (!u?.email) return;
    try {
      setErr(""); setOk("");
      await api.post("/friends/send", { email: u.email });
      setOk(`Friend request sent to ${`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}`);
      if (tab === "sent") await fetchSent();
    } catch (e) {
      setErr(e.message || "Failed to send request.");
    }
  };

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

      <div className="flex flex-wrap items-center gap-2 justify-center mb-4">
        <TabButton id="list">My Friends {counts.list ? `(${counts.list})` : ""}</TabButton>
        <TabButton id="requests">Requests {counts.requests ? `(${counts.requests})` : ""}</TabButton>
        <TabButton id="sent">Sent {counts.sent ? `(${counts.sent})` : ""}</TabButton>
        <TabButton id="suggested">Suggested {counts.suggested ? `(${counts.suggested})` : ""}</TabButton>
      </div>

      {tab === "requests" && (
        <p className="text-xs text-secondary text-center mb-2">
          These are requests <em>sent to you</em>. Requests you send appear under the <strong>Sent</strong> tab.
        </p>
      )}

      <form onSubmit={sendByEmail} className="mx-auto max-w-xl mb-4 grid grid-cols-[1fr_auto] gap-2 items-end">
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

      {err && (
        <div
          className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm mx-auto max-w-xl"
          style={{
            borderColor: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
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
            borderColor: "color-mix(in oklab, var(--color-success) 40%, transparent)",
            background: "color-mix(in oklab, var(--color-success) 10%, white)",
          }}
        >
          {ok}
        </div>
      )}

      <div className="grid gap-3 max-w-3xl mx-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-40 bg-[--color-border-muted] rounded mb-2 animate-pulse" />
              <div className="h-3 w-56 bg-[--color-border-muted] rounded animate-pulse" />
            </Card>
          ))
        ) : tab === "list" ? (
          friends.length === 0 ? (
            <Card className="p-6 text-center"><p className="text-secondary">You haven’t added any friends yet.</p></Card>
          ) : (
            friends.map((u) => (
              <UserRow
                key={u._id}
                user={u}
                right={<Button className="btn-sm" onClick={() => unfriend(u._id)}>Unfriend</Button>}
              />
            ))
          )
        ) : tab === "requests" ? (
          requests.length === 0 ? (
            <Card className="p-6 text-center"><p className="text-secondary">No pending requests.</p></Card>
          ) : (
            requests.map((r) => (
              <UserRow
                key={r?.user?._id}
                user={r.user}
                right={
                  <>
                    <Button className="btn-sm" onClick={() => accept(r.user._id)}>Accept</Button>
                    <Button className="btn-sm" onClick={() => reject(r.user._id)}>Reject</Button>
                  </>
                }
              />
            ))
          )
        ) : tab === "sent" ? (
          sent.length === 0 ? (
            <Card className="p-6 text-center"><p className="text-secondary">You haven’t sent any requests yet.</p></Card>
          ) : (
            sent.map((r) => (
              <UserRow
                key={r?.user?._id}
                user={r.user}
                right={<span className="text-xs text-secondary">{r.status}</span>}
              />
            ))
          )
        ) : (
          suggested.length === 0 ? (
            <Card className="p-6 text-center"><p className="text-secondary">No suggestions right now.</p></Card>
          ) : (
            suggested.map((u) => (
              <UserRow
                key={u._id}
                user={u}
                right={
                  <Button className="btn-sm" onClick={() => addSuggested(u)} disabled={!u.email}>
                    Add friend
                  </Button>
                }
              />
            ))
          )
        )}
      </div>
    </main>
  );
}
