import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAnalyticsSummary } from '../api/analyticsApi';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getAnalyticsSummary();
      if (cancelled) return;
      if (data.success && data.summary) {
        setSummary(data.summary);
      } else {
        toast.error(data.message || 'Failed to load analytics');
        setSummary(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = summary?.countsByStatus || {};
  const statCards = [
    { label: 'Total bookings', value: summary?.totalBookings ?? '—', color: 'bg-slate-700' },
    { label: 'Pending', value: counts.pending ?? 0, color: 'bg-amber-500' },
    { label: 'Approved', value: counts.approved ?? 0, color: 'bg-blue-600' },
    { label: 'Completed', value: counts.completed ?? 0, color: 'bg-green-600' },
    { label: 'Rejected', value: counts.rejected ?? 0, color: 'bg-red-500' },
    { label: 'No-shows', value: counts.no_show ?? 0, color: 'bg-gray-600' },
  ];

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Admin dashboard</h1>
        <p className="mb-8 text-gray-600">Overview of bookings and top resources</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : !summary ? (
          <p className="text-gray-600">No analytics data available.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
              {statCards.map((c) => (
                <div
                  key={c.label}
                  className={`p-6 text-white rounded-xl shadow-md ${c.color}`}
                >
                  <p className="text-sm font-medium opacity-90">{c.label}</p>
                  <p className="mt-2 text-3xl font-bold">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="p-6 mb-10 bg-white border border-gray-200 shadow-sm rounded-xl">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Top resources
              </h2>
              {Array.isArray(summary.topResources) && summary.topResources.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {summary.topResources.map((row, i) => (
                    <li key={row.resourceId || i} className="flex justify-between py-3">
                      <span className="font-medium text-gray-800">
                        {row.resourceName || 'Unknown resource'}
                      </span>
                      <span className="text-gray-600">{row.count} bookings</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No booking data yet.</p>
              )}
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick links</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/admin/approvals"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Approvals
                </Link>
                <Link
                  to="/admin/resources"
                  className="px-4 py-2 font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Resources
                </Link>
                <Link
                  to="/admin/analytics"
                  className="px-4 py-2 font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Analytics
                </Link>
                <Link
                  to="/admin/no-shows"
                  className="px-4 py-2 font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  No-shows
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
