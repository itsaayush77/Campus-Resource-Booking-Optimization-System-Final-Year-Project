import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getBookingHistory, getMyBookings } from '../api/bookingApi';
import { getAllNotifications } from '../api/notificationApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import SuspensionBanner from '../components/SuspensionBanner';
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

const formatCompactNumber = (value) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const BookingChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{formatCompactNumber(payload[0].value)} bookings</p>
    </div>
  );
};

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
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  const roleAvatar = isAdmin ? '/images/admin.png' : '/images/user.png';
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
      iconTone: 'bg-blue-100 text-blue-700',
      note: upcomingBookings.length > 0 ? 'Scheduled ahead' : 'No upcoming slots',
      action: () => navigate('/my-bookings'),
    },
    {
      title: 'Pending Approval',
      value: pendingBookings.length,
      icon: Clock,
      iconTone: 'bg-amber-100 text-amber-700',
      note: pendingBookings.length > 0 ? 'Awaiting admin review' : 'Nothing waiting',
      action: () => navigate('/my-bookings'),
    },
    {
      title: 'Completed',
      value: completedBookings.length,
      icon: CheckCircle,
      iconTone: 'bg-emerald-100 text-emerald-700',
      note: bookings.length > 0 ? `${Math.round((completedBookings.length / bookings.length) * 100)}% completion rate` : 'No history yet',
      action: () => navigate('/booking-history'),
    },
    {
      title: 'Notifications',
      value: unreadNotifications.length,
      icon: Bell,
      iconTone: 'bg-indigo-100 text-indigo-700',
      note: unreadNotifications.length > 0 ? 'Needs your attention' : 'All caught up',
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

  const lastSixMonthTotal = useMemo(
    () => chartData.reduce((sum, month) => sum + month.bookings, 0),
    [chartData]
  );
  const currentMonthBookings = chartData[chartData.length - 1]?.bookings || 0;

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
      <div className="app-shell-bg">
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8 animate-pulse">
          <div className="h-10 w-80 rounded-xl bg-slate-200" />
          <div className="mt-3 h-5 w-64 rounded-lg bg-slate-200" />
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-36 rounded-2xl bg-white border border-slate-200" />
            ))}
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="h-[420px] rounded-2xl bg-white border border-slate-200 lg:col-span-2" />
            <div className="h-[420px] rounded-2xl bg-white border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-bg">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="animate-fadeIn flex flex-col gap-4 mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="dashboard-title">
              Welcome back, {user?.name}!
            </h1>
            <p className="muted-subtitle">Here&apos;s what&apos;s happening with your bookings</p>
          </div>
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={refreshing}
            className="modern-button-primary"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <SuspensionBanner user={user} className="mb-8" />

        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.title}
                onClick={stat.action}
                className="kpi-card group text-left"
              >
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
                      {stat.title}
                    </p>
                    <p className="text-4xl font-black text-slate-900">{formatCompactNumber(stat.value)}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
                  </div>
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stat.iconTone}`}>
                    <Icon className="w-6 h-6" />
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
            <div className="chart-card">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-800">Your Booking Activity</h3>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-semibold">
                    This month: {formatCompactNumber(currentMonthBookings)}
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                    6 months: {formatCompactNumber(lastSixMonthTotal)}
                  </div>
                </div>
              </div>
              {bookings.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => formatCompactNumber(value)}
                    />
                    <Tooltip content={<BookingChartTooltip />} cursor={{ fill: '#eff6ff' }} />
                    <Bar dataKey="bookings" fill="url(#userBookingGradient)" radius={[8, 8, 0, 0]} barSize={28} />
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

            <div className="section-card">
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
                      className="list-row"
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
            <div className="section-card">
              <h3 className="mb-6 text-xl font-bold text-gray-800">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    title: 'Browse Resources',
                    subtitle: 'Find and book spaces',
                    to: '/resources',
                    icon: BookOpen,
                    iconTone: 'bg-blue-100 text-blue-700',
                  },
                  {
                    title: 'My Bookings',
                    subtitle: 'View active & history',
                    to: '/my-bookings',
                    icon: ClipboardList,
                    iconTone: 'bg-emerald-100 text-emerald-700',
                  },
                  {
                    title: 'Notifications',
                    subtitle: unreadNotifications.length > 0 ? `${unreadNotifications.length} unread` : 'All caught up',
                    to: '/notifications',
                    icon: Bell,
                    iconTone: 'bg-indigo-100 text-indigo-700',
                  },
                  {
                    title: 'Profile Settings',
                    subtitle: 'Manage your account',
                    to: '/profile',
                    icon: User,
                    iconTone: 'bg-cyan-100 text-cyan-700',
                  },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      to={action.to}
                      className="group rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{action.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{action.subtitle}</p>
                        </div>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.iconTone}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                        Open
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="surface-card-strong p-6 bg-gradient-to-br from-blue-600 to-indigo-600">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={roleAvatar}
                    alt={`${isAdmin ? 'Admin' : 'User'} avatar`}
                    className="object-cover w-12 h-12 bg-white border border-white rounded-full"
                  />
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
