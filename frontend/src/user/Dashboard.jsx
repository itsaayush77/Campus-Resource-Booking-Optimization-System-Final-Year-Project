import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getBookingHistory, getMyBookings } from '../api/bookingApi';
import { getAllNotifications } from '../api/notificationApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LuArrowRight as ArrowRight,
  LuBell as Bell,
  LuBookOpen as BookOpen,
  LuCalendar as Calendar,
  LuClipboardList as ClipboardList,
  LuClock as Clock,
  LuCircleCheck as CheckCircle,
  LuRefreshCw as RefreshCw,
  LuTrendingUp as TrendingUp,
  LuUser as User,
} from 'react-icons/lu';
import { subscribeToAppDataChanges } from '../utils/dataSync';

const mergeBookings = (...groups) => {
  const byId = new Map();

  groups.flat().forEach((booking) => {
    if (booking?._id) {
      byId.set(booking._id, booking);
    }
  });

  return [...byId.values()];
};

const isOverduePendingBooking = (booking) =>
  booking?.status === 'pending' && new Date(booking.endTime).getTime() < Date.now();

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchData = useCallback(async ({ showLoader = false, silent = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [activeBookingsRes, bookingHistoryRes, notificationsRes] = await Promise.all([
        getMyBookings(),
        getBookingHistory(),
        getAllNotifications(),
      ]);

      const nextBookings = mergeBookings(
        activeBookingsRes.success && Array.isArray(activeBookingsRes.bookings)
          ? activeBookingsRes.bookings
          : [],
        bookingHistoryRes.success && Array.isArray(bookingHistoryRes.bookings)
          ? bookingHistoryRes.bookings
          : []
      );

      if (activeBookingsRes.success || bookingHistoryRes.success) {
        setBookings(
          nextBookings.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        );
      } else {
        setBookings([]);
        if (!silent) {
          toast.error(activeBookingsRes.message || bookingHistoryRes.message || 'Failed to load bookings');
        }
      }

      if (notificationsRes.success) {
        setNotifications(
          Array.isArray(notificationsRes.notifications) ? notificationsRes.notifications : []
        );
      } else {
        setNotifications([]);
        if (!silent) {
          toast.error(notificationsRes.message || 'Failed to load notifications');
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!silent) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData({ showLoader: true });
  }, [fetchData, location.pathname]);

  useEffect(() => {
    const refreshSilently = () => {
      fetchData({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSilently();
      }
    };

    const interval = window.setInterval(refreshSilently, 30000);
    const unsubscribe = subscribeToAppDataChanges(refreshSilently);

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  const now = new Date();
  const upcomingBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          ['pending', 'approved'].includes(booking.status) && new Date(booking.startTime) > now
      ),
    [bookings, now]
  );
  const completedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'completed'),
    [bookings]
  );
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending'),
    [bookings]
  );
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications]
  );
  const overduePendingBookings = useMemo(
    () => bookings.filter(isOverduePendingBooking),
    [bookings]
  );

  const stats = [
    {
      title: 'Upcoming Bookings',
      value: upcomingBookings.length,
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-100',
      action: () => navigate('/my-bookings'),
    },
    {
      title: 'Pending Approval',
      value: pendingBookings.length,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-100',
      action: () => navigate('/my-bookings'),
    },
    {
      title: 'Completed',
      value: completedBookings.length,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-100',
      action: () => navigate('/booking-history'),
    },
    {
      title: 'Notifications',
      value: unreadNotifications.length,
      icon: Bell,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-100',
      action: () => navigate('/notifications'),
    },
  ];

  const chartData = useMemo(() => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();

      const count = bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
      }).length;

      months.push({ month: monthNames[month], bookings: count });
    }

    return months;
  }, [bookings]);

  const recentActivity = useMemo(() => bookings.slice(0, 5), [bookings]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      no_show: 'bg-orange-100 text-orange-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-semibold text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-2 text-lg text-gray-600">Here&apos;s what&apos;s happening with your bookings</p>
          </div>
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.title}
                onClick={stat.action}
                className="relative p-6 overflow-hidden text-left transition-all duration-300 bg-white shadow-lg group rounded-2xl hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} rounded-full blur-3xl opacity-30 -mr-16 -mt-16`}></div>

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="mb-2 text-sm font-medium tracking-wider text-gray-500 uppercase">
                      {stat.title}
                    </p>
                    <p className="text-4xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                <div className="flex items-center mt-4 text-sm font-medium text-blue-600">
                  <span>View details</span>
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>

        {overduePendingBookings.length > 0 && (
          <div className="p-5 mb-8 border shadow-sm bg-amber-50 border-amber-200 rounded-2xl">
            <p className="text-lg font-bold text-amber-900">Pending request missed its booking window</p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              You have {overduePendingBookings.length} booking
              {overduePendingBookings.length > 1 ? 's' : ''} whose scheduled time passed while still pending.
              No-show applies only to approved bookings, so these remain pending until an admin reviews them.
            </p>
            <Link
              to="/my-bookings"
              className="inline-flex items-center gap-2 mt-4 font-semibold text-amber-900 hover:text-amber-950"
            >
              Review in My Bookings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="p-6 bg-white shadow-xl rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">Your Booking Activity</h3>
              </div>
              {bookings.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="url(#userBookingGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="userBookingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.85} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <p>No booking history yet</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-800">Recent Bookings</h3>
                </div>
                <Link to="/my-bookings" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((booking) => (
                    <div
                      key={booking._id}
                      className="flex items-center justify-between p-4 transition-all duration-200 bg-gray-50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {booking.resourceId?.name || 'Unknown Resource'}
                        </p>
                        <p className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(booking.startTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <Calendar className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p>No bookings yet</p>
                  <Link to="/resources" className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Browse resources
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white shadow-xl rounded-2xl">
              <h3 className="mb-6 text-xl font-bold text-gray-800">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/resources"
                  className="flex items-center gap-4 p-4 transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:from-blue-600 hover:to-purple-700 group"
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-white rounded-lg shadow-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-white">
                    <p className="font-semibold">Browse Resources</p>
                    <p className="text-sm opacity-90">Find and book available resources</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/my-bookings"
                  className="flex items-center gap-4 p-4 transition-all duration-200 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 group"
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg shadow-lg bg-gradient-to-br from-green-400 to-emerald-600">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">My Bookings</p>
                    <p className="text-sm text-gray-500">View all your bookings</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/notifications"
                  className="flex items-center gap-4 p-4 transition-all duration-200 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 group"
                >
                  <div className="relative flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg shadow-lg bg-gradient-to-br from-purple-400 to-pink-600">
                    <Bell className="w-6 h-6 text-white" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full -top-1 -right-1">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Notifications</p>
                    <p className="text-sm text-gray-500">
                      {unreadNotifications.length > 0 ? `${unreadNotifications.length} unread` : 'All caught up'}
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-4 p-4 transition-all duration-200 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 group"
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg shadow-lg bg-gradient-to-br from-blue-400 to-cyan-600">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Profile Settings</p>
                    <p className="text-sm text-gray-500">Manage your account</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="p-6 shadow-xl bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full">
                    <span className="text-2xl font-bold text-blue-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-sm capitalize opacity-90">{user?.role}</p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-white/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm opacity-90">Total Bookings</span>
                    <span className="font-bold">{bookings.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Completion Rate</span>
                    <span className="font-bold">
                      {bookings.length > 0
                        ? `${Math.round((completedBookings.length / bookings.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
