// src/pages/Notifications.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../contexts/useToast.js';
import { respondFriendRequest } from '../lib/api/friends.js';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/api/notifications.js';
import { confirmSession, declineSession } from '../lib/api/sessions.js';

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

const TYPE_ICON = {
  FRIEND_REQUEST: '👋',
  FRIEND_ACCEPTED: '✅',
  FRIEND_ACCEPT: '✅',
  MATCH_INVITE: '🎮',
  MATCH_REMINDER: '⏰',
  MATCH_UPDATED: '✏️',
  MATCH_CONFIRMED: '🏁',
  MATCH_DECLINED: '🚫',
  DEFAULT: '🔔',
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

function resolveLink(n) {
  if (n?.link) return n.link;
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
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [busy, setBusy] = useState({});
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') || 'unread').toLowerCase();
  const page = parseInt(params.get('page') || '1', 10);
  const limit = parseInt(params.get('limit') || '20', 10);
  const { toast } = useToast();
  const navigate = useNavigate();

  const hasNext = useMemo(() => meta.page * meta.limit < meta.total, [meta]);
  const hasPrev = page > 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNotifications({ status, page, limit });
      setItems(res.data || []);
      setMeta(res.meta || { page, limit, total: 0, unreadCount: 0 });
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [status, page, limit, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function onMarkRead(id) {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setMeta((m) => ({ ...m, unreadCount: Math.max(0, (m.unreadCount || 0) - 1) }));
      toast.success('Marked as read');
    } catch {
      toast.error('Could not mark as read');
    }
  }

  async function onFriendRespond(n, action) {
    const id = n._id;
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await respondFriendRequest(n?.sender?._id || n.sender, action); // "Accepted" | "Rejected"
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, isRead: true } : x)));
      setMeta((m) => ({ ...m, unreadCount: Math.max(0, (m.unreadCount || 0) - 1) }));
      toast.success(action === 'Accepted' ? 'Friend request accepted' : 'Friend request rejected');
    } catch {
      toast.error('Action failed');
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  async function onConfirmMatch(n) {
    if (!n.sessionId) return navigate('/matches');
    setBusy((b) => ({ ...b, [n._id]: true }));
    try {
      await confirmSession(n.sessionId);
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setMeta((m) => ({ ...m, unreadCount: Math.max(0, (m.unreadCount || 0) - 1) }));
      toast.success('Match confirmed');
      navigate(`/matches/${n.sessionId}`);
    } catch {
      toast.error('Could not confirm match');
    } finally {
      setBusy((b) => ({ ...b, [n._id]: false }));
    }
  }

  async function onDeclineMatch(n) {
    if (!n.sessionId) return;
    setBusy((b) => ({ ...b, [n._id]: true }));
    try {
      await declineSession(n.sessionId);
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setMeta((m) => ({ ...m, unreadCount: Math.max(0, (m.unreadCount || 0) - 1) }));
      toast.info('You declined this match');
    } catch {
      toast.error('Could not decline match');
    } finally {
      setBusy((b) => ({ ...b, [n._id]: false }));
    }
  }

  async function onMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setMeta((m) => ({ ...m, unreadCount: 0 }));
      toast.success('All notifications marked read');
    } catch {
      toast.error('Could not mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  function setFilter(nextStatus) {
    params.set('status', nextStatus);
    params.set('page', '1');
    setParams(params, { replace: true });
  }

  function goPage(next) {
    params.set('page', String(next));
    setParams(params, { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button
          onClick={onMarkAllRead}
          className="btn btn-primary disabled:opacity-60"
          disabled={markingAll || (meta.unreadCount ?? 0) === 0}
          aria-disabled={markingAll || (meta.unreadCount ?? 0) === 0}
        >
          {markingAll ? 'Marking…' : 'Mark all read'}
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setFilter('unread')}
          className={classNames(
            'btn',
            status === 'unread' ? 'btn-primary' : 'bg-white border border-[var(--color-border-muted)]'
          )}
          aria-pressed={status === 'unread'}
        >
          Unread {meta.unreadCount > 0 ? `(${meta.unreadCount})` : ''}
        </button>
        <button
          onClick={() => setFilter('all')}
          className={classNames(
            'btn',
            status === 'all' ? 'btn-primary' : 'bg-white border border-[var(--color-border-muted)]'
          )}
          aria-pressed={status === 'all'}
        >
          All
        </button>
      </div>

      <div className="card divide-y">
        {loading ? (
          <div className="p-6 text-sm text-[var(--color-secondary)]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-[var(--color-secondary)]">No notifications.</div>
        ) : (
          items.map((n) => {
            const icon = TYPE_ICON[n?.type] || TYPE_ICON.DEFAULT;
            const link = resolveLink(n);
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
                key={n._id}
                className={classNames('p-4 flex items-start gap-3', n.isRead ? 'opacity-70' : '')}
              >
                <div className="text-xl leading-none">{icon}</div>
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
                          disabled={!!busy[n._id]}
                          className="btn btn-primary"
                        >
                          {busy[n._id] ? 'Accepting…' : 'Accept'}
                        </button>
                        <button
                          onClick={() => onFriendRespond(n, 'Rejected')}
                          disabled={!!busy[n._id]}
                          className="btn bg-white border border-[var(--color-warning)] text-[var(--color-warning)] hover:bg-[color-mix(in_oklab,var(--color-warning)_10%,white)]"
                        >
                          {busy[n._id] ? 'Rejecting…' : 'Reject'}
                        </button>
                      </>
                    )}

                    {(n.type === 'MATCH_INVITE' || n.type === 'MATCH_UPDATED' || n.type === 'MATCH_REMINDER') &&
                      n.sessionId && (
                        <>
                          <button
                            onClick={() => onConfirmMatch(n)}
                            disabled={!!busy[n._id]}
                            className="btn btn-primary"
                          >
                            {busy[n._id] ? 'Confirming…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => onDeclineMatch(n)}
                            disabled={!!busy[n._id]}
                            className="btn bg-white border border-[var(--color-warning)] text-[var(--color-warning)] hover:bg-[color-mix(in_oklab,var(--color-warning)_10%,white)]"
                          >
                            {busy[n._id] ? 'Declining…' : 'Decline'}
                          </button>
                        </>
                      )}

                    {isLink && (
                      <button
                        onClick={() => navigate(link)}
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
          })
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <button
          className="btn bg-white border border-[var(--color-border-muted)] disabled:opacity-50"
          onClick={() => goPage(Math.max(1, page - 1))}
          disabled={!hasPrev}
        >
          Prev
        </button>
        <div className="text-sm text-[var(--color-secondary)]">
          Page {meta.page} · {meta.total} total
        </div>
        <button
          className="btn bg-white border border-[var(--color-border-muted)] disabled:opacity-50"
          onClick={() => goPage(page + 1)}
          disabled={!hasNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
