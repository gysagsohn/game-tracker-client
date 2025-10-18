import { memo } from "react";
import {
  MdPersonAdd,
  MdCheckCircle,
  MdSportsEsports,
  MdAlarm,
  MdEdit,
  MdFlag,
  MdBlock,
  MdNotifications as MdBell
} from "react-icons/md";

const TYPE_ICON = {
  FRIEND_REQUEST: <MdPersonAdd size={20} />,
  FRIEND_ACCEPTED: <MdCheckCircle size={20} />,
  FRIEND_ACCEPT: <MdCheckCircle size={20} />,
  MATCH_INVITE: <MdSportsEsports size={20} />,
  MATCH_REMINDER: <MdAlarm size={20} />,
  MATCH_UPDATED: <MdEdit size={20} />,
  MATCH_CONFIRMED: <MdFlag size={20} />,
  MATCH_DECLINED: <MdBlock size={20} />,
  DEFAULT: <MdBell size={20} />,
};

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

// Memo-ized NotificationItem - only re-renders when notification data or busy state changes
const NotificationItem = memo(
  function NotificationItem({
    notification,
    isBusy,
    onFriendRespond,
    onConfirmMatch,
    onDeclineMatch,
    onMarkRead,
    onNavigate,
  }) {
    const n = notification;
    const icon = TYPE_ICON[n?.type] || TYPE_ICON.DEFAULT;
    
    const link = n?.link || (() => {
      switch (n?.type) {
        case 'FRIEND_REQUEST':
          return '/friends?tab=requests';
        case 'FRIEND_ACCEPTED':
        case 'FRIEND_ACCEPT':
          return '/friends';
        case 'MATCH_INVITE':
        case 'MATCH_REMINDER':
        case 'MATCH_UPDATED':
        case 'MATCH_CONFIRMED':
          if (n.sessionId) return `/matches/${n.sessionId}`;
          if (n.entityId) return `/matches/${n.entityId}`;
          return '/matches';
        default:
          return '#';
      }
    })();
    
    const isLink = link && link !== '#';

    const senderName =
      n?.sender?.firstName
        ? `${n.sender.firstName}${n.sender.lastName ? ' ' + n.sender.lastName : ''}`
        : undefined;

    const prettyType = (n?.type || 'Notification').replace(/_/g, ' ').trim();
    let title = n.title || prettyType;
    let description = n.description || undefined;

    if (!n.title) {
      switch (n?.type) {
        case 'FRIEND_REQUEST':
          title = `Friend request from ${senderName || 'someone'}`;
          break;
        case 'FRIEND_ACCEPTED':
        case 'FRIEND_ACCEPT':
          title = `${senderName || 'Your friend'} accepted your friend request`;
          break;
        case 'MATCH_INVITE':
          title = `You've been added to a match`;
          break;
        case 'MATCH_UPDATED':
          title = `Match was updated`;
          break;
        case 'MATCH_REMINDER':
          title = `Match reminder`;
          break;
        case 'MATCH_CONFIRMED':
          title = `Match confirmed`;
          break;
        case 'MATCH_DECLINED':
          title = `A player declined the match`;
          break;
        default:
          title = prettyType;
      }
    }

    return (
      <div
        className={classNames('p-4 flex items-start gap-3', n.isRead ? 'opacity-70' : '')}
      >
        <div className="leading-none shrink-0 text-[var(--color-secondary)]">
          {icon}
        </div>
        <div className="flex-1 min-w-0 max-h-48 overflow-auto pr-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-[var(--color-primary)] truncate">{title}</p>
            <span className="text-xs text-[var(--color-secondary)]">
              {n.createdAt ? timeAgo(n.createdAt) : ''}
            </span>
          </div>

          {description ? (
            <div className="mt-1 text-sm text-[var(--color-secondary)] max-h-32 overflow-auto pr-1">
              {description}
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            {n.type === 'FRIEND_REQUEST' && (n.sender || n?.sender?._id) && !n.isRead && (
              <>
                <button
                  onClick={() => onFriendRespond(n, 'Accepted')}
                  disabled={isBusy}
                  className="btn btn-primary"
                >
                  {isBusy ? 'Accepting…' : 'Accept'}
                </button>
                <button
                  onClick={() => onFriendRespond(n, 'Rejected')}
                  disabled={isBusy}
                  className="btn bg-white border border-[var(--color-warning)] text-[var(--color-warning)] hover:bg-[color-mix(in oklab,var(--color-warning)_10%,white)]"
                >
                  {isBusy ? 'Rejecting…' : 'Reject'}
                </button>
              </>
            )}

            {(n.type === 'MATCH_INVITE' || n.type === 'MATCH_UPDATED' || n.type === 'MATCH_REMINDER') &&
              n.sessionId && (
                <>
                  <button
                    onClick={() => onConfirmMatch(n)}
                    disabled={isBusy}
                    className="btn btn-primary"
                  >
                    {isBusy ? 'Confirming…' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => onDeclineMatch(n)}
                    disabled={isBusy}
                    className="btn bg-white border border-[var(--color-warning)] text-[var(--color-warning)] hover:bg-[color-mix(in oklab,var(--color-warning)_10%,white)]"
                  >
                    {isBusy ? 'Declining…' : 'Decline'}
                  </button>
                </>
              )}

            {isLink && (
              <button
                onClick={() => onNavigate(link)}
                className="btn bg-white border border-[var(--color-border-muted)]"
              >
                Open
              </button>
            )}

            {!n.isRead && (
              <button
                onClick={() => onMarkRead(n._id)}
                className="btn bg-white border border-[var(--color-border-muted)]"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
  // Only re-render if notification ID, read status, or busy state changes
  (prevProps, nextProps) => {
    return (
      prevProps.notification._id === nextProps.notification._id &&
      prevProps.notification.isRead === nextProps.notification.isRead &&
      prevProps.isBusy === nextProps.isBusy
    );
  }
);

export default NotificationItem;