import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ActionButtons from "../components/dashboard/ActionButtons";
import LastGameCard from "../components/dashboard/LastGameCard";
import StatsCard from "../components/dashboard/StatsCard";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";
import { useAuth } from "../contexts/useAuth";
import api from "../lib/axios";

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
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fire both requests
        const [mRes, sRes] = await Promise.all([
          api.get("/sessions"),
          api.get(`/users/${user._id}/stats`)
        ]);

        if (ignore) return;

        // Normalize payloads from API
        const mPayload = mRes.data?.data || mRes.data || [];
        const sPayload = sRes.data?.data || sRes.data || {};

        // Sort newest to oldest by date
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

  // Derive the "last match" once, memoized
  const lastMatch = useMemo(() => matches?.[0] || null, [matches]);

  return (
    <main className="py-2 lg:py-6">
      {/* Heading */}
      <h1 className="h1 text-center mb-6 lg:mb-10">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>

      {/* Error banner */}
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

      {/* Main cards */}
      <section className="grid gap-6 lg:gap-10 md:grid-cols-2 mb-8 lg:mb-12">
        {/* Last Match Card or Empty State */}
        {loading ? (
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </Card>
        ) : lastMatch ? (
          <LastGameCard match={lastMatch} loading={false} />
        ) : (
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