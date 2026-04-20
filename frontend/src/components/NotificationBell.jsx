import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LuBell, LuBellRing, LuCircleAlert, LuCircleCheckBig, LuCircleX, LuTriangleAlert } from 'react-icons/lu';
import { getAllNotifications, markAllAsRead, markAsRead } from '../api/notificationApi';
import { signalAppDataChanged, subscribeToAppDataChanges } from '../utils/dataSync';
import { getNotificationTarget } from '../utils/notificationRouting';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllNotifications();

      if (response.success) {
        setNotifications(Array.isArray(response.notifications) ? response.notifications : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications, location.pathname]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    const unsubscribe = subscribeToAppDataChanges(fetchNotifications);

    window.addEventListener('focus', fetchNotifications);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', fetchNotifications);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        const response = await markAsRead(notification._id);
        if (!response.success) {
          return;
        }
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? { ...item, isRead: true, readAt: new Date().toISOString() }
              : item
          )
        );
        signalAppDataChanged('notifications');
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    setShowDropdown(false);
    navigate(getNotificationTarget(notification));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_approved':
        return LuCircleCheckBig;
      case 'booking_completed':
        return LuCircleCheckBig;
      case 'booking_rejected':
        return LuCircleX;
      case 'booking_cancelled':
        return LuCircleAlert;
      case 'no_show_warning':
        return LuTriangleAlert;
      case 'account_suspended':
        return LuCircleAlert;
      default:
        return LuBellRing;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_approved':
        return 'text-green-600';
      case 'booking_completed':
        return 'text-emerald-600';
      case 'booking_rejected':
        return 'text-red-600';
      case 'booking_cancelled':
        return 'text-yellow-600';
      case 'no_show_warning':
        return 'text-orange-600';
      case 'account_suspended':
        return 'text-red-700';
      default:
        return 'text-blue-600';
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const recentNotifications = useMemo(
    () =>
      [...notifications]
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        .slice(0, 3),
    [notifications]
  );

  useEffect(() => {
    if (!showDropdown) return;

    const hasUnreadNotifications = notifications.some((notification) => !notification.isRead);

    if (!hasUnreadNotifications) return;

    let cancelled = false;

    (async () => {
      const response = await markAllAsRead();
      if (cancelled || !response.success) return;

      setNotifications((current) =>
        current.map((item) =>
          !item.isRead
            ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() }
            : item
        )
      );
      signalAppDataChanged('notifications');
    })();

    return () => {
      cancelled = true;
    };
  }, [notifications, showDropdown]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <LuBell className="w-6 h-6" />

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />

          <div className="absolute right-0 z-20 w-80 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-500">{unreadCount} unread</span>
              )}
            </div>

            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);

                  return (
                    <button
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left border-b hover:bg-gray-50 transition ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`flex-shrink-0 w-5 h-5 mt-0.5 ${getNotificationColor(notification.type)}`} />

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                            {notification.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 mt-1 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <LuBell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/notifications');
                }}
                className="w-full p-3 text-sm font-medium text-center text-blue-600 border-t hover:bg-gray-50"
              >
                View All Notifications
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
