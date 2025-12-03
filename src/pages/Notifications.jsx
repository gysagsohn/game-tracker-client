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
      toast.error('Failed to mark all as read');
    }
  }

  async function handleFriendResponse(notificationId, senderId, action) {
    if (processingIds.has(notificationId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(notificationId));
      
      await axios.post('/friends/respond', {
        senderId: senderId,
        action: action // 'Accepted' or 'Rejected'
      });

      // Mark as read after successful action
      await markAsRead(notificationId);

      toast.success(
        action === 'Accepted' 
          ? 'Friend request accepted!' 
          : 'Friend request rejected'
      );

      // Refresh notifications to update UI
      await fetchNotifications();
    } catch (error) {
      toast.error(error.message || `Failed to ${action.toLowerCase()} friend request`);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  }

  async function handleMatchResponse(notificationId, sessionId, action) {
    if (processingIds.has(notificationId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(notificationId));
      
      if (action === 'confirm') {
        await axios.post(`/sessions/${sessionId}/confirm`);
        toast.success('Match confirmed!');
      } else if (action === 'decline') {
        await axios.post(`/sessions/${sessionId}/decline`);
        toast.success('Match declined');
      }

      // Mark notification as read
      await markAsRead(notificationId);

      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      toast.error(error.message || `Failed to ${action} match`);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  }

  async function handleNotificationClick(notification) {
    // Mark as read when clicked
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case NOTIFICATION_TYPES.FRIEND_REQUEST:
        // Don't navigate - let user use inline buttons
        break;
        
      case NOTIFICATION_TYPES.FRIEND_ACCEPT:
        navigate('/friends');
        break;
        
      case NOTIFICATION_TYPES.MATCH_INVITE:
      case NOTIFICATION_TYPES.MATCH_UPDATED:
      case NOTIFICATION_TYPES.MATCH_REMINDER:
        // 🔴 BUG FIX #1: Changed from notification.session to notification.sessionId
        if (notification.sessionId) {
          navigate(`/matches/${notification.sessionId}`);
        } else {
          navigate('/matches');
        }
        break;
        
      case NOTIFICATION_TYPES.MATCH_CONFIRMED:
      case NOTIFICATION_TYPES.MATCH_DECLINED:
        // 🔴 BUG FIX #1: Changed from notification.session to notification.sessionId
        if (notification.sessionId) {
          navigate(`/matches/${notification.sessionId}`);
        } else {
          navigate('/matches');
        }
        break;
        
      default:
        // For unknown types, don't navigate
        break;
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
            const isMatchInvite = [
              NOTIFICATION_TYPES.MATCH_INVITE,
              NOTIFICATION_TYPES.MATCH_UPDATED,
              NOTIFICATION_TYPES.MATCH_REMINDER
            ].includes(notification.type);
            
            // Determine if notification should be clickable
            const isClickable = !isFriendRequest && !isMatchInvite;
            
            return (
              <Card
                key={notification._id}
                className={`p-4 transition-shadow ${
                  isClickable ? 'cursor-pointer hover:shadow-md' : ''
                } ${notification.read ? 'opacity-70' : 'bg-blue-50'}`}
                onClick={() => isClickable && handleNotificationClick(notification)}
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
                  {isFriendRequest && notification.sender && !notification.read && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFriendResponse(
                            notification._id,
                            notification.sender._id,
                            'Accepted'
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
                            'Rejected'
                          );
                        }}
                        disabled={isProcessing}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Match Invite Actions */}
                  {/* 🔴 BUG FIX #1: Changed from notification.session to notification.sessionId */}
                  {isMatchInvite && notification.sessionId && !notification.read && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMatchResponse(
                            notification._id,
                            notification.sessionId,
                            'confirm'
                          );
                        }}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Confirming...' : 'Confirm'}
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMatchResponse(
                            notification._id,
                            notification.sessionId,
                            'decline'
                          );
                        }}
                        disabled={isProcessing}
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {/* "View" button for notifications with actions but already read */}
                  {(isFriendRequest || isMatchInvite) && notification.read && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFriendRequest) {
                          navigate('/friends?tab=requests');
                        } else if (notification.sessionId) {
                          navigate(`/matches/${notification.sessionId}`);
                        }
                      }}
                    >
                      View
                    </Button>
                  )}

                  {/* Read indicator for clickable notifications */}
                  {!notification.read && isClickable && (
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
