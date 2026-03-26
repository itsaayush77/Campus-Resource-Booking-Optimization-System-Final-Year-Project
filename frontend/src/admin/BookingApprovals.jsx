import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCircleCheckBig, LuCircleX, LuClock3, LuRefreshCw, LuUsers } from 'react-icons/lu';
import { approveBooking, getAllBookings, rejectBooking } from '../api/adminApi';
import { signalAppDataChanged } from '../utils/dataSync';

async function fetchBookingsForTab(tab) {
  const status = tab === 'all' ? undefined : tab;
  return getAllBookings(status);
}

const TABS = [
  { key: 'pending', label: 'Pending', icon: LuClock3 },
  { key: 'approved', label: 'Approved', icon: LuCircleCheckBig },
  { key: 'rejected', label: 'Rejected', icon: LuCircleX },
  { key: 'all', label: 'All', icon: LuUsers },
];

const statusStyles = {
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-green-100 text-green-900',
  rejected: 'bg-red-100 text-red-900',
  completed: 'bg-blue-100 text-blue-900',
  no_show: 'bg-orange-100 text-orange-900',
  cancelled: 'bg-gray-100 text-gray-800',
};

const formatRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '-';

  return `${s.toLocaleDateString()} • ${s.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${e.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const formatDecisionTime = (booking) => {
  const decisionDate = booking.approvedAt || booking.updatedAt || booking.createdAt;
  const date = new Date(decisionDate);
  if (Number.isNaN(date.getTime())) return 'Not recorded';

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const hasApprovalWindowPassed = (booking) => {
  const start = new Date(booking.startTime);
  if (Number.isNaN(start.getTime())) return false;
  return Date.now() >= start.getTime() + 15 * 60 * 1000;
};

const BookingApprovals = () => {
  const [tab, setTab] = useState('pending');
  const [allBookings, setAllBookings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadBookings = useCallback(
    async ({ showLoader = false } = {}) => {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [allData, tabData] = await Promise.all([
        getAllBookings(),
        tab === 'all' ? Promise.resolve(null) : fetchBookingsForTab(tab),
      ]);

      if (allData.success && Array.isArray(allData.bookings)) {
        setAllBookings(allData.bookings);
        setBookings(tab === 'all' ? allData.bookings : tabData?.bookings || []);
      } else {
        toast.error(allData.message || 'Failed to load bookings');
        setAllBookings([]);
        setBookings([]);
      }

      if (tab !== 'all' && (!tabData?.success || !Array.isArray(tabData.bookings))) {
        toast.error(tabData?.message || `Failed to load ${tab} bookings`);
        setBookings([]);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [tab]
  );

  useEffect(() => {
    loadBookings({ showLoader: true });
  }, [loadBookings]);

  const counts = useMemo(
    () =>
      allBookings.reduce(
        (accumulator, booking) => {
          if (accumulator[booking.status] !== undefined) {
            accumulator[booking.status] += 1;
          }
          accumulator.all += 1;
          return accumulator;
        },
        { pending: 0, approved: 0, rejected: 0, all: 0 }
      ),
    [allBookings]
  );

  const userLabel = (booking) =>
    typeof booking.userId === 'object'
      ? `${booking.userId.name || 'User'}${booking.userId.email ? ` (${booking.userId.email})` : ''}`
      : 'User';

  const resourceLabel = (booking) =>
    typeof booking.resourceId === 'object' ? booking.resourceId.name : 'Resource';

  const onApprove = async (id) => {
    const booking = bookings.find((item) => item._id === id);
    if (booking && hasApprovalWindowPassed(booking)) {
      toast.error('Approval window has already passed for this booking');
      return;
    }

    setBusyId(id);
    const data = await approveBooking(id);
    setBusyId(null);

    if (data.success) {
      toast.success(data.message || 'Approved');
      signalAppDataChanged('admin-bookings');
      loadBookings();
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
      signalAppDataChanged('admin-bookings');
      loadBookings();
    } else {
      toast.error(data.message || 'Reject failed');
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-blue-600">
              Admin Workspace
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              Booking Approvals
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Review pending requests and keep a full record of approved and rejected decisions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadBookings()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LuRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          {TABS.map((item) => {
            const Icon = item.icon;
            const value = counts[item.key] ?? 0;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`rounded-2xl border p-5 text-left transition-all duration-200 ${
                  tab === item.key
                    ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl'
                    : 'border-gray-200 bg-white text-gray-800 shadow-sm hover:border-blue-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${tab === item.key ? 'text-blue-100' : 'text-gray-500'}`}>
                      {item.label}
                    </p>
                    <p className="mt-3 text-4xl font-black">{value}</p>
                  </div>
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      tab === item.key ? 'bg-white/15' : 'bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-7 w-7 ${tab === item.key ? 'text-white' : 'text-blue-600'}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-10 text-center bg-white border border-gray-200 shadow-sm rounded-2xl">
            <p className="text-lg font-medium text-gray-700">No bookings in this view.</p>
            <p className="mt-2 text-gray-500">
              Switch tabs to review approved, rejected, or all booking decisions.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50/60">
              <h2 className="text-xl font-bold text-gray-900">
                {tab === 'pending' && 'Pending booking requests'}
                {tab === 'approved' && 'Approved booking history'}
                {tab === 'rejected' && 'Rejected booking history'}
                {tab === 'all' && 'All booking requests and decisions'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {tab === 'pending'
                  ? 'Approve or reject requests below.'
                  : 'This view keeps all past decisions visible for admin review.'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr className="text-left text-gray-700 border-b bg-gray-50">
                    <th className="px-6 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">Resource</th>
                    <th className="px-6 py-4 font-bold">When</th>
                    <th className="px-6 py-4 font-bold">Purpose</th>
                    <th className="px-6 py-4 font-bold">Attendees</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Decision Info</th>
                    <th className="px-6 py-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="border-b last:border-0 align-top">
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">{userLabel(booking)}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">{resourceLabel(booking)}</div>
                        {typeof booking.resourceId === 'object' && booking.resourceId?.location && (
                          <p className="mt-1 text-sm text-gray-500">{booking.resourceId.location}</p>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-gray-700">
                        {formatRange(booking.startTime, booking.endTime)}
                      </td>
                      <td className="px-6 py-5 max-w-sm text-gray-700">
                        {booking.purpose}
                      </td>
                      <td className="px-6 py-5 font-semibold text-gray-900">
                        {booking.expectedAttendees}
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-4 py-2 text-sm font-bold capitalize ${
                            statusStyles[booking.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {booking.status === 'approved' && (
                          <div>
                            <p className="font-semibold text-green-700">Approved</p>
                            <p className="mt-1">{formatDecisionTime(booking)}</p>
                          </div>
                        )}
                        {booking.status === 'rejected' && (
                          <div>
                            <p className="font-semibold text-red-700">Rejected</p>
                            <p className="mt-1">{formatDecisionTime(booking)}</p>
                            {booking.rejectionReason && (
                              <p className="mt-2 text-gray-500">Reason: {booking.rejectionReason}</p>
                            )}
                          </div>
                        )}
                        {booking.status === 'pending' && hasApprovalWindowPassed(booking) && (
                          <div>
                            <p className="font-semibold text-amber-700">Approval window passed</p>
                            <p className="mt-1 text-gray-500">
                              This request is already beyond the 15-minute check-in grace period.
                            </p>
                          </div>
                        )}
                        {!['approved', 'rejected', 'pending'].includes(booking.status) && (
                          <span className="text-gray-400">Pending decision</span>
                        )}
                        {booking.status === 'pending' && !hasApprovalWindowPassed(booking) && (
                          <span className="text-gray-400">Pending decision</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {booking.status === 'pending' ? (
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={busyId === booking._id || hasApprovalWindowPassed(booking)}
                              onClick={() => onApprove(booking._id)}
                              className="inline-flex items-center justify-center px-5 py-3 text-base font-bold text-white transition-colors duration-200 bg-green-600 rounded-xl shadow-sm min-w-[128px] hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                              {hasApprovalWindowPassed(booking) ? 'Approval expired' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === booking._id}
                              onClick={() => setRejectId(booking._id)}
                              className="inline-flex items-center justify-center px-5 py-3 text-base font-bold text-white transition-colors duration-200 bg-red-600 rounded-xl shadow-sm min-w-[128px] hover:bg-red-700 disabled:bg-gray-400"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-400">
                            No further action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-2xl">
            <h3 className="text-xl font-bold text-gray-900">Reject booking</h3>
            <label className="block mt-4 text-sm font-medium text-gray-700">
              Reason <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
              className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-xl focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setRejectId(null);
                  setRejectReason('');
                }}
                className="px-5 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === rejectId}
                onClick={submitReject}
                className="px-5 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:bg-gray-400"
              >
                Confirm reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingApprovals;
