import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-6 text-5xl font-bold text-gray-900 md:text-6xl">
            Campus Resource Booking
            <span className="text-primary"> Made Simple</span>
          </h1>
          <p className="max-w-3xl mx-auto mb-8 text-xl text-gray-600">
            Say goodbye to manual scheduling and double bookings. CampusBook provides a centralized platform 
            for booking classrooms, labs, sports facilities, and equipment in real-time.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="px-8 py-4 text-lg font-semibold text-white transition duration-200 rounded-lg shadow-lg bg-primary hover:bg-blue-700"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 text-lg font-semibold transition duration-200 bg-white border-2 rounded-lg shadow-lg text-primary hover:bg-gray-50 border-primary"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 className="mb-12 text-3xl font-bold text-center text-gray-900">
          Why Choose CampusBook?
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <FeatureCard
            icon="📅"
            title="Real-Time Availability"
            description="View and book resources instantly with live availability updates."
          />
          <FeatureCard
            icon="🔒"
            title="Automated Conflict Detection"
            description="Eliminate double bookings with intelligent scheduling algorithms."
          />
          <FeatureCard
            icon="📊"
            title="Usage Analytics"
            description="Gain insights into resource utilization and optimize allocation."
          />
          <FeatureCard
            icon="📱"
            title="QR Check-In"
            description="Verify bookings and reduce no-shows with QR code scanning."
          />
          <FeatureCard
            icon="✉️"
            title="Instant Notifications"
            description="Get email updates for booking confirmations and reminders."
          />
          <FeatureCard
            icon="👥"
            title="Role-Based Access"
            description="Secure access for students, staff, and administrators."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-white bg-primary">
        <div className="max-w-4xl px-4 mx-auto text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Transform Your Campus?</h2>
          <p className="mb-8 text-xl">
            Join institutions using CampusBook to streamline their resource management.
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 text-lg font-semibold transition duration-200 bg-white rounded-lg text-primary hover:bg-gray-100"
          >
            Start Booking Today
          </Link>
        </div>
      </section>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="p-6 transition duration-300 bg-white shadow-md rounded-xl hover:shadow-xl">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

export default Home