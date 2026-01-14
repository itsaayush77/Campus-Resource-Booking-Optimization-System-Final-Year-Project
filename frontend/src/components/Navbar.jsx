import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    setIsLoggedIn(false)
    navigate('/')
  }

  const scrollToTop = () => {
    if (location.pathname !== '/') {
      navigate('/')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  const scrollToHowItWorks = () => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const element = document.getElementById('how-it-works')
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      const element = document.getElementById('how-it-works')
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setIsMobileMenuOpen(false)
  }

  const resourceTypes = [
    { name: 'Study Rooms', icon: '📚', path: '/resources/study-rooms' },
    { name: 'Labs', icon: '🔬', path: '/resources/labs' },
    { name: 'Equipment', icon: '💻', path: '/resources/equipment' },
    { name: 'Meeting Rooms', icon: '🏢', path: '/resources/meeting-rooms' },
    { name: 'Sports Facilities', icon: '⚽', path: '/resources/sports' },
    { name: 'Auditoriums', icon: '🎭', path: '/resources/auditoriums' }
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-blue-100 shadow-lg">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={scrollToTop} className="flex items-center space-x-3 group">
            <div className="flex items-center justify-center transition-all duration-300 shadow-md w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 group-hover:shadow-lg group-hover:scale-105">
              <span className="text-xl font-bold text-white">CB</span>
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              CampusBook
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="items-center hidden space-x-1 md:flex">
            <button
              onClick={scrollToTop}
              className="px-4 py-2 font-medium text-gray-700 transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
            >
              Home
            </button>

            {/* Resources Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsResourcesOpen(true)}
              onMouseLeave={() => setIsResourcesOpen(false)}
            >
              <button
                className="flex items-center px-4 py-2 space-x-1 font-medium text-gray-700 transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
              >
                <span>Resources</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isResourcesOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isResourcesOpen && (
                <div className="absolute left-0 w-64 py-2 mt-2 bg-white border border-gray-100 shadow-2xl top-full rounded-xl animate-fadeIn">
                  <Link
                    to="/browse-resources"
                    className="flex items-center px-4 py-3 space-x-3 transition duration-200 hover:bg-blue-50 group"
                  >
                    <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                      🔍
                    </span>
                    <div>
                      <span className="font-semibold text-gray-700 group-hover:text-blue-600">
                        Browse All
                      </span>
                      <p className="text-xs text-gray-500">View all resources</p>
                    </div>
                  </Link>
                  <hr className="my-2 border-gray-100" />
                  {resourceTypes.map((resource, index) => (
                    <Link
                      key={index}
                      to={resource.path}
                      className="flex items-center px-4 py-3 space-x-3 transition duration-200 hover:bg-blue-50 group"
                    >
                      <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                        {resource.icon}
                      </span>
                      <span className="font-medium text-gray-700 group-hover:text-blue-600">
                        {resource.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={scrollToHowItWorks}
              className="px-4 py-2 font-medium text-gray-700 transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
            >
              How It Works
            </button>
          </div>

          {/* Auth Buttons */}
          <div className="items-center hidden space-x-3 md:flex">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 font-semibold text-gray-700 transition duration-200 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="px-5 py-2 font-semibold text-gray-700 transition duration-200 hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 transition duration-200 rounded-lg md:hidden hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="py-4 border-t border-gray-100 md:hidden">
            <button
              onClick={scrollToTop}
              className="block w-full px-4 py-2 text-left text-gray-700 rounded-lg hover:bg-blue-50"
            >
              Home
            </button>
            <div className="px-4 py-2">
              <button
                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                className="flex items-center justify-between w-full font-medium text-left text-gray-700"
              >
                Resources
                <svg 
                  className={`w-4 h-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isResourcesOpen && (
                <div className="mt-2 ml-4 space-y-1">
                  <Link
                    to="/browse-resources"
                    className="flex items-center px-3 py-2 space-x-2 text-gray-600 rounded-lg hover:bg-blue-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>🔍</span>
                    <span>Browse All</span>
                  </Link>
                  {resourceTypes.map((resource, index) => (
                    <Link
                      key={index}
                      to={resource.path}
                      className="flex items-center px-3 py-2 space-x-2 text-gray-600 rounded-lg hover:bg-blue-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{resource.icon}</span>
                      <span>{resource.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={scrollToHowItWorks}
              className="block w-full px-4 py-2 text-left text-gray-700 rounded-lg hover:bg-blue-50"
            >
              How It Works
            </button>
            {!isLoggedIn ? (
              <>
                <Link 
                  to="/login" 
                  className="block px-4 py-2 mt-2 text-gray-700 rounded-lg hover:bg-blue-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="block px-4 py-2 mx-4 mt-2 text-center text-white bg-blue-600 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-4 py-2 mt-2 text-gray-700 rounded-lg hover:bg-blue-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="block w-full px-4 py-2 mx-4 mt-2 text-white bg-red-500 rounded-lg"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar