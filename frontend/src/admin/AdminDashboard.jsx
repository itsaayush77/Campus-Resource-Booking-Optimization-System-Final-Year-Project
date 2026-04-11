import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAnalyticsSummary } from '../api/analyticsApi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import {
  LuActivity as Activity,
  LuArrowRight as ArrowRight,
  LuBadgeAlert as AlertOctagon,
  LuBuilding2 as Building2,
  LuChartColumn as BarChart3,
  LuClock as Clock,
  LuCircleCheck as CheckCircle,
  LuCircleX as XCircle,
  LuFileText as FileText,
  LuLayoutDashboard as LayoutDashboard,
  LuRefreshCw as RefreshCw,
  LuTriangleAlert as AlertTriangle,
  LuTrendingUp as TrendingUp,
} from 'react-icons/lu';
import { subscribeToAppDataChanges } from '../utils/dataSync';

const formatCompactNumber = (value) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);

const RESOURCE_CATEGORY_ICONS = {
  classroom: '📚',
  lab: '🔬',
  seminar_hall: '🏛️',
  sports_facility: '⚽',
  equipment: '💻',
  auditorium: '🎭',
  library_room: '📖',
};

const getResourceDisplayName = (resource) => {
  const directName = resource?.resourceName || resource?.name;
  if (directName && String(directName).trim()) {
    return String(directName).trim();
  }

  const idValue = resource?.resourceId;
  const normalizedId =
    typeof idValue === 'string'
      ? idValue
      : idValue && typeof idValue === 'object' && '_id' in idValue
        ? String(idValue._id)
        : null;

  if (normalizedId) {
    return `Archived Resource (${normalizedId.slice(-6)})`;
  }

  return 'Archived Resource';
};

const getResourceCategoryIcon = (resource) => {
  const category = resource?.resourceCategory;
  if (category && RESOURCE_CATEGORY_ICONS[category]) {
    return RESOURCE_CATEGORY_ICONS[category];
  }

  const name = getResourceDisplayName(resource).toLowerCase();

  if (name.includes('lab')) return '🔬';
  if (name.includes('auditorium') || name.includes('stage')) return '🎭';
  if (name.includes('seminar') || name.includes('hall')) return '🏛️';
  if (name.includes('court') || name.includes('gym') || name.includes('stadium') || name.includes('sport')) return '⚽';
  if (name.includes('projector') || name.includes('equipment') || name.includes('device') || name.includes('computer')) return '💻';
  if (name.includes('library') || name.includes('study') || name.includes('book')) return '📖';
  if (name.includes('classroom') || name.includes('class') || name.includes('room')) return '📚';

  return '🏫';
};

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAnalytics = useCallback(async ({ showLoader = false, silent = false } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await getAnalyticsSummary();

      if (response.success) {
        setAnalytics(response.summary || response.data || null);
      } else {
        if (!silent) {
          toast.error(response.message || 'Failed to load analytics');
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (!silent) {
        toast.error('Error loading dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics({ showLoader: true });
  }, [fetchAnalytics, location.pathname]);

  useEffect(() => {
    const refreshSilently = () => {
      fetchAnalytics({ silent: true });
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
  }, [fetchAnalytics]);

  const stats = useMemo(() => analytics?.countsByStatus || {}, [analytics]);
  const totalBookings = analytics?.totalBookings || 0;
  const todayBookings = analytics?.todayBookings || 0;
  const weekBookings = analytics?.weekBookings || 0;
  const topResources = useMemo(() => analytics?.topResources || [], [analytics]);

  const primaryStatCards = [
    {
      title: 'Total Bookings',
      value: totalBookings,
      icon: LayoutDashboard,
      iconTone: 'bg-blue-100 text-blue-700',
      note: 'All booking records',
      clickable: false,
    },
    {
      title: 'Pending',
      value: stats.pending || 0,
      icon: Clock,
      iconTone: 'bg-amber-100 text-amber-700',
      note: 'Needs approval',
      clickable: true,
      onClick: () => navigate('/admin/approvals'),
    },
    {
      title: 'No-Shows',
      value: stats.no_show || 0,
      icon: AlertTriangle,
      iconTone: 'bg-orange-100 text-orange-700',
      note: 'Attendance risk',
      clickable: true,
      onClick: () => navigate('/admin/no-shows'),
    },
    {
      title: 'Completed',
      value: stats.completed || 0,
      icon: Activity,
      iconTone: 'bg-emerald-100 text-emerald-700',
      note: 'Successfully used',
      clickable: false,
    },
  ];

  const secondaryStats = [
    { label: 'Approved', value: stats.approved || 0, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    { label: 'Rejected', value: stats.rejected || 0, tone: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
    { label: 'Cancelled', value: stats.cancelled || 0, tone: 'bg-slate-50 text-slate-700 border-slate-200', icon: AlertOctagon },
  ];

  const pieData = useMemo(
    () =>
      [
        { name: 'Approved', value: stats.approved || 0, color: '#10b981' },
        { name: 'Pending', value: stats.pending || 0, color: '#f59e0b' },
        { name: 'Completed', value: stats.completed || 0, color: '#06b6d4' },
        { name: 'Rejected', value: stats.rejected || 0, color: '#ef4444' },
        { name: 'No-Shows', value: stats.no_show || 0, color: '#f97316' },
        { name: 'Cancelled', value: stats.cancelled || 0, color: '#6b7280' },
      ].filter((item) => item.value > 0),
    [stats]
  );

  const barData = useMemo(
    () =>
      topResources.slice(0, 8).map((resource) => {
        const displayName = getResourceDisplayName(resource);
        return {
          name: displayName.length > 22 ? `${displayName.substring(0, 22)}...` : displayName,
          fullName: displayName,
          bookings: resource.count || 0,
        };
      }),
    [topResources]
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 bg-white border rounded-xl border-slate-200 shadow-soft">
          <p className="text-sm font-semibold text-slate-900">{payload[0].payload.fullName}</p>
          <p className="mt-1 text-xs font-medium text-blue-600">{formatCompactNumber(payload[0].value)} bookings</p>
        </div>
      );
    }

    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <div className="px-3 py-2 bg-white border rounded-xl border-slate-200 shadow-soft">
        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
        <p className="mt-1 text-xs font-medium text-slate-600">{item.value} bookings</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="app-shell-bg">
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8 animate-pulse">
          <div className="h-10 w-72 rounded-xl bg-slate-200" />
          <div className="h-5 mt-3 rounded-lg w-52 bg-slate-200" />
          <div className="grid grid-cols-1 gap-6 mt-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white border h-36 rounded-2xl border-slate-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-2">
            <div className="bg-white border h-80 rounded-2xl border-slate-200" />
            <div className="bg-white border h-80 rounded-2xl border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-bg">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="dashboard-title">
                Admin Dashboard
              </h1>
              <p className="muted-subtitle">System overview and analytics</p>
            </div>
            <button
              type="button"
              onClick={() => fetchAnalytics()}
              disabled={refreshing}
              className="modern-button-primary"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-5 sm:grid-cols-2 lg:grid-cols-4">
          {primaryStatCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                onClick={stat.clickable ? stat.onClick : undefined}
                className={`kpi-card ${
                  stat.clickable ? 'cursor-pointer hover:scale-[1.02]' : ''
                }`}
              >
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
                        {stat.title}
                      </p>
                      <p className="text-4xl font-black text-slate-900">{formatCompactNumber(stat.value)}</p>
                      <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
                    </div>
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stat.iconTone}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {stat.clickable && (
                    <div className="flex items-center mt-4 text-sm font-medium text-blue-600">
                      <span>View details</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-3">
          {secondaryStats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`rounded-xl border px-4 py-3 flex items-center justify-between ${item.tone}`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold tracking-wide uppercase">{item.label}</span>
                </div>
                <span className="text-lg font-black">{formatCompactNumber(item.value)}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Today</p>
            <p className="mt-1 text-2xl font-black text-blue-900">{formatCompactNumber(todayBookings)}</p>
            <p className="text-xs text-blue-700">Bookings started today</p>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">This Week</p>
            <p className="mt-1 text-2xl font-black text-indigo-900">{formatCompactNumber(weekBookings)}</p>
            <p className="text-xs text-indigo-700">Bookings started since Monday</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
          <div className="chart-card">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Booking Status Distribution</h3>
            </div>
            {pieData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={100}
                      paddingAngle={2}
                      stroke="transparent"
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">Total</p>
                  <p className="text-2xl font-black text-slate-900">{formatCompactNumber(totalBookings)}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p>No data available</p>
                </div>
              </div>
            )}
          </div>

          <div className="chart-card">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Most Booked Resources</h3>
            </div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCompactNumber(value)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bookings" fill="url(#adminBookingGradient)" radius={[0, 8, 8, 0]} barSize={18} />
                  <defs>
                    <linearGradient id="adminBookingGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <p>No booking data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 section-card">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800">Top Resources by Bookings</h3>
          </div>
          {topResources.length > 0 ? (
            <div className="space-y-3">
              {topResources.slice(0, 10).map((resource, index) => {
                const maxCount = topResources[0]?.count || 1;
                const percentage = ((resource.count || 0) / maxCount) * 100;

                return (
                  <div
                    key={`${resource.resourceId || resource.resourceName || 'resource'}-${index}`}
                    className="list-row"
                  >
                    <div className="flex items-center flex-1 gap-4">
                        <div className="relative flex items-center justify-center text-xl border w-11 h-11 rounded-xl border-slate-200 bg-slate-100">
                          <span role="img" aria-label="resource category icon">{getResourceCategoryIcon(resource)}</span>
                          <span className="absolute -top-2 -right-2 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none px-1.5 py-1">
                            #{index + 1}
                          </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {getResourceDisplayName(resource)}
                        </p>
                        <p className="text-sm text-gray-500">{resource.count || 0} bookings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="w-32 h-2 overflow-hidden bg-gray-200 rounded-full">
                        <div
                          className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="w-8 font-bold text-right text-blue-600">{resource.count || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <Building2 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p>No resource data available yet</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              title: 'Pending Approvals',
              count: stats.pending || 0,
              icon: FileText,
              path: '/admin/approvals',
              color: 'from-orange-500 to-red-500',
              bgColor: 'from-orange-50 to-red-50',
            },
            {
              title: 'Manage Resources',
              icon: Building2,
              path: '/admin/resources',
              color: 'from-blue-500 to-cyan-500',
              bgColor: 'from-blue-50 to-cyan-50',
            },
            {
              title: 'View Analytics',
              icon: BarChart3,
              path: '/admin/analytics',
              color: 'from-purple-500 to-pink-500',
              bgColor: 'from-purple-50 to-pink-50',
            },
            {
              title: 'No-Show Reports',
              count: stats.no_show || 0,
              icon: AlertOctagon,
              path: '/admin/no-shows',
              color: 'from-yellow-500 to-orange-500',
              bgColor: 'from-yellow-50 to-orange-50',
            },
            {
              title: 'Manage Users',
              icon: Activity,
              path: '/admin/users',
              color: 'from-indigo-500 to-blue-500',
              bgColor: 'from-indigo-50 to-blue-50',
            },
          ].map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="p-4 text-left transition-all duration-200 bg-white border shadow-sm group rounded-2xl border-slate-200 hover:border-blue-200 hover:shadow-md"
              >
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-11 h-11 mb-3 rounded-xl bg-gradient-to-br ${action.color} shadow-sm`}>
                    <Icon className="text-white w-7 h-7" />
                  </div>
                  <h4 className="mb-1 text-base font-bold text-gray-800">{action.title}</h4>
                  {action.count !== undefined && (
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {action.count}
                    </p>
                  )}
                  <div className="flex items-center mt-3 text-sm font-medium text-blue-600">
                    <span>Open</span>
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
