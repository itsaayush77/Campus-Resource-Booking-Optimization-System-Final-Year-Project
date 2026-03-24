import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAnalyticsSummary } from '../api/analyticsApi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import {
  LuActivity as Activity,
  LuArrowRight as ArrowRight,
  LuBan as Ban,
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

  const stats = analytics?.countsByStatus || {};
  const totalBookings = analytics?.totalBookings || 0;
  const topResources = analytics?.topResources || [];

  const statCards = [
    {
      title: 'Total Bookings',
      value: totalBookings,
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600',
      clickable: false,
    },
    {
      title: 'Pending',
      value: stats.pending || 0,
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-100',
      textColor: 'text-orange-600',
      clickable: true,
      onClick: () => navigate('/admin/approvals'),
    },
    {
      title: 'Approved',
      value: stats.approved || 0,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-100',
      textColor: 'text-green-600',
      clickable: false,
    },
    {
      title: 'Completed',
      value: stats.completed || 0,
      icon: Activity,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-100',
      textColor: 'text-cyan-600',
      clickable: false,
    },
    {
      title: 'Rejected',
      value: stats.rejected || 0,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-600',
      bgGradient: 'from-red-50 to-rose-100',
      textColor: 'text-red-600',
      clickable: false,
    },
    {
      title: 'No-Shows',
      value: stats.no_show || 0,
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-100',
      textColor: 'text-orange-600',
      clickable: true,
      onClick: () => navigate('/admin/no-shows'),
    },
    {
      title: 'Cancelled',
      value: stats.cancelled || 0,
      icon: Ban,
      gradient: 'from-gray-500 to-gray-600',
      bgGradient: 'from-gray-50 to-gray-100',
      textColor: 'text-gray-600',
      clickable: false,
    },
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
      topResources.slice(0, 8).map((resource) => ({
        name:
          resource.resourceName?.length > 15
            ? `${resource.resourceName.substring(0, 15)}...`
            : resource.resourceName || 'Unknown',
        fullName: resource.resourceName || 'Unknown Resource',
        bookings: resource.count || 0,
      })),
    [topResources]
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{payload[0].payload.fullName}</p>
          <p className="text-sm text-blue-600">{payload[0].value} bookings</p>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-lg font-semibold text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">System overview and analytics</p>
            </div>
            <button
              type="button"
              onClick={() => fetchAnalytics()}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                onClick={stat.clickable ? stat.onClick : undefined}
                className={`relative overflow-hidden bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl ${
                  stat.clickable ? 'cursor-pointer hover:scale-[1.02]' : ''
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} rounded-full blur-3xl opacity-30 -mr-16 -mt-16`}></div>

                <div className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="mb-1 text-sm font-medium tracking-wider text-gray-500 uppercase">
                        {stat.title}
                      </p>
                      <p className={`text-4xl font-bold ${stat.textColor}`}>{stat.value}</p>
                    </div>
                    <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
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

        <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
          <div className="p-6 bg-white shadow-xl rounded-2xl">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Booking Status Distribution</h3>
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p>No data available</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white shadow-xl rounded-2xl">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Most Booked Resources</h3>
            </div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bookings" fill="url(#adminBookingGradient)" radius={[8, 8, 0, 0]} />
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

        <div className="p-6 mb-8 bg-white shadow-xl rounded-2xl">
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
                    className="flex items-center justify-between p-4 transition-all duration-200 bg-gray-50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                  >
                    <div className="flex items-center flex-1 gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                        index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                          : index === 1
                            ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                            : index === 2
                              ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                              : 'bg-gradient-to-br from-blue-400 to-blue-600'
                      } text-white font-bold text-sm`}>
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {resource.resourceName || 'Unknown Resource'}
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          ].map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="relative p-6 overflow-hidden text-left transition-all duration-300 bg-white shadow-lg group rounded-2xl hover:shadow-2xl hover:scale-[1.02]"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.bgColor} rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:opacity-30 transition-opacity`}></div>
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br ${action.color} shadow-lg`}>
                    <Icon className="text-white w-7 h-7" />
                  </div>
                  <h4 className="mb-1 text-lg font-bold text-gray-800">{action.title}</h4>
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
