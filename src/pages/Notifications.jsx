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
import NotificationItem from '../components/notifications/NotificationItem.jsx';

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
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

  const onMarkRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setMeta((m) => ({ ...m, unreadCount: Math.max(0, (m.unreadCount || 0) - 1) }));
      toast.success('Marked as read');
    } catch {
      toast.error('Could not mark as read');
    }
  }, [toast]);

  const onFriendRespond = useCallback(async (n, action) => {
    const id = n._id;
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await respondFriendRequest(n?.sender?._id || n.sender, action);
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, isRead: true } : x)));
      setMeta((m) => ({ ...m, unreadCount: Math.max(0, (m.unreadCount || 0) - 1) }));
      toast.success(action === 'Accepted' ? 'Friend request accepted' : 'Friend request rejected');
    } catch {
      toast.error('Action failed');
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }, [toast]);

  const onConfirmMatch = useCallback(async (n) => {
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
  }, [toast, navigate]);

  const onDeclineMatch = useCallback(async (n) => {
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
  }, [toast]);

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

  const handleNavigate = useCallback((link) => {
    navigate(link);
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="max-w-3xl mx-auto mb-6 lg:mb-10 px-1
                      flex flex-col items-center
                      md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
        <h1 className="h1 text-center md:col-span-3">Notifications</h1>

        <div className="mt-2 md:mt-0 md:ml-4 md:col-start-3 md:justify-self-end">
          <button
            onClick={onMarkAllRead}
            className="btn btn-primary md:btn disabled:opacity-60"
            disabled={markingAll || (meta.unreadCount ?? 0) === 0}
            aria-disabled={markingAll || (meta.unreadCount ?? 0) === 0}
          >
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        </div>
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
          items.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              isBusy={!!busy[n._id]}
              onFriendRespond={onFriendRespond}
              onConfirmMatch={onConfirmMatch}
              onDeclineMatch={onDeclineMatch}
              onMarkRead={onMarkRead}
              onNavigate={handleNavigate}
            />
          ))
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