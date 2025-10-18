import { memo } from "react";
import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";

// Memo-ized LastGameCard - only re-renders when match or loading changes
const LastGameCard = memo(
  function LastGameCard({ match, loading }) {
    if (loading) {
      return (
        <Card className="p-4">
          <div className="text-center">
            <Skeleton variant="title" className="w-28 h-5 mb-4 mx-auto" />
            <Skeleton className="w-40 h-4 mb-2 mx-auto" />
            <Skeleton className="w-56 h-4 mb-2 mx-auto" />
            <Skeleton className="w-24 h-8 mx-auto" />
          </div>
        </Card>
      );
    }

    if (!match) {
      return (
        <Card className="p-4 text-center">
          <h3 className="text-sm font-semibold mb-2">Last Match</h3>
          <p className="text-secondary text-sm">No matches yet.</p>
        </Card>
      );
    }

    const when = match.date
      ? new Date(match.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      : "—";
    const game = match?.game?.name || "—";

    // try to infer "me" and opponents for a simple summary
    const players = Array.isArray(match.players) ? match.players : [];
    const me = players.find(p => p.user && (p.confirmed || p.result));
    const myResult = me?.result || "—";
    const opponents = players
      .filter(p => !me || !p.user || String(p.user?._id || p.user) !== String(me.user?._id || me.user))
      .map(p => p.name)
      .join(", ") || "—";

    return (
      <Card className="p-4 text-center">
        <h3 className="text-sm font-semibold mb-1">Last Match</h3>
        <div className="text-xs text-secondary mb-4">{when}</div>

        <div className="text-sm mb-1">
          <span className="font-medium">Game:</span> {game}
        </div>
        <div className="text-sm mb-1">
          <span className="font-medium">Opponents:</span> {opponents}
        </div>
        <div className="text-sm mb-4">
          <span className="font-medium">Your Result:</span> {myResult}
        </div>

        <a
          href={`/matches/${match._id}`}
          className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border
                     hover:bg-[color-mix(in oklab,var(--color-cta)_8%,transparent)]
                     transition-colors"
        >
          View match →
        </a>
      </Card>
    );
  },
  // Only re-render if loading state or match ID changes
  (prevProps, nextProps) => {
    return (
      prevProps.loading === nextProps.loading &&
      prevProps.match?._id === nextProps.match?._id
    );
  }
);

export default LastGameCard;