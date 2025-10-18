import { memo } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";

// Memo-ized FriendRequestCard - only re-renders when user data or busy state changes
const FriendRequestCard = memo(
  function FriendRequestCard({ user, isBusy, onAccept, onReject }) {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";
    
    return (
      <Card className="p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-secondary">{user.email}</div>
        </div>
        <div className="flex gap-2">
          <Button
            className="btn-sm"
            onClick={onAccept}
            disabled={isBusy}
          >
            {isBusy ? "…" : "Accept"}
          </Button>
          <button
            className="btn btn-sm"
            onClick={onReject}
            disabled={isBusy}
          >
            {isBusy ? "…" : "Reject"}
          </button>
        </div>
      </Card>
    );
  },
  // Only re-render if user ID or busy state changes
  (prevProps, nextProps) => {
    return (
      prevProps.user._id === nextProps.user._id &&
      prevProps.isBusy === nextProps.isBusy
    );
  }
);

export default FriendRequestCard;