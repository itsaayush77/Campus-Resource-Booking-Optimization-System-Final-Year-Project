import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBookingHistory } from '../api/bookingApi';
import { LuRefreshCw } from 'react-icons/lu';
import { subscribeToAppDataChanges } from '../utils/dataSync';

const statusStyles = {
  completed: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-red-100 text-red-900',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-orange-100 text-orange-900',
  approved: 'bg-green-100 text-green-900',
  pending: 'bg-amber-100 text-amber-900',
};

const formatRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '--';
  }

  return `${startDate.toLocaleString()} -> ${endDate.toLocaleTimeString()}`;
};

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async ({ showLoader = false, silent = false } = {}) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const data = await getBookingHistory();
    if (data.success && Array.isArray(data.bookings)) {
      setBookings(data.bookings);
    } else {
      setBookings([]);
      if (!silent) {
        toast.error(data.message || 'Failed to load booking history');
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchHistory({ showLoader: true });
  }, [fetchHistory]);

  useEffect(() => {
    const refreshSilently = () => {
      fetchHistory({ silent: true });
    };

    const interval = window.setInterval(refreshSilently, 45000);
    const unsubscribe = subscribeToAppDataChanges((event) => {
      const scope = event?.scope || 'all';
      if (scope === 'all' || scope === 'bookings' || scope === 'admin-bookings' || scope === 'booking-history') {
        refreshSilently();
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSilently();
      }
    };

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchHistory]);

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="px-4 mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking History</h1>
            <p className="mt-1 text-gray-600">Completed, cancelled, rejected, and no-show bookings</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchHistory()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-200 disabled:opacity-70"
            >
              <LuRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              to="/my-bookings"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              View active bookings
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl shadow">
            <p className="text-gray-600">No booking history yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {booking.resourceId?.name || 'Resource'}
                    </h2>
                    {booking.resourceId?.location && (
                      <p className="text-sm text-gray-500">{booking.resourceId.location}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-600">{formatRange(booking.startTime, booking.endTime)}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-medium">Purpose:</span> {booking.purpose}
                    </p>
                    {booking.rejectionReason && (
                      <p className="mt-2 text-sm font-medium text-red-600">
                        Rejected: {booking.rejectionReason}
                      </p>
                    )}
                    {booking.cancellationReason && (
                      <p className="mt-2 text-sm font-medium text-gray-600">
                        Cancelled: {booking.cancellationReason}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                    statusStyles[booking.status] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
