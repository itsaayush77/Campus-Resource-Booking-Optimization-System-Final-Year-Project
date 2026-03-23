import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllNotifications, markAsRead, markAllAsRead } from '../api/notificationApi';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getAllNotifications();
      
      if (response.success) {
        setNotifications(response.data || []);
      } else {
        toast.error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await markAsRead(notificationId);
      
      if (response.success) {
        // Update local state optimistically
        setNotifications(notifications.map(n => 
          n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
        ));
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
        fetchNotifications(); // Refresh
      } else {
        toast.error('Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error updating notifications');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate to related booking if exists
    if (notification.relatedBooking) {
      navigate('/my-bookings');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      booking_approved: { icon: '✓', color: 'text-green-500', bg: 'bg-green-50' },
      booking_rejected: { icon: '✗', color: 'text-red-500', bg: 'bg-red-50' },
      booking_cancelled: { icon: '⊗', color: 'text-yellow-500', bg: 'bg-yellow-50' },
      no_show_warning: { icon: '⚠', color: 'text-orange-500', bg: 'bg-orange-50' },
      account_suspended: { icon: '🚫', color: 'text-red-600', bg: 'bg-red-50' },
      system: { icon: 'ℹ', color: 'text-blue-500', bg: 'bg-blue-50' },
    };
    return icons[type] || icons.system;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = formatDate(notification.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {});

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-gray-600">Stay updated on your bookings</p>
        </div>

        {/* Actions Bar */}
        <div className="p-4 mb-6 bg-white rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Tabs */}
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

            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 transition rounded-lg hover:bg-blue-50"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-lg shadow-sm">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
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
            {Object.entries(groupedNotifications).map(([date, notifs]) => {
              // Only show if notifs match current filter
              const visibleNotifs = notifs.filter(n => {
                if (filter === 'unread') return !n.isRead;
                if (filter === 'read') return n.isRead;
                return true;
              });

              if (visibleNotifs.length === 0) return null;

              return (
                <div key={date}>
                  {/* Date Header */}
                  <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    {date}
                  </h2>

                  {/* Notifications for this date */}
                  <div className="bg-white divide-y rounded-lg shadow-sm">
                    {visibleNotifs.map((notification) => {
                      const iconData = getNotificationIcon(notification.type);
                      
                      return (
                        <button
                          key={notification._id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition flex items-start gap-4 ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-full ${iconData.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-xl ${iconData.color}`}>
                              {iconData.icon}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={`text-sm ${!notification.isRead ? 'font-bold' : 'font-semibold'} text-gray-900`}>
                                {notification.title}
                              </h3>
                              <span className="flex-shrink-0 text-xs text-gray-500">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="mb-2 text-sm text-gray-700">
                              {notification.message}
                            </p>
                            {notification.relatedBooking && (
                              <span className="text-xs text-blue-600 hover:underline">
                                View booking →
                              </span>
                            )}
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;