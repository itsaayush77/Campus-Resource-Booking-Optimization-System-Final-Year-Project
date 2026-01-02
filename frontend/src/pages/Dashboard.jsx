const Dashboard = () => {
  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <StatCard title="My Bookings" value="5" icon="📅" />
          <StatCard title="Pending Approvals" value="2" icon="⏳" />
          <StatCard title="Completed" value="12" icon="✅" />
        </div>

        <div className="p-6 bg-white shadow-md rounded-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Recent Bookings</h2>
          <p className="text-gray-600">Your booking history will appear here.</p>
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

export default Dashboard