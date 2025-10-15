import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useToast } from "../contexts/useToast";
import api from "../lib/axios";

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

  async function act(senderId, action) {
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
  }

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
            const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "User";
            return (
              <Card key={String(u._id)} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-secondary">{u.email}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="btn-sm"
                    onClick={() => act(String(u._id), "Accepted")}
                    disabled={busy === String(u._id)}
                  >
                    {busy === String(u._id) ? "…" : "Accept"}
                  </Button>
                  <button
                    className="btn btn-sm"
                    onClick={() => act(String(u._id), "Rejected")}
                    disabled={busy === String(u._id)}
                  >
                    {busy === String(u._id) ? "…" : "Reject"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
