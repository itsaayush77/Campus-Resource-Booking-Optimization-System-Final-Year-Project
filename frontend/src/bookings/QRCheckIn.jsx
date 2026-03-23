import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkInBooking, getBookingById } from '../api/bookingApi';

const QRCheckIn = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [done, setDone] = useState(false);

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

  const handleCheckIn = async () => {
    if (!booking?.qrCode) {
      toast.error('No QR token on this booking. It may not be approved yet.');
      return;
    }
    setCheckingIn(true);
    const data = await checkInBooking(booking._id, booking.qrCode);
    setCheckingIn(false);
    if (data.success) {
      toast.success(data.message || 'Checked in!');
      setDone(true);
      setBooking(data.booking || booking);
    } else {
      toast.error(data.message || 'Check-in failed');
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
      <div className="px-4 py-16 mx-auto max-w-lg text-center">
        <p className="text-gray-600">Booking not found.</p>
        <Link to="/my-bookings" className="inline-block mt-4 font-medium text-blue-600">
          ← My bookings
        </Link>
      </div>
    );
  }

  if (done || booking.status === 'completed') {
    return (
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="px-4 mx-auto max-w-md text-center">
          <div className="p-8 bg-white shadow-lg rounded-2xl">
            <div className="flex justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <span className="self-center text-3xl text-green-600">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Checked in</h1>
            <p className="mt-2 text-gray-600">{resourceName}</p>
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
      <div className="px-4 mx-auto max-w-lg">
        <Link to="/my-bookings" className="text-sm font-medium text-blue-600 hover:text-blue-800">
          ← My bookings
        </Link>

        <div className="p-6 mt-4 bg-white shadow-lg rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-900">Check in</h1>
          <p className="mt-1 text-gray-600">{resourceName}</p>
          <p className="mt-2 text-sm text-gray-500">
            {new Date(booking.startTime).toLocaleString()} —{' '}
            {new Date(booking.endTime).toLocaleString()}
          </p>

          {booking.qrCodeImage ? (
            <img
              src={booking.qrCodeImage}
              alt="Check-in QR"
              className="w-full max-w-[280px] mx-auto mt-6 border border-gray-200 rounded-lg"
            />
          ) : (
            <p className="mt-6 text-sm text-amber-700 bg-amber-50 rounded-lg p-4">
              QR code is not available yet. Your booking must be approved by an admin first.
            </p>
          )}

          <button
            type="button"
            disabled={
              checkingIn ||
              booking.status !== 'approved' ||
              !booking.qrCode
            }
            onClick={handleCheckIn}
            className="w-full py-3 mt-6 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {checkingIn ? 'Checking in…' : 'Check in now'}
          </button>
          <p className="mt-3 text-xs text-center text-gray-500">
            Check-in opens 15 minutes before the start time and closes at the end time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCheckIn;
