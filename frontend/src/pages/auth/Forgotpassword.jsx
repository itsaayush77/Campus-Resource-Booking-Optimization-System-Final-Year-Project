import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as forgotPasswordApi } from '../../api/authApi';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await forgotPasswordApi(email);

      if (data.success) {
        toast.success(data.message || 'If an account exists, a reset link has been sent.');
        setDevResetUrl(data.devResetUrl || '');
        setEmailPreviewUrl(data.emailPreviewUrl || '');
      } else {
        toast.error(data.message || 'Failed to process password reset request');
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
          Enter your email to receive a password reset link
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
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {devResetUrl && (
          <div className="p-4 mt-6 border border-amber-200 rounded-lg bg-amber-50">
            <p className="mb-2 text-sm font-medium text-amber-800">Development Reset Link:</p>
            <a
              href={devResetUrl}
              className="inline-block text-sm text-blue-600 break-all hover:text-blue-500"
            >
              {devResetUrl}
            </a>
          </div>
        )}

        {emailPreviewUrl && (
          <div className="p-4 mt-4 border border-blue-200 rounded-lg bg-blue-50">
            <p className="mb-2 text-sm font-medium text-blue-800">Email Preview (Dev):</p>
            <a
              href={emailPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 break-all hover:text-blue-500"
            >
              Open preview inbox message
            </a>
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