import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuCircleCheckBig, LuCircleX, LuClock3, LuDownload, LuRefreshCw, LuUsers } from 'react-icons/lu';
import { approveBooking, getAllBookings, rejectBooking } from '../api/adminApi';
import { signalAppDataChanged, subscribeToAppDataChanges } from '../utils/dataSync';

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

const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

const isPopulatedObject = (value) => Boolean(value && typeof value === 'object');

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

const formatReviewTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const recommendationLabel = (value) => {
  if (value === 'recommend_approve') return 'Recommend Approve';
  if (value === 'recommend_reject') return 'Recommend Reject';
  return 'No Recommendation';
};

const recommendationStyle = (value) => {
  if (value === 'recommend_approve') return 'bg-green-100 text-green-900';
  if (value === 'recommend_reject') return 'bg-red-100 text-red-900';
  return 'bg-gray-100 text-gray-800';
};

const hasApprovalWindowPassed = (booking) => {
  const start = new Date(booking.startTime);
  if (Number.isNaN(start.getTime())) return false;
  return Date.now() >= start.getTime() + 15 * 60 * 1000;
};

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const APPROVED_HISTORY_STATUSES = ['approved', 'completed', 'cancelled', 'no_show'];

const matchesTabStatus = (booking, tab) => {
  const normalizedStatus = normalizeStatus(booking.status);

  if (tab === 'all') return true;
  if (tab === 'approved') return APPROVED_HISTORY_STATUSES.includes(normalizedStatus);
  return normalizedStatus === tab;
};

const BookingApprovals = () => {
  const [tab, setTab] = useState('pending');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadBookings = useCallback(
    async ({ showLoader = false, silent = false } = {}) => {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const allData = await getAllBookings();

      if (allData.success && Array.isArray(allData.bookings)) {
        setAllBookings(allData.bookings);
      } else {
        if (!silent) {
          toast.error(allData.message || 'Failed to load bookings');
        }
        setAllBookings([]);
      }

      setLoading(false);
      setRefreshing(false);
    },
    []
  );

  useEffect(() => {
    loadBookings({ showLoader: true });
  }, [loadBookings]);

  useEffect(() => {
    const refreshSilently = () => {
      loadBookings({ silent: true });
    };

    const interval = window.setInterval(refreshSilently, 45000);
    const unsubscribe = subscribeToAppDataChanges((event) => {
      const scope = event?.scope || 'all';
      if (scope === 'all' || scope === 'bookings' || scope === 'admin-bookings') {
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
  }, [loadBookings]);

  const counts = useMemo(
    () =>
      allBookings.reduce(
        (accumulator, booking) => {
          const normalizedStatus = normalizeStatus(booking.status);
          if (normalizedStatus === 'pending') accumulator.pending += 1;
          if (normalizedStatus === 'rejected') accumulator.rejected += 1;
          if (APPROVED_HISTORY_STATUSES.includes(normalizedStatus)) accumulator.approved += 1;
          accumulator.all += 1;
          return accumulator;
        },
        { pending: 0, approved: 0, rejected: 0, all: 0 }
      ),
    [allBookings]
  );

  const visibleBookings = useMemo(() => {
    return allBookings.filter((booking) => matchesTabStatus(booking, tab));
  }, [allBookings, tab]);

  const userLabel = (booking) =>
    isPopulatedObject(booking.userId)
      ? `${booking.userId.name || 'User'}${booking.userId.email ? ` (${booking.userId.email})` : ''}`
      : 'Archived User';

  const resourceLabel = (booking) =>
    isPopulatedObject(booking.resourceId) ? booking.resourceId.name : 'Archived Resource';

  const onApprove = async (id) => {
    const booking = visibleBookings.find((item) => item._id === id);
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

  const exportVisibleBookingsCsv = () => {
    const headers = [
      'Booking ID',
      'User Name',
      'User Email',
      'Resource',
      'Location',
      'Start Time',
      'End Time',
      'Status',
      'Purpose',
      'Expected Attendees',
      'Approved At',
      'Rejection Reason',
      'Staff Recommendation',
      'Staff Comment',
      'Reviewed By',
      'Reviewed At'
    ];

    const rows = visibleBookings.map((booking) => {
      const userName = isPopulatedObject(booking.userId) ? booking.userId?.name || '' : '';
      const userEmail = isPopulatedObject(booking.userId) ? booking.userId?.email || '' : '';
      const resourceName = isPopulatedObject(booking.resourceId) ? booking.resourceId?.name || 'Archived Resource' : 'Archived Resource';
      const location = isPopulatedObject(booking.resourceId) ? booking.resourceId?.location || '' : '';
      const reviewedBy = isPopulatedObject(booking.reviewedBy) ? booking.reviewedBy?.name || '' : '';

      return [
        booking._id,
        userName,
        userEmail,
        resourceName,
        location,
        booking.startTime,
        booking.endTime,
        booking.status,
        booking.purpose,
        booking.expectedAttendees,
        booking.approvedAt || '',
        booking.rejectionReason || '',
        recommendationLabel(booking.staffRecommendation),
        booking.staffComment || '',
        reviewedBy,
        booking.reviewedAt || ''
      ];
    });

    const csvLines = [headers, ...rows].map((line) => line.map(csvEscape).join(','));
    const csv = csvLines.join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `admin-bookings-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);

    toast.success('CSV downloaded');
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

          <div className="flex flex-wrap gap-3">
            <Link
              to="/scan-qr"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-slate-900 to-blue-900 hover:from-slate-800 hover:to-blue-800 hover:shadow-xl"
            >
              Open Scanner
            </Link>
            <button
              type="button"
              onClick={exportVisibleBookingsCsv}
              disabled={loading || visibleBookings.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-blue-700 transition-all duration-200 bg-white border border-blue-200 shadow-sm rounded-xl hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LuDownload className="w-5 h-5" />
              Download CSV
            </button>
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
        ) : visibleBookings.length === 0 ? (
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
                {tab === 'approved' && 'Approved and completed booking history'}
                {tab === 'rejected' && 'Rejected booking history'}
                {tab === 'all' && 'All booking requests and decisions'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {tab === 'pending'
                  ? 'Approve or reject requests below.'
                  : tab === 'approved'
                    ? 'This view keeps approved bookings and their later outcomes, including completed, cancelled, and no-show records.'
                    : 'This view keeps all past decisions visible for admin review.'}
              </p>
            </div>

            <div className="overflow-hidden">
              <table className="w-full text-sm table-fixed lg:text-base">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[11%]" />
                  <col className="w-[17%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="text-left text-gray-700 border-b bg-gray-50">
                    <th className="px-4 py-3 font-bold">User</th>
                    <th className="px-4 py-3 font-bold">Resource</th>
                    <th className="px-4 py-3 font-bold">When</th>
                    <th className="px-4 py-3 font-bold">Purpose</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Staff Review</th>
                    <th className="px-4 py-3 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((booking) => (
                    <tr key={booking._id} className="align-top border-b last:border-0">
                      <td className="px-4 py-4">
                        <div className="font-semibold leading-snug text-gray-900 break-words">{userLabel(booking)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold leading-snug text-gray-900 break-words">{resourceLabel(booking)}</div>
                        {isPopulatedObject(booking.resourceId) && booking.resourceId?.location && (
                          <p className="mt-1 text-sm leading-snug text-gray-500 break-words">{booking.resourceId.location}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {formatRange(booking.startTime, booking.endTime)}
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        <p className="leading-snug break-words">{booking.purpose}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          Attendees: {booking.expectedAttendees}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold capitalize ${
                            statusStyles[normalizeStatus(booking.status)] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {normalizeStatus(booking.status).replace('_', ' ')}
                        </span>
                        {normalizeStatus(booking.status) === 'approved' && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-semibold text-green-700">Approved</p>
                            <p className="mt-0.5">{formatDecisionTime(booking)}</p>
                          </div>
                        )}
                        {normalizeStatus(booking.status) === 'completed' && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-semibold text-blue-700">Completed after approval</p>
                            <p className="mt-0.5">{formatDecisionTime(booking)}</p>
                            {booking.checkOutTime && (
                              <p className="mt-1 text-gray-500">Checked out: {formatReviewTime(booking.checkOutTime)}</p>
                            )}
                          </div>
                        )}
                        {normalizeStatus(booking.status) === 'cancelled' && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-semibold text-gray-700">Cancelled after approval</p>
                            <p className="mt-0.5">{formatDecisionTime(booking)}</p>
                            {booking.cancellationReason && (
                              <p className="mt-1 text-gray-500 break-words">Reason: {booking.cancellationReason}</p>
                            )}
                          </div>
                        )}
                        {normalizeStatus(booking.status) === 'no_show' && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-semibold text-orange-700">Approved but not checked in</p>
                            <p className="mt-0.5">{formatDecisionTime(booking)}</p>
                          </div>
                        )}
                        {normalizeStatus(booking.status) === 'rejected' && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-semibold text-red-700">Rejected</p>
                            <p className="mt-0.5">{formatDecisionTime(booking)}</p>
                            {booking.rejectionReason && (
                              <p className="mt-1 text-gray-500 break-words">Reason: {booking.rejectionReason}</p>
                            )}
                          </div>
                        )}
                        {normalizeStatus(booking.status) === 'pending' && hasApprovalWindowPassed(booking) && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-semibold text-amber-700">Approval window passed</p>
                            <p className="mt-0.5 text-gray-500">
                              Beyond check-in grace period.
                            </p>
                          </div>
                        )}
                        {normalizeStatus(booking.status) === 'pending' && !hasApprovalWindowPassed(booking) && (
                          <span className="block mt-2 text-sm text-gray-400">Pending decision</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="overflow-hidden border border-blue-200 shadow-sm rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-blue-100 bg-white/60">
                            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-blue-700">Staff Review</p>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${recommendationStyle(booking.staffRecommendation)}`}>
                              {recommendationLabel(booking.staffRecommendation)}
                            </span>
                          </div>
                          <div className="px-3 py-2">
                            <p className="text-xs leading-relaxed break-words text-slate-700">
                              {booking.staffComment ? booking.staffComment : 'No comment provided.'}
                            </p>
                            <p className="mt-2 text-[11px] text-blue-700 break-words">
                              {booking.reviewedAt
                                ? `Reviewed ${formatReviewTime(booking.reviewedAt)}${
                                    isPopulatedObject(booking.reviewedBy) && booking.reviewedBy?.name
                                      ? ` by ${booking.reviewedBy.name}`
                                      : ''
                                  }`
                                : 'Not reviewed by staff yet.'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {normalizeStatus(booking.status) === 'pending' ? (
                          <div className="flex flex-col items-stretch gap-2">
                            <button
                              type="button"
                              disabled={busyId === booking._id || hasApprovalWindowPassed(booking)}
                              onClick={() => onApprove(booking._id)}
                              className="inline-flex items-center justify-center px-3 py-2 text-sm font-bold text-white transition-colors duration-200 bg-green-600 rounded-lg shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                              {hasApprovalWindowPassed(booking) ? 'Approval expired' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === booking._id}
                              onClick={() => setRejectId(booking._id)}
                              className="inline-flex items-center justify-center px-3 py-2 text-sm font-bold text-white transition-colors duration-200 bg-red-600 rounded-lg shadow-sm hover:bg-red-700 disabled:bg-gray-400"
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
