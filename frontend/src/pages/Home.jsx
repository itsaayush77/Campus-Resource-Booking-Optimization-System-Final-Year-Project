import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

const Home = () => {
  const location = useLocation()

  useEffect(() => {
    // Handle scroll to section when hash is present in URL
    if (location.hash === '#how-it-works') {
      setTimeout(() => {
        const element = document.getElementById('how-it-works')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
    // Only scroll to top on initial mount, not on every location change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash])

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
              className="flex items-center px-8 py-4 space-x-2 text-lg font-bold text-white transition-shadow duration-200 shadow-xl group bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-2xl"
              style={{ willChange: 'box-shadow', transform: 'translateZ(0)' }}
            >
              <span>Get Started</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/resources/study-rooms"
              className="flex items-center px-8 py-4 space-x-2 text-lg font-bold text-blue-600 transition-shadow duration-200 bg-white border-2 border-blue-200 shadow-xl group rounded-xl hover:bg-gray-50 hover:shadow-2xl"
              style={{ willChange: 'box-shadow', transform: 'translateZ(0)' }}
            >
              <span>Explore Resources</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 mx-auto my-12 bg-white shadow-2xl max-w-7xl sm:px-6 lg:px-8 rounded-3xl">
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
      <section id="how-it-works" className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mb-16 text-center">
          <div className="inline-block px-4 py-2 mb-4 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
            Simple & Easy
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            How It Works
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Get started in three simple steps. Book your campus resources in minutes, not hours.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <StepCard
            number="1"
            icon="🔍"
            title="Browse Resources"
            description="Explore available classrooms, labs, equipment, and facilities with real-time availability. Filter by category, capacity, or search by name."
            gradient="from-blue-500 to-cyan-500"
          />
          <StepCard
            number="2"
            icon="📅"
            title="Book Your Slot"
            description="Select your preferred date and time slot, add booking details, and submit your request instantly. Get instant availability confirmation."
            gradient="from-purple-500 to-pink-500"
          />
          <StepCard
            number="3"
            icon="✅"
            title="Get Confirmed"
            description="Receive instant confirmation email with booking details and a unique QR code for easy check-in. Manage all your bookings from your dashboard."
            gradient="from-green-500 to-emerald-500"
          />
        </div>
        
        {/* Additional Info */}
        <div className="p-8 mt-16 border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 text-2xl bg-white rounded-full shadow-md">
                ⚡
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Instant Booking</h3>
              <p className="text-sm text-gray-600">No waiting, no approval delays</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 text-2xl bg-white rounded-full shadow-md">
                🔔
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Smart Reminders</h3>
              <p className="text-sm text-gray-600">Never miss your booking time</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 mb-3 text-2xl bg-white rounded-full shadow-md">
                📊
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Track History</h3>
              <p className="text-sm text-gray-600">View all your past bookings</p>
            </div>
          </div>
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
            className="inline-block px-10 py-5 text-xl font-bold text-blue-600 transition-shadow duration-200 bg-white shadow-2xl rounded-xl hover:bg-gray-100 hover:shadow-3xl"
            style={{ willChange: 'box-shadow', transform: 'translateZ(0)' }}
          >
            Start Booking Today
          </Link>
        </div>
      </section>
    </div>
  )
}

const FeatureCard = ({ icon, title, description, gradient }) => {
  return (
    <div className="p-8 transition-shadow duration-200 bg-white border border-gray-100 shadow-lg group rounded-2xl hover:shadow-2xl" style={{ willChange: 'box-shadow', transform: 'translateZ(0)' }}>
      <div className={`inline-block p-4 bg-gradient-to-r ${gradient} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-200`} style={{ willChange: 'transform' }}>
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="mb-3 text-2xl font-bold text-gray-900">{title}</h3>
      <p className="leading-relaxed text-gray-600">{description}</p>
    </div>
  )
}

const StepCard = ({ number, icon, title, description, gradient }) => {
  return (
    <div className="relative p-8 transition-shadow duration-200 bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl group" style={{ willChange: 'box-shadow', transform: 'translateZ(0)' }}>
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className={`flex items-center justify-center w-20 h-20 text-3xl bg-gradient-to-r ${gradient} rounded-full shadow-lg group-hover:scale-110 transition-transform duration-200`} style={{ willChange: 'transform' }}>
            <span>{icon}</span>
          </div>
          <div className="absolute flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-gray-800 rounded-full -top-2 -right-2">
            {number}
          </div>
        </div>
        <h3 className="mb-3 text-2xl font-bold text-gray-900">{title}</h3>
        <p className="leading-relaxed text-gray-600">{description}</p>
      </div>
    </div>
  )
}

export default Home