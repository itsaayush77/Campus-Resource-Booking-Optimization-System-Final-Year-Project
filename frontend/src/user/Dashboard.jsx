import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getBookingHistory, getMyBookings } from '../api/bookingApi';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myBookings, setMyBookings] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [active, past] = await Promise.all([
        getMyBookings(),
        getBookingHistory(),
      ]);
      if (cancelled) return;
      if (active.success && Array.isArray(active.bookings)) {
        setMyBookings(active.bookings);
      } else {
        toast.error(active.message || 'Failed to load bookings');
        setMyBookings([]);
      }
      if (past.success && Array.isArray(past.bookings)) {
        setHistory(past.bookings);
      } else {
        setHistory([]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingCount = myBookings.filter((b) => b.status === 'pending').length;
  const approvedCount = myBookings.filter((b) => b.status === 'approved').length;
  const activeCount = myBookings.length;
  const completedCount = history.filter((b) => b.status === 'completed').length;

  const upcoming = [...myBookings]
    .filter((b) => new Date(b.startTime) >= new Date() || b.status === 'pending')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3);

  const resourceName = (b) =>
    typeof b.resourceId === 'object' && b.resourceId?.name
      ? b.resourceId.name
      : 'Resource';

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Welcome, {user?.name}!
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-10">
              <div className="p-6 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800">Active bookings</h3>
                <p className="mt-2 text-3xl font-bold text-blue-600">{activeCount}</p>
                <p className="mt-1 text-sm text-gray-500">Pending + approved</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800">Pending approval</h3>
                <p className="mt-2 text-3xl font-bold text-amber-600">{pendingCount}</p>
                <p className="mt-1 text-sm text-gray-500">Awaiting admin</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
                <p className="mt-2 text-3xl font-bold text-green-600">{completedCount}</p>
                <p className="mt-1 text-sm text-gray-500">From your history</p>
              </div>
            </div>

            <div className="p-6 mb-8 bg-white rounded-lg shadow">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Up next</h2>
                <span className="text-sm text-gray-500">
                  {approvedCount} approved slot{approvedCount !== 1 ? 's' : ''} active
                </span>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-gray-600">No upcoming bookings. Browse resources to book.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {upcoming.map((b) => (
                    <li key={b._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{resourceName(b)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(b.startTime).toLocaleString()} ·{' '}
                          <span className="capitalize">{b.status}</span>
                        </p>
                      </div>
                      <Link
                        to="/my-bookings"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/resources"
                className="px-5 py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Browse resources
              </Link>
              <Link
                to="/my-bookings"
                className="px-5 py-2.5 font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                My bookings
              </Link>
              <Link
                to="/booking-history"
                className="px-5 py-2.5 font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Booking history
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
