import Card from "../ui/Card";

export default function StatsCard({ stats, loading }) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="h-4 w-24 bg-[--color-border-muted] rounded mb-3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-40 bg-[--color-border-muted] rounded animate-pulse" />
          <div className="h-3 w-36 bg-[--color-border-muted] rounded animate-pulse" />
          <div className="h-3 w-48 bg-[--color-border-muted] rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const mostPlayed = stats?.mostPlayed || "—";

  return (
    <Card className="p-4 text-center">
      <h3 className="text-sm font-semibold mb-3">Your Stats</h3>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Total Wins:</span> {wins}</div>
        <div><span className="font-medium">Total Losses:</span> {losses}</div>
        <div><span className="font-medium">Most Played:</span> {mostPlayed}</div>
      </div>
    </Card>
  );
}