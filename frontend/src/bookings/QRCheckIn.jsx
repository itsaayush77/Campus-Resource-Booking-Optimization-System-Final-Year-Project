import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkOutBooking, getBookingById } from '../api/bookingApi';
import BackButton from '../components/BackButton';
import { signalAppDataChanged, subscribeToAppDataChanges } from '../utils/dataSync';
import { LuLogOut, LuRefreshCw } from 'react-icons/lu';

const formatTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
};

const QRCheckIn = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadBooking = useCallback(
    async ({ silent = false } = {}) => {
      if (!bookingId) return;

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getBookingById(bookingId);

      if (data.success && data.booking) {
        setBooking(data.booking);
      } else {
        if (!silent) {
          toast.error(data.message || 'Booking not found');
          setBooking(null);
        }
      }

      setLoading(false);
      setRefreshing(false);
    },
    [bookingId]
  );

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    if (!bookingId) return undefined;

    const refreshSilently = () => {
      void loadBooking({ silent: true });
    };

    const interval = window.setInterval(refreshSilently, 30000);
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
  }, [bookingId, loadBooking]);

  const resourceName =
    booking && typeof booking.resourceId === 'object'
      ? booking.resourceId.name
      : 'Resource';

  const isCheckedIn = Boolean(booking?.checkInTime && !booking?.checkOutTime);
  const isCompleted = booking?.status === 'completed';
  const isAwaitingVerification = booking?.status === 'approved' && !booking?.checkInTime;

  const statusMeta = useMemo(() => {
    switch (booking?.status) {
      case 'approved':
        return {
          badge: 'Approved',
          badgeClass: 'bg-green-100 text-green-900',
          title: isCheckedIn ? 'Session In Progress' : 'Check-In Verification',
          description: isCheckedIn
            ? 'Your booking has been verified and the session is active.'
            : 'Show this QR code to an admin at the venue for check-in verification.',
        };
      case 'pending':
        return {
          badge: 'Pending',
          badgeClass: 'bg-amber-100 text-amber-900',
          title: 'Awaiting Approval',
          description: 'QR verification becomes available after an admin approves the booking.',
        };
      case 'rejected':
        return {
          badge: 'Rejected',
          badgeClass: 'bg-red-100 text-red-900',
          title: 'Booking Rejected',
          description: 'This booking cannot be verified because it was rejected.',
        };
      case 'cancelled':
        return {
          badge: 'Cancelled',
          badgeClass: 'bg-gray-100 text-gray-800',
          title: 'Booking Cancelled',
          description: 'This booking is no longer active.',
        };
      case 'no_show':
        return {
          badge: 'No Show',
          badgeClass: 'bg-orange-100 text-orange-900',
          title: 'Marked as No-Show',
          description: 'This approved booking was not checked in within the allowed window.',
        };
      default:
        return {
          badge: 'Booking',
          badgeClass: 'bg-slate-100 text-slate-800',
          title: 'Booking Details',
          description: 'Review the current booking status below.',
        };
    }
  }, [booking?.status, isCheckedIn]);

  const handleCheckOut = async () => {
    if (!booking) return;

    setProcessing(true);
    const data = await checkOutBooking(booking._id);
    setProcessing(false);

    if (data.success) {
      toast.success(`Session ended. Usage: ${data.actualUsageDuration} minutes.`);
      setBooking(data.booking);
      signalAppDataChanged('bookings');
    } else {
      toast.error(data.message || 'Check-out failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-lg px-4 py-16 mx-auto text-center">
        <p className="text-gray-600">Booking not found.</p>
        <div className="flex justify-center mt-4">
          <BackButton label="My bookings" to="/my-bookings" className="mb-0" />
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="max-w-md px-4 mx-auto text-center">
          <div className="p-8 bg-white shadow-lg rounded-2xl">
            <div className="flex justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <span className="self-center text-2xl font-bold text-green-600">OK</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Session Completed</h1>
            <p className="mt-2 text-gray-600">{resourceName}</p>
            {booking.actualUsageDuration ? (
              <p className="mt-3 text-lg font-semibold text-blue-600">
                Duration: {booking.actualUsageDuration} minutes
              </p>
            ) : null}
            <div className="mt-4 space-y-1 text-sm text-gray-500">
              {booking.checkInTime && <p>Checked in at: {formatTimestamp(booking.checkInTime)}</p>}
              {booking.checkOutTime && <p>Checked out at: {formatTimestamp(booking.checkOutTime)}</p>}
            </div>
            <Link
              to="/my-bookings"
              className="inline-block px-6 py-2 mt-6 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Back to my bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="max-w-3xl px-4 mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton label="My bookings" to="/my-bookings" className="mb-0" />
          <button
            type="button"
            onClick={() => loadBooking({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-blue-200 disabled:opacity-70"
          >
            <LuRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh status'}
          </button>
        </div>

        <div className="grid gap-6 mt-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="p-6 bg-white shadow-lg rounded-3xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  {statusMeta.title}
                </h1>
                <p className="mt-2 text-slate-600">{statusMeta.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${statusMeta.badgeClass}`}>
                {statusMeta.badge}
              </span>
            </div>

            <div className="grid gap-4 mt-6 sm:grid-cols-2">
              <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Resource</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{resourceName}</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
                <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Booking Window</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {new Date(booking.startTime).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  to {new Date(booking.endTime).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-4 mt-4 border border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Timeline</p>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                {booking.approvedAt && <p>Approved at: {formatTimestamp(booking.approvedAt)}</p>}
                {booking.checkInTime && <p>Checked in at: {formatTimestamp(booking.checkInTime)}</p>}
                {booking.checkOutTime && <p>Checked out at: {formatTimestamp(booking.checkOutTime)}</p>}
              </div>
            </div>

            {booking.rejectionReason && (
              <div className="p-4 mt-4 border border-red-200 rounded-2xl bg-red-50">
                <p className="text-sm font-semibold text-red-900">Rejection reason</p>
                <p className="mt-1 text-sm text-red-800">{booking.rejectionReason}</p>
              </div>
            )}

            {booking.cancellationReason && (
              <div className="p-4 mt-4 border border-slate-200 rounded-2xl bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">Cancellation reason</p>
                <p className="mt-1 text-sm text-slate-700">{booking.cancellationReason}</p>
              </div>
            )}

            {booking.status === 'no_show' && (
              <div className="p-4 mt-4 border border-orange-200 rounded-2xl bg-orange-50">
                <p className="text-sm font-semibold text-orange-900">Check-in window missed</p>
                <p className="mt-1 text-sm text-orange-800">
                  No-show handling remains controlled by the existing backend scheduler and booking rules.
                </p>
              </div>
            )}

            {isAwaitingVerification && (
              <div className="p-4 mt-4 border border-blue-200 rounded-2xl bg-blue-50">
                <p className="text-sm font-semibold text-blue-900">Waiting for venue verification</p>
                <p className="mt-1 text-sm text-blue-800">
                  Present the QR code below to an admin during the check-in window. This page will update when the booking is verified.
                </p>
              </div>
            )}

            {isCheckedIn && (
              <>
                <div className="p-4 mt-4 border border-green-200 rounded-2xl bg-green-50">
                  <p className="text-sm font-semibold text-green-900">You are checked in</p>
                  <p className="mt-1 text-sm text-green-800">
                    Your session is active. End the session when you are done using the resource.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={handleCheckOut}
                  className="inline-flex items-center justify-center w-full gap-2 py-3 mt-6 font-semibold text-white bg-red-600 rounded-2xl hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  <LuLogOut size={20} />
                  {processing ? 'Ending session...' : 'End Session'}
                </button>
                <p className="mt-3 text-xs text-center text-gray-500">
                  Checkout still uses the existing backend flow and records actual usage time automatically.
                </p>
              </>
            )}
          </section>

          <aside className="p-6 bg-white shadow-lg rounded-3xl">
            <h2 className="text-xl font-bold text-slate-900">Booking QR</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use this QR for check-in verification. It does not bypass validation; the venue scanner submits it through the current backend check-in flow.
            </p>

            {booking.qrCodeImage ? (
              <div className="p-4 mt-5 border border-slate-200 rounded-3xl bg-slate-50">
                <img
                  src={booking.qrCodeImage}
                  alt="Booking QR code"
                  className="w-full max-w-[280px] mx-auto bg-white border border-slate-200 rounded-2xl"
                />
              </div>
            ) : (
              <div className="p-4 mt-5 border border-amber-200 rounded-2xl bg-amber-50">
                <p className="text-sm font-semibold text-amber-900">QR not available yet</p>
                <p className="mt-1 text-sm text-amber-800">
                  QR verification becomes available once the booking is approved.
                </p>
              </div>
            )}

            <div className="p-4 mt-5 border border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-slate-500">Verification Notes</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>Show this QR to an admin at the venue.</li>
                <li>Check-in is allowed from 15 minutes before start time until the booking end time.</li>
                <li>After successful verification, this page will show your checked-in state.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default QRCheckIn;
