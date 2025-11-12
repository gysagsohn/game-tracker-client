import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { useToast } from '../contexts/useToast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import { NOTIFICATION_TYPES } from '../constants/notificationTypes';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processingIds, setProcessingIds] = useState(new Set());
  const toast = useToast();
  const navigate = useNavigate();

  // Use useCallback to memoize fetchNotifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/friends/notifications');
      setNotifications(res.data.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(notificationId) {
    if (processingIds.has(notificationId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(notificationId));
      await axios.put(`/friends/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch {
      // Catch block required but error not used
      toast.error('Failed to mark as read');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  }

  async function markAllAsRead() {
    try {
      await axios.post('/friends/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      // Catch block required but error not used
      toast.error('Failed to mark all as read');
    }
  }

  async function handleFriendResponse(notificationId, senderId, action) {
    if (processingIds.has(notificationId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(notificationId));
      
      await axios.post('/friends/respond', {
        requesterId: senderId,
        action: action // 'accept' or 'reject'
      });

      toast.success(
        action === 'accept' 
          ? 'Friend request accepted!' 
          : 'Friend request rejected'
      );

      // Refresh notifications to update UI
      await fetchNotifications();
    } catch (error) {
      toast.error(error.message || `Failed to ${action} friend request`);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  }

  async function handleNotificationClick(notification) {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === NOTIFICATION_TYPES.MATCH_INVITE && notification.session) {
      navigate(`/matches/${notification.session}`);
    } else if (notification.type === NOTIFICATION_TYPES.FRIEND_REQUEST) {
      // Stay on notifications page to accept/reject
      return;
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 mb-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="h1">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllAsRead}>
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <p className="text-secondary text-center py-8">
            {filter === 'unread' 
              ? 'No unread notifications'
              : 'No notifications yet'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const isProcessing = processingIds.has(notification._id);
            const isFriendRequest = notification.type === NOTIFICATION_TYPES.FRIEND_REQUEST;
            
            return (
              <Card
                key={notification._id}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  notification.read ? 'opacity-70' : 'bg-blue-50'
                }`}
                onClick={() => !isFriendRequest && handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="body-text break-words">
                      {notification.message}
                    </p>
                    <p className="text-small text-secondary mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Friend Request Actions */}
                  {isFriendRequest && notification.sender && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFriendResponse(
                            notification._id,
                            notification.sender._id,
                            'accept'
                          );
                        }}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Accept'}
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFriendResponse(
                            notification._id,
                            notification.sender._id,
                            'reject'
                          );
                        }}
                        disabled={isProcessing}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Read indicator */}
                  {!notification.read && !isFriendRequest && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default Notifications;