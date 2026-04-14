import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkInBooking, checkOutBooking, getBookingById } from '../api/bookingApi';
import BackButton from '../components/BackButton';
import { signalAppDataChanged } from '../utils/dataSync';
import { LuCheck, LuLogOut } from 'react-icons/lu';

const QRCheckIn = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  useEffect(() => {
    if (!bookingId) return undefined;

    let cancelled = false;

    (async () => {
      const data = await getBookingById(bookingId);
      if (cancelled) return;

      if (data.success && data.booking) {
        setBooking(data.booking);
      } else {
        toast.error(data.message || 'Booking not found');
        setBooking(null);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const resourceName =
    booking && typeof booking.resourceId === 'object'
      ? booking.resourceId.name
      : 'Resource';

  // Check if user is already checked in but not checked out
  const isCheckedIn = booking?.checkInTime && !booking?.checkOutTime;

  // Handle check-in with QR code
  const handleCheckIn = async () => {
    if (!booking?.qrCode) {
      toast.error('No QR code available. Your booking must be approved by an admin first.');
      return;
    }

    setProcessing(true);
    const data = await checkInBooking(booking._id, booking.qrCode);
    setProcessing(false);

    if (data.success) {
      toast.success('✓ Checked in successfully! Use the resource and click "End Session" when done.');
      setLastAction('checked-in');
      setBooking(data.booking);
      signalAppDataChanged('bookings');
    } else {
      toast.error(data.message || 'Check-in failed');
    }
  };

  // Handle check-out (manual button - no QR needed)
  const handleCheckOut = async () => {
    setProcessing(true);
    const data = await checkOutBooking(booking._id);
    setProcessing(false);

    if (data.success) {
      toast.success(`✓ Session ended! Usage: ${data.actualUsageDuration} minutes.`);
      setLastAction('checked-out');
      setDone(true);
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

  // Completion screen
  if (done || booking.status === 'completed') {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="max-w-md px-4 mx-auto text-center">
          <div className="p-8 bg-white shadow-lg rounded-2xl">
            <div className="flex justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <span className="self-center text-3xl text-green-600">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Session Completed!</h1>
            <p className="mt-2 text-gray-600">{resourceName}</p>
            {booking.actualUsageDuration && (
              <p className="mt-3 text-lg font-semibold text-blue-600">
                Duration: {booking.actualUsageDuration} minutes
              </p>
            )}
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
      <div className="max-w-lg px-4 mx-auto">
        <BackButton label="My bookings" to="/my-bookings" />

        <div className="p-6 mt-4 bg-white shadow-lg rounded-2xl">
          {/* Not checked in yet - show QR code */}
          {!isCheckedIn && (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Check In</h1>
              <p className="mt-1 text-gray-600">{resourceName}</p>
              <p className="mt-2 text-sm text-gray-500">
                {new Date(booking.startTime).toLocaleString()} to {new Date(booking.endTime).toLocaleString()}
              </p>

              {booking.qrCodeImage ? (
                <>
                  <div className="p-4 mt-6 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <p className="text-sm font-semibold text-blue-900">📱 Scan the QR code below</p>
                    <p className="text-xs text-blue-700 mt-1">Use your phone's camera to scan this code</p>
                  </div>
                  <img
                    src={booking.qrCodeImage}
                    alt="Check-in QR"
                    className="w-full max-w-[280px] mx-auto mt-6 border border-gray-200 rounded-lg"
                  />
                </>
              ) : (
                <div className="p-4 mt-6 text-sm rounded-lg text-amber-700 bg-amber-50">
                  ⚠️ QR code is not available yet. Your booking must be approved by an admin first.
                </div>
              )}

              <button
                type="button"
                disabled={processing || booking.status !== 'approved' || !booking.qrCode}
                onClick={handleCheckIn}
                className="w-full py-3 mt-6 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <LuCheck size={20} />
                {processing ? 'Checking in...' : 'Confirm Check-in'}
              </button>
              <p className="mt-3 text-xs text-center text-gray-500">
                Check-in is allowed from 15 minutes before start time until the end time.
              </p>
            </>
          )}

          {/* Already checked in - show end session button */}
          {isCheckedIn && (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Session In Progress</h1>
              <p className="mt-1 text-gray-600">{resourceName}</p>

              <div className="p-4 mt-6 border-2 border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-600 animate-pulse"></span>
                  <p className="font-semibold text-green-900">You are checked in</p>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Checked in at: {new Date(booking.checkInTime).toLocaleTimeString()}
                </p>
              </div>

              <button
                type="button"
                disabled={processing}
                onClick={handleCheckOut}
                className="w-full py-3 mt-8 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <LuLogOut size={20} />
                {processing ? 'Ending session...' : 'End Session'}
              </button>
              <p className="mt-3 text-xs text-center text-gray-500">
                Click when you are done using the resource. Usage time will be recorded automatically.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCheckIn;
