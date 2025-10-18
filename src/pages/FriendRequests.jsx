import { useEffect, useState, useCallback } from "react";
import Card from "../components/ui/Card";
import { useToast } from "../contexts/useToast";
import api from "../lib/axios";
import FriendRequestCard from "../components/friends/FriendRequestCard";

export default function FriendRequestsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null); // senderId currently being acted on

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get("/friends/requests");
        const payload = res?.data?.data || res?.data || [];
        if (!ignore) setRequests(Array.isArray(payload) ? payload : []);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Failed to load requests.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const act = useCallback(async (senderId, action) => {
    try {
      setBusy(senderId);
      await api.post("/friends/respond", { senderId, action }); // "Accepted" | "Rejected"
      setRequests((prev) => prev.filter((r) => String(r.user?._id) !== String(senderId)));
      toast.success(action === "Accepted" ? "Friend added." : "Request declined.");
    } catch (e) {
      toast.error(e?.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  }, [toast]);

  return (
    <main className="py-2 lg:py-6">
      <h1 className="h1 text-center mb-6 lg:mb-10">Friend Requests</h1>

      {err && (
        <div
          className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm max-w-xl mx-auto"
          style={{
            borderColor: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
            background: "color-mix(in oklab, var(--color-warning) 10%, white)",
            color: "var(--color-warning)",
          }}
        >
          {err}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 max-w-xl mx-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-40 bg-[--color-border-muted] rounded mb-2 animate-pulse" />
              <div className="h-3 w-56 bg-[--color-border-muted] rounded animate-pulse" />
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-6 text-center max-w-xl mx-auto">
          <p className="text-secondary">No pending requests.</p>
        </Card>
      ) : (
        <div className="grid gap-3 max-w-xl mx-auto">
          {requests.map((r) => {
            const u = r.user || {};
            return (
              <FriendRequestCard
                key={String(u._id)}
                user={u}
                isBusy={busy === String(u._id)}
                onAccept={() => act(String(u._id), "Accepted")}
                onReject={() => act(String(u._id), "Rejected")}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}