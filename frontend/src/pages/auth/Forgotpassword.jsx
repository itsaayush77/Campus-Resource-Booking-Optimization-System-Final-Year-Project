import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as forgotPasswordApi } from '../../api/authApi';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await forgotPasswordApi(email);

      if (data.success) {
        toast.success('Reset token generated! Check below.');
        setResetToken(data.resetToken);
      } else {
        toast.error(data.message || 'Failed to generate reset token');
      }
    } catch (error) {
      toast.error('Request failed. Please try again.');
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-3xl font-bold text-center text-gray-900">
          Forgot Password
        </h2>
        <p className="mb-8 text-center text-gray-600">
          Enter your email to receive a password reset token
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Get Reset Token'}
          </button>
        </form>

        {resetToken && (
          <div className="p-4 mt-6 border border-green-200 rounded-lg bg-green-50">
            <p className="mb-2 text-sm font-medium text-green-800">Reset Token:</p>
            <p className="p-2 font-mono text-xs text-green-700 break-all bg-white rounded">
              {resetToken}
            </p>
            <Link
              to={`/reset-password/${resetToken}`}
              className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-500"
            >
              Click here to reset password →
            </Link>
          </div>
        )}

        <p className="mt-6 text-sm text-center text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;