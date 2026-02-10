import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">
          Welcome, {user?.name}!
        </h1>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold">Active Bookings</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold">Pending Approval</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-600">0</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold">Completed</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;