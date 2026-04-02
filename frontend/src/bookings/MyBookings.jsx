import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cancelBooking, getBookingHistory, getMyBookings } from '../api/bookingApi';

const isOverduePendingBooking = (booking) =>
  booking?.status === 'pending' && new Date(booking.endTime).getTime() < Date.now();

const mergeBookings = (...groups) => {
  const byId = new Map();

  groups.flat().forEach((booking) => {
    if (booking?._id) {
      byId.set(booking._id, booking);
    }
  });

  return [...byId.values()].sort(
    (left, right) => new Date(right.startTime || right.createdAt || 0) - new Date(left.startTime || left.createdAt || 0)
  );
};

async function fetchAllBookings() {
  const [activeResponse, historyResponse] = await Promise.all([
    getMyBookings(),
    getBookingHistory(),
  ]);

  const activeBookings =
    activeResponse.success && Array.isArray(activeResponse.bookings)
      ? activeResponse.bookings
      : [];
  const historyBookings =
    historyResponse.success && Array.isArray(historyResponse.bookings)
      ? historyResponse.bookings
      : [];

  if (!activeResponse.success && !historyResponse.success) {
    toast.error(activeResponse.message || historyResponse.message || 'Failed to load bookings');
  }

  return {
    activeBookings,
    historyBookings,
    allBookings: mergeBookings(activeBookings, historyBookings),
  };
}

const formatRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '—';
  return `${s.toLocaleString()} → ${e.toLocaleTimeString()}`;
};

const statusStyles = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-green-100 text-green-900',
  completed: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-red-100 text-red-900',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-orange-100 text-orange-900',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'history', label: 'History' },
];

const MyBookings = () => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [qrBooking, setQrBooking] = useState(null);
  const [filter, setFilter] = useState('all');

  const refresh = useCallback(async () => {
    const result = await fetchAllBookings();
    setActiveBookings(result.activeBookings);
    setHistoryBookings(result.historyBookings);
    setBookings(result.allBookings);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchAllBookings();
      if (cancelled) return;
      setActiveBookings(result.activeBookings);
      setHistoryBookings(result.historyBookings);
      setBookings(result.allBookings);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resourceName = (b) =>
    typeof b.resourceId === 'object' && b.resourceId?.name
      ? b.resourceId.name
      : 'Resource';
  const resourceLocation = (b) =>
    typeof b.resourceId === 'object' && b.resourceId?.location
      ? b.resourceId.location
      : '';

  const filteredBookings = useMemo(() => {
    if (filter === 'active') return activeBookings;
    if (filter === 'history') return historyBookings;
    return bookings;
  }, [activeBookings, bookings, filter, historyBookings]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const data = await cancelBooking(cancelTarget._id, cancelReason.trim() || undefined);
    setCancelling(false);
    if (data.success) {
      toast.success(data.message || 'Booking cancelled');
      setCancelTarget(null);
      setCancelReason('');
      await refresh();
    } else {
      toast.error(data.message || 'Could not cancel');
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="px-4 mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My bookings</h1>
            <p className="mt-1 text-gray-600">See your active requests and full booking history in one place.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/resources"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Browse resources
            </Link>
            <Link
              to="/booking-history"
              className="px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100"
            >
              History page
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {FILTERS.map((item) => {
            const count =
              item.key === 'active'
                ? activeBookings.length
                : item.key === 'history'
                  ? historyBookings.length
                  : bookings.length;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  filter === item.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-200'
                }`}
              >
                {item.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl shadow">
            <p className="text-gray-600">
              {filter === 'active' && 'You have no active bookings.'}
              {filter === 'history' && 'You have no booking history yet.'}
              {filter === 'all' && 'You have no bookings yet.'}
            </p>
            <div className="flex justify-center gap-4 mt-4">
              {filter !== 'all' && bookings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="font-medium text-blue-600"
                >
                  View all bookings
                </button>
              )}
              <Link to="/resources" className="font-medium text-blue-600">
                Find a resource to book
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredBookings.map((b) => (
              <li
                key={b._id}
                className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {resourceName(b)}
                    </h2>
                    {resourceLocation(b) && (
                      <p className="text-sm text-gray-500">{resourceLocation(b)}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-600">{formatRange(b.startTime, b.endTime)}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-medium">Purpose:</span> {b.purpose}
                    </p>
                    {b.rejectionReason && (
                      <p className="mt-2 text-sm font-medium text-red-600">
                        Rejected: {b.rejectionReason}
                      </p>
                    )}
                    {b.cancellationReason && (
                      <p className="mt-2 text-sm font-medium text-gray-600">
                        Cancelled: {b.cancellationReason}
                      </p>
                    )}
                    {isOverduePendingBooking(b) && (
                      <div className="max-w-2xl p-3 mt-3 border border-amber-200 rounded-xl bg-amber-50">
                        <p className="text-sm font-semibold text-amber-900">
                          Booking window passed while still pending approval
                        </p>
                        <p className="mt-1 text-sm text-amber-800">
                          No-show rules only apply after an admin approves a booking. Because this request
                          was never approved, it will stay pending until the admin approves or rejects it.
                        </p>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                      statusStyles[b.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {b.status === 'approved' && b.qrCodeImage && (
                    <button
                      type="button"
                      onClick={() => setQrBooking(b)}
                      className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      View QR code
                    </button>
                  )}
                  {b.status === 'approved' && (
                    <Link
                      to={`/qr-checkin/${b._id}`}
                      className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                      Check-in page
                    </Link>
                  )}
                  {['pending', 'approved'].includes(b.status) && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(b)}
                      className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900">Cancel booking?</h3>
            <p className="mt-2 text-sm text-gray-600">
              {resourceName(cancelTarget)} — {formatRange(cancelTarget.startTime, cancelTarget.endTime)}
            </p>
            <label className="block mt-4 text-sm font-medium text-gray-700">
              Reason <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setCancelTarget(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={confirmCancel}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {cancelling ? 'Cancelling…' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrBooking && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm p-6 text-center bg-white shadow-xl rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900">Check-in QR</h3>
            <p className="mt-1 text-sm text-gray-600">{resourceName(qrBooking)}</p>
            <img
              src={qrBooking.qrCodeImage}
              alt="Booking QR code"
              className="w-full max-w-[280px] mx-auto mt-4 border border-gray-200 rounded-lg"
            />
            <p className="mt-3 text-xs text-gray-500">
              Show this at the venue during the check-in window.
            </p>
            <button
              type="button"
              onClick={() => setQrBooking(null)}
              className="w-full py-2 mt-4 font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
