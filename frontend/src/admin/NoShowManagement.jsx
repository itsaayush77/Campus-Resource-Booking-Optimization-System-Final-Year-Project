import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LuCircleAlert, LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';
import { getAllBookings, markNoShow } from '../api/adminApi';

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isEligibleForManualNoShow = (booking) => {
  const start = new Date(booking.startTime);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() + 15 * 60 * 1000 <= Date.now();
};

const NoShowManagement = () => {
  const [noShows, setNoShows] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('no_show');

  const loadData = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const [noShowResponse, approvedResponse] = await Promise.all([
      getAllBookings('no_show'),
      getAllBookings('approved'),
    ]);

    if (noShowResponse.success) {
      setNoShows(Array.isArray(noShowResponse.bookings) ? noShowResponse.bookings : []);
    } else {
      toast.error(noShowResponse.message || 'Failed to load no-show bookings');
    }

    if (approvedResponse.success) {
      setApprovedBookings(Array.isArray(approvedResponse.bookings) ? approvedResponse.bookings : []);
    } else {
      toast.error(approvedResponse.message || 'Failed to load approved bookings');
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData({ showLoader: true });
  }, [loadData]);

  const eligibleApproved = useMemo(
    () => approvedBookings.filter(isEligibleForManualNoShow),
    [approvedBookings]
  );

  const handleMarkNoShow = async (bookingId) => {
    setBusyId(bookingId);
    const response = await markNoShow(bookingId);
    setBusyId(null);

    if (response.success) {
      toast.success(response.message || 'Booking marked as no-show');
      loadData();
    } else {
      toast.error(response.message || 'Could not mark booking as no-show');
    }
  };

  const renderBookingCard = (booking, actions) => {
    const user = typeof booking.userId === 'object' ? booking.userId : null;
    const resource = typeof booking.resourceId === 'object' ? booking.resourceId : null;

    return (
      <div key={booking._id} className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] uppercase text-gray-500">
              {booking.status.replace('_', ' ')}
            </p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900">{resource?.name || 'Unknown resource'}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.name || 'Unknown user'}
              {user?.email ? ` (${user.email})` : ''}
            </p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
            booking.status === 'no_show' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {booking.status === 'no_show' ? 'No-Show Logged' : 'Approved'}
          </span>
        </div>

        <div className="grid gap-3 mt-5 sm:grid-cols-2">
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-500">When</p>
            <p className="mt-1 font-semibold text-gray-900">{formatDateTime(booking.startTime)}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-500">Attendees</p>
            <p className="mt-1 font-semibold text-gray-900">{booking.expectedAttendees}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          <span className="font-semibold text-gray-800">Purpose:</span> {booking.purpose}
        </p>

        {actions}
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-orange-600">
              Admin Workspace
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              No-Show Management
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Review missed bookings and manually flag overdue approved bookings when needed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData()}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-semibold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LuRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid gap-4 mb-8 md:grid-cols-3">
          {[
            { label: 'Logged No-Shows', value: noShows.length },
            { label: 'Approved Bookings', value: approvedBookings.length },
            { label: 'Eligible to Mark', value: eligibleApproved.length },
          ].map((card) => (
            <div key={card.label} className="p-5 bg-white border border-gray-200 shadow-sm rounded-2xl">
              <p className="text-sm font-semibold tracking-[0.18em] uppercase text-gray-500">{card.label}</p>
              <p className="mt-3 text-4xl font-black text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {[
            ['no_show', `No-Shows (${noShows.length})`],
            ['approved', `Eligible Approved (${eligibleApproved.length})`],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                tab === value
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-12 h-12 border-4 border-orange-500 rounded-full border-t-transparent animate-spin" />
          </div>
        ) : tab === 'no_show' ? (
          noShows.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {noShows.map((booking) =>
                renderBookingCard(
                  booking,
                  <div className="flex items-center gap-2 mt-5 text-sm text-orange-700">
                    <LuTriangleAlert className="w-5 h-5" />
                    Already recorded as a no-show.
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="p-10 text-center bg-white border border-dashed rounded-2xl border-slate-200">
              <p className="text-lg font-medium text-gray-700">No no-show bookings recorded.</p>
              <p className="mt-2 text-gray-500">This view will update as missed check-ins are detected.</p>
            </div>
          )
        ) : eligibleApproved.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {eligibleApproved.map((booking) =>
              renderBookingCard(
                booking,
                <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <LuCircleAlert className="w-5 h-5" />
                    Start time is past the grace window.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkNoShow(booking._id)}
                    disabled={busyId === booking._id}
                    className="px-4 py-3 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busyId === booking._id ? 'Marking...' : 'Mark as No-Show'}
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="p-10 text-center bg-white border border-dashed rounded-2xl border-slate-200">
            <p className="text-lg font-medium text-gray-700">No approved bookings are currently eligible.</p>
            <p className="mt-2 text-gray-500">
              Approved bookings appear here once they move past the 15-minute check-in grace window.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoShowManagement;
