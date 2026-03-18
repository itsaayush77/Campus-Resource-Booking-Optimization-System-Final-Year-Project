import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resetPassword as resetPasswordApi } from '../../api/authApi';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);

    try {
      const data = await resetPasswordApi(token, formData.newPassword);

      if (data.success) {
        toast.success('Password reset successful! Please login.');
        navigate('/login');
      } else {
        toast.error(data.message || 'Password reset failed');
      }
    } catch (error) {
      toast.error('Request failed. Please try again.');
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-3xl font-bold text-center text-gray-900">
          Reset Password
        </h2>
        <p className="mb-8 text-center text-gray-600">
          Enter your new password
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              required
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

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

export default ResetPassword;