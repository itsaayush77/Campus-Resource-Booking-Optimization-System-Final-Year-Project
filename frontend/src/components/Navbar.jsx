import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <span className="text-xl font-bold text-white">CB</span>
            </div>
            <span className="text-xl font-bold text-gray-800">CampusBook</span>
          </Link>

          {/* Navigation Links */}
          <div className="items-center hidden space-x-8 md:flex">
            <Link to="/" className="text-gray-700 transition duration-200 hover:text-primary">
              Home
            </Link>
            <Link to="/resources" className="text-gray-700 transition duration-200 hover:text-primary">
              Resources
            </Link>
            <Link to="/about" className="text-gray-700 transition duration-200 hover:text-primary">
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="font-medium text-gray-700 transition duration-200 hover:text-primary"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 text-white transition duration-200 rounded-lg bg-primary hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="font-medium text-gray-700 transition duration-200 hover:text-primary"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 text-white transition duration-200 bg-red-500 rounded-lg hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar