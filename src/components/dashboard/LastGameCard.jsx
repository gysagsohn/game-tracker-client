import Card from "../ui/Card";

export default function LastGameCard({ match, loading }) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="h-4 w-32 bg-[--color-border-muted] rounded mb-3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-48 bg-[--color-border-muted] rounded animate-pulse" />
          <div className="h-3 w-40 bg-[--color-border-muted] rounded animate-pulse" />
          <div className="h-3 w-24 bg-[--color-border-muted] rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  if (!match) {
    return (
      <Card className="p-4 text-center">
        <h3 className="text-sm font-semibold mb-2">Your last game</h3>
        <p className="text-secondary text-sm">No matches yet. Log your first one.</p>
      </Card>
    );
  }

  const gameName = match?.game?.name || "Game";
  const date = match?.date ? new Date(match.date).toLocaleDateString() : "";
  const you = match?.players?.find(p => p?.user) || match?.players?.[0];
  const result = you?.result || "";

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3 text-center">Your last game</h3>
      <div className="grid grid-cols-[48px_1fr] gap-3 items-center">
        <div className="h-12 w-12 rounded bg-[--color-border-muted]/60" />
        <div className="text-sm">
          <div><span className="font-medium">Game:</span> {gameName}</div>
          <div><span className="font-medium">Date:</span> {date}</div>
          <div><span className="font-medium">Result:</span> {result}</div>
        </div>
      </div>
    </Card>
  );
}