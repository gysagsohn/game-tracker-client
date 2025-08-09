import { useEffect, useMemo, useState } from "react";
import ActionButtons from "../components/dashboard/ActionButtons";
import LastGameCard from "../components/dashboard/LastGameCard";
import StatsCard from "../components/dashboard/StatsCard";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [mRes, sRes] = await Promise.all([
          api.get("/sessions"),
          user?._id ? api.get(`/users/${user._id}/stats`) : Promise.resolve({ data: { data: {} } }),
        ]);
        if (ignore) return;
        const mPayload = mRes.data?.data || mRes.data || [];
        const sPayload = sRes.data?.data || sRes.data || {};
        const sorted = Array.isArray(mPayload)
          ? [...mPayload].sort((a, b) => new Date(b.date) - new Date(a.date))
          : [];
        setMatches(sorted);
        setStats(sPayload);
      } catch (e) {
        if (!ignore) setError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [user?._id]);

  const lastMatch = useMemo(() => matches?.[0] || null, [matches]);


    return (
    <main className="py-2 lg:py-6">
        <h1 className="h1 text-center mb-6 lg:mb-10">
        Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>

        {error && (
        <div /* existing error styles */>{error}</div>
        )}

        <section className="grid gap-6 lg:gap-10 md:grid-cols-2 mb-8 lg:mb-12">
        <LastGameCard match={lastMatch} loading={loading} />
        <StatsCard stats={stats} loading={loading} />
        </section>

        <div className="mt-6 lg:mt-10">
        <ActionButtons />
        </div>
    </main>
    );
}