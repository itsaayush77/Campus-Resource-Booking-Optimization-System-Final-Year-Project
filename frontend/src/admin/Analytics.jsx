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
  LuGauge,
  LuRefreshCw,
  LuShieldAlert,
  LuSparkles,
  LuTrendingUp,
  LuWaypoints,
  LuChartColumn,
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

const formatPercent = (value) => `${Number(value || 0).toFixed(0)}%`;

const formatMinutes = (minutes) => {
  const total = Math.max(0, Math.round(minutes || 0));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
};

const formatCompactDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const truncateLabel = (value, maxLength = 16) => {
  if (!value) return 'Unknown';
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const displayLabel = entry?.payload?.fullName || label;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{displayLabel}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{entry.value} bookings</p>
    </div>
  );
};

const MultiSeriesTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-2 grid gap-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-bold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
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
  const todayCountsByStatus = summary?.todayCountsByStatus || {};
  const weekCountsByStatus = summary?.weekCountsByStatus || {};
  const todayBookings = summary?.todayBookings || 0;
  const weekBookings = summary?.weekBookings || 0;
  const actualUsage = summary?.actualUsage || {};
  const usageInsight = summary?.usageInsight || null;
  const checkedInCount = actualUsage.checkedInCount || 0;
  const completedUsageCount = actualUsage.completedUsageCount || 0;
  const bookedForUseCount = actualUsage.bookedForUseCount || 0;
  const utilizationRate = actualUsage.utilizationRate || 0;
  const durationUtilizationRate = actualUsage.durationUtilizationRate || 0;
  const scheduledUsageMinutes = actualUsage.scheduledUsageMinutes || 0;
  const actualUsageMinutes = actualUsage.actualUsageMinutes || 0;
  const bookedVsUsedGap = Math.max(0, bookedForUseCount - checkedInCount);
  const peakActualUsagePeriod = actualUsage.peakActualUsagePeriod || null;

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
        name: truncateLabel(resource.resourceName || 'Unknown'),
        fullName: resource.resourceName || 'Unknown',
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
        date: formatCompactDate(entry.date),
        fullName: entry.date,
        bookings: entry.count || 0,
      })),
    [summary]
  );

  const usageByDay = useMemo(
    () =>
      (actualUsage?.usageByDay || []).map((entry) => ({
        date: formatCompactDate(entry.date),
        booked: entry.bookedCount || 0,
        used: entry.usedCount || 0,
        completed: entry.completedCount || 0,
      })),
    [actualUsage]
  );

  const peakActualUsageHours = useMemo(
    () =>
      (actualUsage?.peakActualUsageHours || []).map((entry) => ({
        hour: formatHour(entry.hour),
        checkIns: entry.count || 0,
      })),
    [actualUsage]
  );

  const underutilizedResources = actualUsage?.underutilizedResources || [];

  const actualUsageCards = [
    {
      label: 'Checked In',
      value: checkedInCount,
      hint: 'Bookings that reached verified check-in',
      accent: 'from-cyan-500 via-sky-500 to-blue-600',
      ring: 'border-cyan-200/70',
      icon: LuWaypoints,
    },
    {
      label: 'Completed Usage',
      value: completedUsageCount,
      hint: 'Bookings that were checked out successfully',
      accent: 'from-emerald-500 via-teal-500 to-green-600',
      ring: 'border-emerald-200/70',
      icon: LuActivity,
    },
    {
      label: 'Utilization Rate',
      value: formatPercent(utilizationRate),
      hint: 'Checked-in bookings compared with confirmed usable bookings',
      accent: 'from-violet-500 via-indigo-500 to-blue-600',
      ring: 'border-violet-200/70',
      icon: LuGauge,
    },
    {
      label: 'Booked vs Used',
      value: `${checkedInCount}/${bookedForUseCount}`,
      hint: bookedVsUsedGap > 0 ? `${bookedVsUsedGap} confirmed bookings were not used` : 'All confirmed bookings were used',
      accent: 'from-amber-400 via-orange-500 to-rose-500',
      ring: 'border-orange-200/70',
      icon: LuChartColumn,
    },
  ];

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
              Explore booking demand, actual usage behaviour, and resource performance in one place.
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

        <div className="relative mb-8 overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-soft backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600" />
          <div className="absolute -right-20 top-10 h-44 w-44 rounded-full bg-cyan-100/70 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-violet-100/60 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Actual Usage Lens</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">How bookings turn into real usage</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  These metrics reuse your existing approval, check-in, and check-out data to show how many confirmed bookings were actually used and where capacity may be underperforming.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Peak Actual Usage</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {peakActualUsagePeriod ? formatHour(peakActualUsagePeriod.hour) : 'No data'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {peakActualUsagePeriod
                    ? `${peakActualUsagePeriod.count} verified check-ins at this hour`
                    : 'Verified check-ins will appear here once usage is recorded.'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr,0.8fr]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {actualUsageCards.map((card) => (
                  <div
                    key={card.label}
                    className={`relative overflow-hidden rounded-[24px] border ${card.ring} bg-gradient-to-br ${card.accent} p-5 text-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)]`}
                  >
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/12 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">{card.label}</p>
                        <p className="mt-4 text-4xl font-black tracking-tight text-white">{card.value}</p>
                        <p className="mt-3 text-sm text-white/85">{card.hint}</p>
                      </div>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.6)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Trend Insight</p>
                    <h3 className="mt-3 text-2xl font-black tracking-tight text-white">Recent usage direction</h3>
                  </div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <LuTrendingUp className="h-6 w-6 text-cyan-300" />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-200">
                  {usageInsight?.body || 'Recent usage insight will appear here once enough verified check-ins are available.'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Scheduled Time</p>
                    <p className="mt-2 text-2xl font-black text-white">{formatMinutes(scheduledUsageMinutes)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Actual Time Used</p>
                    <p className="mt-2 text-2xl font-black text-white">{formatMinutes(actualUsageMinutes)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Duration Utilization</p>
                  <p className="mt-1 text-lg font-bold text-white">{formatPercent(durationUtilizationRate)}</p>
                  <p className="mt-1 text-sm text-slate-200">Actual used minutes compared with total confirmed booked minutes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          <div className="section-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Today</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{todayBookings}</p>
            <p className="mt-1 text-sm text-slate-600">Total bookings started today</p>
          </div>
          <div className="section-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">This Week</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{weekBookings}</p>
            <p className="mt-1 text-sm text-slate-600">Bookings started since Monday</p>
          </div>
          <div className="section-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Today By Status</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-900">Pending {todayCountsByStatus.pending || 0}</span>
              <span className="rounded-full bg-green-100 px-2 py-1 font-semibold text-green-900">Approved {todayCountsByStatus.approved || 0}</span>
              <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-900">Completed {todayCountsByStatus.completed || 0}</span>
            </div>
          </div>
          <div className="section-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Week By Status</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-900">Pending {weekCountsByStatus.pending || 0}</span>
              <span className="rounded-full bg-green-100 px-2 py-1 font-semibold text-green-900">Approved {weekCountsByStatus.approved || 0}</span>
              <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-900">Completed {weekCountsByStatus.completed || 0}</span>
            </div>
          </div>
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

            <div className="grid gap-8 xl:grid-cols-2">
              <div className="chart-card">
                <h2 className="text-2xl font-bold text-gray-900">Booked vs Actually Used</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Compare confirmed usable bookings against verified usage across the selected period.
                </p>
                {usageByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={usageByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<MultiSeriesTooltip />} />
                      <Legend formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>} />
                      <Line type="monotone" dataKey="booked" name="Booked" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="used" name="Checked In" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-gray-400">
                    No actual-usage trend data available yet.
                  </div>
                )}
              </div>

              <div className="chart-card">
                <h2 className="text-2xl font-bold text-gray-900">Peak Actual Usage Periods</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Verified check-ins by hour help reveal when resources are truly being used.
                </p>
                {peakActualUsageHours.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={peakActualUsageHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<MultiSeriesTooltip />} />
                      <Bar dataKey="checkIns" name="Verified check-ins" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-gray-400">
                    No verified check-in pattern available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Underutilized Resources</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Resources with repeated confirmed bookings but weaker real usage are highlighted here.
                  </p>
                </div>
                <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
                  {underutilizedResources.length > 0
                    ? `${underutilizedResources.length} resource${underutilizedResources.length > 1 ? 's' : ''} need attention`
                    : 'No immediate underutilization signal'}
                </div>
              </div>

              {underutilizedResources.length > 0 ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {underutilizedResources.map((resource) => (
                    <div key={resource.resourceId} className="rounded-[22px] border border-slate-200 bg-slate-50/90 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{resource.resourceName}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {resource.usedCount} used out of {resource.bookedCount} confirmed bookings
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900 shadow-soft">
                          {formatPercent(resource.utilizationRate)}
                        </span>
                      </div>

                      <div className="mt-4 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
                          style={{ width: `${Math.min(resource.utilizationRate, 100)}%` }}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Completed</p>
                          <p className="mt-2 text-xl font-black text-slate-900">{resource.completedCount}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Booked Time</p>
                          <p className="mt-2 text-xl font-black text-slate-900">{formatMinutes(resource.scheduledMinutes)}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actual Time</p>
                          <p className="mt-2 text-xl font-black text-slate-900">{formatMinutes(resource.actualUsageMinutes)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-6 text-emerald-900">
                  Current tracked resources are being used consistently enough that none are flagged as underutilized in this range.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
