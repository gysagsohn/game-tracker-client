import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";

export default function StatsCard({ stats, loading }) {
  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton variant="title" className="w-24 mb-4 mx-auto" />
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="w-28" />
            <Skeleton className="w-12" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="w-32" />
            <Skeleton className="w-12" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="w-36" />
            <Skeleton className="w-20" />
          </div>
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
        <div>
          <span className="font-medium">Total Wins:</span> {wins}
        </div>
        <div>
          <span className="font-medium">Total Losses:</span> {losses}
        </div>
        <div>
          <span className="font-medium">Most Played:</span> {mostPlayed}
        </div>
      </div>
    </Card>
  );
}
