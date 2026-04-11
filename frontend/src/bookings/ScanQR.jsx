import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkInBooking } from '../api/bookingApi';
import BackButton from '../components/BackButton';
import { signalAppDataChanged } from '../utils/dataSync';
import { LuZap } from 'react-icons/lu';

const ScanQR = () => {
  const [checkingIn, setCheckingIn] = useState(false);
  const [result, setResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const navigate = useNavigate();

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error('Please enter a booking token');
      return;
    }

    const parts = manualInput.trim().split('|');
    if (parts.length === 2) {
      await processCheckIn(parts[0], manualInput.trim());
    } else {
      toast.error('Invalid token format. Expected: bookingId|token');
    }
  };

  const processCheckIn = async (bookingId, token) => {
    setCheckingIn(true);

    try {
      const data = await checkInBooking(bookingId, token);

      if (data.success) {
        setResult({
          success: true,
          action: data.action || 'checked-in',
          message: data.message,
          duration: data.actualUsageDuration,
          booking: data.booking
        });

        toast.success(data.message || 'Check-in successful!');
        signalAppDataChanged('bookings');
      } else {
        const message =
          data.statusCode === 403
            ? 'This token is not from your booking account. Open My Bookings and use your own booking token/QR.'
            : data.message || 'Check-in failed';
        toast.error(message);
        setResult({
          success: false,
          message
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Error during check-in. Please try again.');
      setResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    }

    setCheckingIn(false);
    setManualInput('');
  };

  const handleReset = () => {
    setResult(null);
    setManualInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <BackButton />

        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <LuZap className="text-3xl text-blue-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Check In / Check Out
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Enter your booking token to check in or check out
          </p>

          {/* Result Display */}
          {result && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p
                className={`font-semibold ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.success
                  ? result.action === 'checked-in'
                    ? '✓ Checked In!'
                    : '✓ Checked Out!'
                  : '✗ Error'}
              </p>
              <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </p>
              {result.duration && (
                <p className="text-green-700 font-semibold mt-2">
                  Duration: {result.duration} minutes
                </p>
              )}
              <button
                onClick={handleReset}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Submit Another Token
              </button>
              <button
                onClick={() => navigate('/my-bookings')}
                className="mt-2 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Back to Bookings
              </button>
            </div>
          )}

          {/* Token Input Form */}
          {!result && (
            <>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Booking Token
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g., 507f191e810c19729de860ea|a1b2c3d4e5f6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    disabled={checkingIn}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Format: bookingId|token (shown in your booking details)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={checkingIn || !manualInput.trim()}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
                >
                  {checkingIn ? 'Processing...' : 'Submit Token'}
                </button>
              </form>
            </>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>How it works:</strong>
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Copy your booking token from the booking details/QR section</li>
              <li>• Paste token in the format: bookingId|token</li>
              <li>• Submit once to check in, and submit again later to check out</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
