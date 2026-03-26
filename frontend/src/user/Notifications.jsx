import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LuBell, LuBellRing, LuCheckCheck, LuCircleAlert, LuCircleCheckBig, LuCircleX, LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';
import { getAllNotifications, markAsRead, markAllAsRead } from '../api/notificationApi';
import toast from 'react-hot-toast';
import { subscribeToAppDataChanges } from '../utils/dataSync';
import { getNotificationTarget } from '../utils/notificationRouting';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = useCallback(async ({ showLoader = false, silent = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await getAllNotifications();

      if (response.success) {
        setNotifications(Array.isArray(response.notifications) ? response.notifications : []);
      } else {
        if (!silent) {
          toast.error(response.message || 'Failed to load notifications');
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (!silent) {
        toast.error('Error loading notifications');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications({ showLoader: true });

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchNotifications, location.pathname]);

  useEffect(() => {
    const refreshSilently = () => {
      fetchNotifications({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSilently();
      }
    };

    const unsubscribe = subscribeToAppDataChanges(refreshSilently);

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await markAsRead(notificationId);

      if (response.success) {
        setNotifications((current) =>
          current.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
      } else {
        toast.error(response.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllAsRead();

      if (response.success) {
        toast.success('All notifications marked as read');
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.readAt || new Date().toISOString(),
          }))
        );
      } else {
        toast.error(response.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error updating notifications');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    navigate(getNotificationTarget(notification));
  };

  const getNotificationDisplay = (type) => {
    const displays = {
      booking_approved: {
        icon: LuCircleCheckBig,
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      booking_completed: {
        icon: LuCircleCheckBig,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      booking_rejected: {
        icon: LuCircleX,
        color: 'text-red-600',
        bg: 'bg-red-50',
      },
      booking_cancelled: {
        icon: LuCircleAlert,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
      },
      no_show_warning: {
        icon: LuTriangleAlert,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
      },
      account_suspended: {
        icon: LuCircleAlert,
        color: 'text-red-700',
        bg: 'bg-red-50',
      },
      system: {
        icon: LuBellRing,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
    };

    return displays[type] || displays.system;
  };

  const formatDate = (date) => {
    const current = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - current);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return current.toLocaleDateString();
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (filter === 'unread') return !notification.isRead;
        if (filter === 'read') return notification.isRead;
        return true;
      }),
    [filter, notifications]
  );

  const groupedNotifications = useMemo(
    () =>
      filteredNotifications.reduce((groups, notification) => {
        const date = formatDate(notification.createdAt);
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(notification);
        return groups;
      }, {}),
    [filteredNotifications]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-1 text-gray-600">Stay updated on your bookings</p>
          </div>
          <button
            type="button"
            onClick={() => fetchNotifications()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LuRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="p-4 mb-6 bg-white rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'read'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 transition rounded-lg hover:bg-blue-50"
              >
                <LuCheckCheck className="w-4 h-4" />
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-lg shadow-sm">
            <LuBell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? "You've read all your notifications"
                : "We'll notify you about booking updates"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, notifs]) => (
              <div key={date}>
                <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                  {date}
                </h2>

                <div className="bg-white divide-y rounded-lg shadow-sm">
                  {notifs.map((notification) => {
                    const iconData = getNotificationDisplay(notification.type);
                    const Icon = iconData.icon;

                    return (
                      <button
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition flex items-start gap-4 ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${iconData.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${iconData.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className={`text-sm ${!notification.isRead ? 'font-bold' : 'font-semibold'} text-gray-900`}>
                              {notification.title}
                            </h3>
                            <span className="flex-shrink-0 text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="mb-2 text-sm text-gray-700">{notification.message}</p>
                          {notification.relatedBooking && (
                            <span className="text-xs text-blue-600 hover:underline">
                              View booking &rarr;
                            </span>
                          )}
                        </div>

                        {!notification.isRead && (
                          <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
