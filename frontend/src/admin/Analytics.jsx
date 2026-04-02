import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  LuActivity,
  LuCalendarRange,
  LuClock3,
  LuRefreshCw,
  LuShieldAlert,
  LuSparkles,
} from 'react-icons/lu';
import { getAnalyticsSummary } from '../api/analyticsApi';

const STATUS_COLORS = {
  approved: '#10b981',
  pending: '#f59e0b',
  completed: '#06b6d4',
  rejected: '#ef4444',
  no_show: '#f97316',
  cancelled: '#64748b',
};

const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`;

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{payload[0].value} bookings</p>
    </div>
  );
};

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async ({ showLoader = false, nextFrom = from, nextTo = to } = {}) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const response = await getAnalyticsSummary(nextFrom || undefined, nextTo || undefined);

    if (response.success) {
      setSummary(response.summary || null);
    } else {
      toast.error(response.message || 'Failed to load analytics');
    }

    setLoading(false);
    setRefreshing(false);
  }, [from, to]);

  useEffect(() => {
    loadAnalytics({ showLoader: true });
  }, []);

  const countsByStatus = summary?.countsByStatus || {};
  const pieData = useMemo(
    () =>
      Object.entries(countsByStatus)
        .map(([key, value]) => ({
          name: key.replace('_', ' '),
          value,
          color: STATUS_COLORS[key] || '#94a3b8',
        }))
        .filter((item) => item.value > 0),
    [countsByStatus]
  );

  const topResources = useMemo(
    () =>
      (summary?.topResources || []).map((resource) => ({
        name: resource.resourceName || 'Unknown',
        bookings: resource.count || 0,
      })),
    [summary]
  );

  const peakHours = useMemo(
    () =>
      (summary?.peakHours || []).map((entry) => ({
        hour: formatHour(entry.hour),
        bookings: entry.count || 0,
      })),
    [summary]
  );

  const bookingsByDay = useMemo(
    () =>
      (summary?.bookingsByDay || []).map((entry) => ({
        date: entry.date,
        bookings: entry.count || 0,
      })),
    [summary]
  );

  const statCards = [
    {
      label: 'Total',
      value: summary?.totalBookings || 0,
      accent: 'from-blue-600 via-indigo-600 to-purple-600',
      glow: 'shadow-[0_20px_45px_-26px_rgba(79,70,229,0.55)]',
      ring: 'border-blue-200/70',
      iconBg: 'bg-white/18',
      icon: LuSparkles,
    },
    {
      label: 'Approved',
      value: countsByStatus.approved || 0,
      accent: 'from-emerald-500 via-teal-500 to-cyan-500',
      glow: 'shadow-[0_20px_45px_-26px_rgba(16,185,129,0.55)]',
      ring: 'border-emerald-200/70',
      iconBg: 'bg-white/18',
      icon: LuActivity,
    },
    {
      label: 'Pending',
      value: countsByStatus.pending || 0,
      accent: 'from-amber-400 via-orange-500 to-rose-500',
      glow: 'shadow-[0_20px_45px_-26px_rgba(249,115,22,0.55)]',
      ring: 'border-orange-200/70',
      iconBg: 'bg-white/18',
      icon: LuClock3,
    },
    {
      label: 'No-Shows',
      value: countsByStatus.no_show || 0,
      accent: 'from-slate-600 via-slate-700 to-slate-900',
      glow: 'shadow-[0_20px_45px_-26px_rgba(51,65,85,0.58)]',
      ring: 'border-slate-300/70',
      iconBg: 'bg-white/16',
      icon: LuShieldAlert,
    },
  ];

  return (
    <div className="app-shell-bg px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="animate-fadeIn flex flex-col gap-4 mb-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-blue-600">
              Admin Workspace
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Analytics
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Explore booking demand, resource popularity, and operational trends.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAnalytics()}
            disabled={refreshing}
            className="modern-button-primary text-base"
          >
            <LuRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="section-card mb-8 p-6">
          <div className="flex items-center gap-2 mb-4">
            <LuCalendarRange className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Date range</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr,1fr,auto,auto]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-700">From</span>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-700">To</span>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <button
              type="button"
              onClick={() => loadAnalytics()}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Apply filter
            </button>

            <button
              type="button"
              onClick={() => {
                setFrom('');
                setTo('');
                loadAnalytics({ nextFrom: '', nextTo: '' });
              }}
                className="rounded-xl bg-gray-100 px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Clear dates
            </button>
          </div>
        </div>

        <div className="grid gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-[26px] border ${card.ring} bg-gradient-to-br ${card.accent} p-6 text-white ${card.glow} transition-transform duration-200 hover:-translate-y-0.5`}
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 left-0 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold tracking-[0.22em] uppercase text-white/80">{card.label}</p>
                  <p className="mt-4 text-5xl font-black tracking-tight text-white">{card.value}</p>
                </div>
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconBg} backdrop-blur-sm`}>
                  <card.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid gap-8">
            <div className="grid gap-8 xl:grid-cols-2">
              <div className="chart-card">
                <h2 className="text-2xl font-bold text-gray-900">Status Distribution</h2>
                <p className="mt-1 text-sm text-gray-600">See how bookings are spread across each lifecycle state.</p>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={105}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-gray-400">
                    No status data available for this range.
                  </div>
                )}
              </div>

              <div className="chart-card">
                <h2 className="text-2xl font-bold text-gray-900">Top Resources</h2>
                <p className="mt-1 text-sm text-gray-600">The most frequently booked resources in the selected period.</p>
                {topResources.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={topResources}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="bookings" radius={[8, 8, 0, 0]} fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-gray-400">
                    No resource ranking data available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <div className="chart-card">
                <h2 className="text-2xl font-bold text-gray-900">Peak Hours</h2>
                <p className="mt-1 text-sm text-gray-600">Identify the busiest booking start times across the day.</p>
                {peakHours.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-gray-400">
                    No hourly data available yet.
                  </div>
                )}
              </div>

              <div className="chart-card">
                <h2 className="text-2xl font-bold text-gray-900">Bookings by Day</h2>
                <p className="mt-1 text-sm text-gray-600">Track how booking volume changes throughout the selected range.</p>
                {bookingsByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={bookingsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="bookings" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-gray-400">
                    No daily trend data available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
