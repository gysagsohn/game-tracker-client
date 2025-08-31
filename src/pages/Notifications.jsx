// src/pages/Notifications.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../contexts/useToast';
import {
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '../lib/api/notifications';

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

const TYPE_ICON = {
  FRIEND_REQUEST: '👋',
  FRIEND_ACCEPTED: '✅',
  MATCH_INVITE: '🎮',
  MATCH_REMINDER: '⏰',
  MATCH_UPDATED: '✏️',
  MATCH_CONFIRMED: '🏁',
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

// Tries to map a notification to an in-app route.
// Falls back to provided `link` if present, else no-op (#).
function resolveLink(n) {
  if (n?.link) return n.link;
  switch (n?.type) {
    case 'FRIEND_REQUEST':
      return '/friends/requests';
    case 'FRIEND_ACCEPTED':
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
            return (
              <div
                key={n._id}
                className={classNames('p-4 flex items-start gap-3', n.isRead ? 'opacity-70' : '')}
              >
                <div className="text-xl leading-none">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-primary)] truncate">
                      {n.title || n.message || n.type || 'Notification'}
                    </p>
                    <span className="text-xs text-[var(--color-secondary)]">
                      {n.createdAt ? timeAgo(n.createdAt) : ''}
                    </span>
                  </div>
                  {n.description ? (
                    <p className="mt-1 text-sm text-[var(--color-secondary)]">{n.description}</p>
                  ) : null}
                  <div className="mt-2 flex gap-2">
                    {isLink && (
                      <button onClick={() => navigate(link)} className="btn btn-primary">
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
