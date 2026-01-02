import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8 md:py-28">
        <div className="text-center">
          <div className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
            🎓 Simplify Campus Resource Booking & Management
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight text-gray-900 md:text-7xl">
            Campus Resource Booking
            <span className="block mt-2 text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text">
              Made Simple
            </span>
          </h1>
          <p className="max-w-3xl mx-auto mb-10 text-xl leading-relaxed text-gray-600 md:text-2xl">
            Say goodbye to manual scheduling and double bookings. CampusBook provides a centralized platform 
            for booking classrooms, labs, sports facilities, and equipment in real-time.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="flex items-center px-8 py-4 space-x-2 text-lg font-bold text-white transition-all duration-300 transform shadow-xl group bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-2xl hover:-translate-y-1"
            >
              <span>Get Started</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/resources/study-rooms"
              className="flex items-center px-8 py-4 space-x-2 text-lg font-bold text-blue-600 transition-all duration-300 transform bg-white border-2 border-blue-200 shadow-xl group rounded-xl hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-1"
            >
              <span>Explore Resources</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>

          {/* Stats Section */}
          <div className="grid max-w-4xl grid-cols-2 gap-6 mx-auto mt-16 md:grid-cols-4">
            <StatItem number="500+" label="Active Users" />
            <StatItem number="1000+" label="Bookings/Month" />
            <StatItem number="50+" label="Resources" />
            <StatItem number="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 mx-auto my-12 shadow-2xl max-w-7xl sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm rounded-3xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Why Choose CampusBook?
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Experience seamless resource management with our comprehensive platform
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📅"
            title="Real-Time Availability"
            description="View and book resources instantly with live availability updates and interactive calendars."
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon="🔒"
            title="Automated Conflict Detection"
            description="Eliminate double bookings with intelligent scheduling algorithms and instant validation."
            gradient="from-purple-500 to-pink-500"
          />
          <FeatureCard
            icon="📊"
            title="Usage Analytics"
            description="Gain insights into resource utilization patterns and optimize allocation with data-driven decisions."
            gradient="from-green-500 to-emerald-500"
          />
          <FeatureCard
            icon="📱"
            title="QR Check-In"
            description="Verify bookings and reduce no-shows with seamless QR code scanning technology."
            gradient="from-orange-500 to-red-500"
          />
          <FeatureCard
            icon="✉️"
            title="Instant Notifications"
            description="Get real-time email updates for booking confirmations, reminders, and status changes."
            gradient="from-indigo-500 to-purple-500"
          />
          <FeatureCard
            icon="👥"
            title="Role-Based Access"
            description="Secure and customized access levels for students, staff, and administrators."
            gradient="from-yellow-500 to-orange-500"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Get started in three simple steps
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <StepCard
            number="1"
            title="Browse Resources"
            description="Explore available classrooms, labs, equipment, and facilities with real-time availability."
          />
          <StepCard
            number="2"
            title="Book Your Slot"
            description="Select your preferred time slot, add details, and submit your booking request instantly."
          />
          <StepCard
            number="3"
            title="Get Confirmed"
            description="Receive instant confirmation and QR code for check-in. It's that simple!"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-90"></div>
        <div className="relative max-w-5xl px-4 py-20 mx-auto text-center">
          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">
            Ready to Transform Your Campus?
          </h2>
          <p className="mb-10 text-xl text-blue-100 md:text-2xl">
            Join institutions using CampusBook to streamline their resource management.
          </p>
          <Link
            to="/signup"
            className="inline-block px-10 py-5 text-xl font-bold text-blue-600 transition-all duration-300 transform bg-white shadow-2xl rounded-xl hover:bg-gray-100 hover:shadow-3xl hover:-translate-y-1"
          >
            Start Booking Today
          </Link>
        </div>
      </section>
    </div>
  )
}

const StatItem = ({ number, label }) => {
  return (
    <div className="text-center">
      <div className="mb-2 text-3xl font-bold text-blue-600 md:text-4xl">{number}</div>
      <div className="text-sm font-medium text-gray-600 md:text-base">{label}</div>
    </div>
  )
}

const FeatureCard = ({ icon, title, description, gradient }) => {
  return (
    <div className="p-8 transition-all duration-300 transform bg-white border border-gray-100 shadow-lg group rounded-2xl hover:shadow-2xl hover:-translate-y-2">
      <div className={`inline-block p-4 bg-gradient-to-r ${gradient} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="mb-3 text-2xl font-bold text-gray-900">{title}</h3>
      <p className="leading-relaxed text-gray-600">{description}</p>
    </div>
  )
}

const StepCard = ({ number, title, description }) => {
  return (
    <div className="relative">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center w-16 h-16 mb-6 text-2xl font-bold text-white rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600">
          {number}
        </div>
        <h3 className="mb-3 text-2xl font-bold text-gray-900">{title}</h3>
        <p className="leading-relaxed text-gray-600">{description}</p>
      </div>
    </div>
  )
}

export default Home