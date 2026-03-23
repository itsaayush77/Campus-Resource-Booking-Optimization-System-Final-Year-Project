import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  approveBooking,
  getAllBookings,
  rejectBooking,
} from '../api/adminApi';

async function fetchBookingsForTab(tab) {
  const status = tab === 'all' ? undefined : tab;
  return getAllBookings(status);
}

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const formatRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime())) return '—';
  return `${s.toLocaleString()} → ${e.toLocaleTimeString()}`;
};

const BookingApprovals = () => {
  const [tab, setTab] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const refreshList = useCallback(async () => {
    const data = await fetchBookingsForTab(tab);
    if (data.success && Array.isArray(data.bookings)) {
      setBookings(data.bookings);
    } else {
      toast.error(data.message || 'Failed to load bookings');
      setBookings([]);
    }
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchBookingsForTab(tab);
      if (cancelled) return;
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        toast.error(data.message || 'Failed to load bookings');
        setBookings([]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const userLabel = (b) =>
    typeof b.userId === 'object'
      ? `${b.userId.name || 'User'} (${b.userId.email || ''})`
      : '—';
  const resLabel = (b) =>
    typeof b.resourceId === 'object' ? b.resourceId.name : '—';

  const onApprove = async (id) => {
    setBusyId(id);
    const data = await approveBooking(id);
    setBusyId(null);
    if (data.success) {
      toast.success(data.message || 'Approved');
      refreshList();
    } else {
      toast.error(data.message || 'Approve failed');
    }
  };

  const submitReject = async () => {
    if (!rejectId) return;
    setBusyId(rejectId);
    const data = await rejectBooking(rejectId, rejectReason.trim() || undefined);
    setBusyId(null);
    if (data.success) {
      toast.success(data.message || 'Rejected');
      setRejectId(null);
      setRejectReason('');
      refreshList();
    } else {
      toast.error(data.message || 'Reject failed');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Booking approvals</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-gray-600">No bookings in this view.</p>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 shadow-sm rounded-xl">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Resource</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Purpose</th>
                  <th className="px-4 py-3 font-semibold">Attendees</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="border-b last:border-0">
                    <td className="px-4 py-3 align-top">{userLabel(b)}</td>
                    <td className="px-4 py-3 align-top">{resLabel(b)}</td>
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      {formatRange(b.startTime, b.endTime)}
                    </td>
                    <td className="px-4 py-3 align-top max-w-xs">{b.purpose}</td>
                    <td className="px-4 py-3 align-top">{b.expectedAttendees}</td>
                    <td className="px-4 py-3 align-top capitalize">{b.status}</td>
                    <td className="px-4 py-3 align-top">
                      {b.status === 'pending' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyId === b._id}
                            onClick={() => onApprove(b._id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === b._id}
                            onClick={() => setRejectId(b._id)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reject booking</h3>
            <label className="block mt-4 text-sm font-medium text-gray-700">
              Reason <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setRejectId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === rejectId}
                onClick={submitReject}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingApprovals;
