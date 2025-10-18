import { useEffect, useMemo, useState } from "react";
import ActionButtons from "../components/dashboard/ActionButtons";
import LastGameCard from "../components/dashboard/LastGameCard";
import StatsCard from "../components/dashboard/StatsCard";
import Alert from "../components/ui/Alert"; // ← shared alert banner
import { useAuth } from "../contexts/useAuth";
import api from "../lib/axios";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();

  // Local UI state
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  // Fetch sessions + stats together on mount (and when user id changes)
  useEffect(() => {
    let ignore = false; // avoid setting state after unmount

    async function load() {
      try {
        setLoading(true);
        setError("");

        // Fire both requests; if there's no user yet, return a resolved placeholder for stats
        const [mRes, sRes] = await Promise.all([
          api.get("/sessions"),
          user?._id ? api.get(`/users/${user._id}/stats`) : Promise.resolve({ data: { data: {} } }),
        ]);

        if (ignore) return;

        // Normalize payloads from API
        const mPayload = mRes.data?.data || mRes.data || [];
        const sPayload = sRes.data?.data || sRes.data || {};

        // Sort newest → oldest by date
        const sorted = Array.isArray(mPayload)
          ? [...mPayload].sort((a, b) => new Date(b.date) - new Date(a.date))
          : [];

        setMatches(sorted);
        setStats(sPayload);
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load dashboard data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [user?._id]);

  // Derive the “last match” once, memoized
  const lastMatch = useMemo(() => matches?.[0] || null, [matches]);

  return (
    <main className="py-2 lg:py-6">
      {/* Heading */}
      <h1 className="h1 text-center mb-6 lg:mb-10">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>

      {/* Error banner (replaces the placeholder div) */}
      {error && (
        <div className="mb-4">
          <Alert
            variant="error"
            title="Something went wrong"
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        </div>
      )}

      {/* Main cards; each handles its own loading skeletons */}
      <section className="grid gap-6 lg:gap-10 md:grid-cols-2 mb-8 lg:mb-12">
        {/* Only show LastGameCard if there's a match */}
        {lastMatch ? (
          <LastGameCard match={lastMatch} loading={loading} />
        ) : (
          !loading && (
            <Card className="p-6 text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
              <p className="text-secondary mb-4">
                Start tracking your game nights with friends!
              </p>
              <Link to="/matches/new" className="btn btn-primary inline-block">
                Log Your First Match
              </Link>
            </Card>
          )
        )}
        
        <StatsCard stats={stats} loading={loading} />
      </section>

      {/* Quick actions */}
      <div className="mt-6 lg:mt-10">
        <ActionButtons />
      </div>
    </main>
  );
}
