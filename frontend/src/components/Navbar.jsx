import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const isStaff = String(user?.role || "").toLowerCase() === "staff";
  const roleAvatar = isAdmin ? "/images/admin.png" : isStaff ? "/images/staff.png" : "/images/user.png";
  const dashboardPath = isAdmin ? "/admin/dashboard" : isStaff ? "/staff/dashboard" : "/dashboard";
  const navigate = useNavigate();
  const location = useLocation();
  const resourceDropdownRef = useRef(null);
  const resourcesTimeoutRef = useRef(null);
  const adminTimeoutRef = useRef(null);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    if (user) {
      navigate(dashboardPath);
    } else if (location.pathname !== "/") {
      navigate("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const scrollToHowItWorks = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById("how-it-works");
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      const element = document.getElementById("how-it-works");
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsMobileMenuOpen(false);
  };

  const openResourceMenu = () => {
    if (resourcesTimeoutRef.current) {
      clearTimeout(resourcesTimeoutRef.current);
    }
    setIsResourcesOpen(true);
  };

  const closeResourceMenu = () => {
    resourcesTimeoutRef.current = setTimeout(() => {
      setIsResourcesOpen(false);
    }, 150);
  };

  const openAdminMenu = () => {
    if (adminTimeoutRef.current) {
      clearTimeout(adminTimeoutRef.current);
    }
    setIsAdminMenuOpen(true);
  };

  const closeAdminMenu = () => {
    adminTimeoutRef.current = setTimeout(() => {
      setIsAdminMenuOpen(false);
    }, 150);
  };

  const resourceTypes = [
    { name: "Classrooms", icon: "📚", path: "/resources?category=classroom" },
    { name: "Labs", icon: "🔬", path: "/resources?category=lab" },
    {
      name: "Seminar halls",
      icon: "🏛️",
      path: "/resources?category=seminar_hall",
    },
    { name: "Equipment", icon: "💻", path: "/resources?category=equipment" },
    {
      name: "Sports facilities",
      icon: "⚽",
      path: "/resources?category=sports_facility",
    },
    { name: "Auditoriums", icon: "🎭", path: "/resources?category=auditorium" },
    {
      name: "Library rooms",
      icon: "📖",
      path: "/resources?category=library_room",
    },
  ];

  const adminSections = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Bookings", path: "/admin/approvals" },
    { name: "Resources", path: "/admin/resources" },
    { name: "Users", path: "/admin/users" },
    { name: "Analytics", path: "/admin/analytics" },
    { name: "No-Show Management", path: "/admin/no-shows" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-blue-100 shadow-lg">
      <div className="px-3 mx-auto max-w-[1600px] sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="flex items-center space-x-3 group"
          >
            <div className="flex items-center justify-center transition-all duration-300 shadow-md w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 group-hover:shadow-lg group-hover:scale-105">
              <span className="text-xl font-bold text-white">CB</span>
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              CampusBook
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="items-center hidden space-x-1 md:flex">
            {/* Show landing-page navigation only before login */}
            {!user && (
              <>
                <button
                  onClick={scrollToTop}
                  className="px-4 py-2 font-medium text-gray-700 transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
                >
                  Home
                </button>
              </>
            )}

            {/* Resources Dropdown - Always visible */}
            <div
              className="relative"
              ref={resourceDropdownRef}
              onMouseEnter={openResourceMenu}
              onMouseLeave={closeResourceMenu}
            >
              <button className="flex items-center px-4 py-2 space-x-1 font-medium text-gray-700 transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50">
                <span>Resources</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isResourcesOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown - Fixed gap issue with pt-2 */}
              {isResourcesOpen && (
                <div
                  className="absolute left-0 w-64 bg-white border border-gray-100 shadow-2xl top-full rounded-xl"
                  style={{ paddingTop: "8px" }}
                  onMouseEnter={openResourceMenu}
                  onMouseLeave={closeResourceMenu}
                >
                  <div className="py-2">
                    <Link
                      to="/resources"
                      onClick={() => setIsResourcesOpen(false)}
                      className="flex items-center px-4 py-3 space-x-3 transition duration-200 hover:bg-blue-50 group"
                    >
                      <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
                        🔍
                      </span>
                      <div>
                        <span className="font-semibold text-gray-700 group-hover:text-blue-600">
                          Browse All
                        </span>
                        <p className="text-xs text-gray-500">
                          View all resources
                        </p>
                      </div>
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    {resourceTypes.map((resource, index) => (
                      <Link
                        key={index}
                        to={resource.path}
                        onClick={() => setIsResourcesOpen(false)}
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
                </div>
              )}
            </div>

            {/* Show How It Works only before login */}
            {!user && (
              <button
                onClick={scrollToHowItWorks}
                className="px-4 py-2 font-medium text-gray-700 transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
              >
                How It Works
              </button>
            )}

            {/* Show Dashboard link when logged in */}
            {user && (
              <>
                <Link
                  to={dashboardPath}
                  className={`px-4 py-2 font-medium transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50 ${
                    location.pathname === dashboardPath
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700"
                  }`}
                >
                  Dashboard
                </Link>
                {!isAdmin && (
                  <>
                    <Link
                      to="/my-bookings"
                      className={`px-4 py-2 font-medium transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50 ${
                        location.pathname === "/my-bookings"
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700"
                      }`}
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/notifications"
                      className={`px-4 py-2 font-medium transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50 ${
                        location.pathname === "/notifications"
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700"
                      }`}
                    >
                      Notifications
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <div
                    className="relative"
                    onMouseEnter={openAdminMenu}
                    onMouseLeave={closeAdminMenu}
                  >
                    <button className={`flex items-center px-4 py-2 space-x-1 font-medium transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50 ${
                      location.pathname.startsWith('/admin') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                    }`}>
                      <span>Admin Sections</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isAdminMenuOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isAdminMenuOpen && (
                      <div
                        className="absolute left-0 z-30 w-64 py-2 mt-2 bg-white border border-gray-100 shadow-2xl rounded-xl"
                        onMouseEnter={openAdminMenu}
                        onMouseLeave={closeAdminMenu}
                      >
                        {adminSections.map((section) => (
                          <Link
                            key={section.path}
                            to={section.path}
                            onClick={() => setIsAdminMenuOpen(false)}
                            className={`block px-4 py-2.5 text-sm font-medium transition duration-200 hover:bg-blue-50 ${
                              location.pathname === section.path ? 'text-blue-600' : 'text-gray-700'
                            }`}
                          >
                            {section.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {isStaff && (
                  <Link
                    to="/staff/dashboard"
                    className={`px-4 py-2 font-medium transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50 ${
                      location.pathname === '/staff/dashboard'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700'
                    }`}
                  >
                    Approvals
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="items-center hidden space-x-3 md:flex">
            {!user ? (
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
              <div className="flex items-center space-x-3">
                {/* Added: Notification Bell for desktop navbar */}
                <NotificationBell />

                {/* User Info */}
                <div className="flex items-center px-3 py-1 space-x-2 rounded-lg bg-blue-50">
                  <img
                    src={roleAvatar}
                    alt={`${isAdmin ? "Admin" : "User"} avatar`}
                    className="object-cover w-8 h-8 rounded-full border border-blue-200"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-700">
                      {user.name}
                    </span>
                    <span className="text-xs text-blue-600 capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="px-4 py-2 font-medium text-gray-700 transition duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50"
                >
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-5 py-2 font-semibold text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 transition duration-200 rounded-lg md:hidden hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
{isMobileMenuOpen && (
  <div className="py-4 border-t border-gray-100 md:hidden">
    {/* Show landing-page navigation only before login */}
    {!user && (
      <button
        onClick={scrollToTop}
        className="block w-full px-4 py-2 text-left text-gray-700 rounded-lg hover:bg-blue-50"
      >
        Home
      </button>
    )}

    {/* Mobile Resources Dropdown - Always visible */}
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
            to="/resources"
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

    {/* Show How It Works only before login */}
    {!user && (
      <button
        onClick={scrollToHowItWorks}
        className="block w-full px-4 py-2 text-left text-gray-700 rounded-lg hover:bg-blue-50"
      >
        How It Works
      </button>
    )}

    {user && (
      <>
        <Link
          to={dashboardPath}
          className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Dashboard
        </Link>
        {!isAdmin && (
          <>
            <Link
              to="/my-bookings"
              className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Bookings
            </Link>
            <Link
              to="/notifications"
              className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Notifications
            </Link>
          </>
        )}
        {isAdmin && (
          <div className="px-4 py-2">
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] uppercase text-blue-600">Admin Sections</p>
            <div className="space-y-1">
              {adminSections.map((section) => (
                <Link
                  key={section.path}
                  to={section.path}
                  className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-blue-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {section.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        {isStaff && (
          <div className="px-4 py-2">
            <p className="mb-2 text-xs font-semibold tracking-[0.18em] uppercase text-blue-600">Staff Options</p>
            <div className="space-y-1">
              <Link
                to="/staff/dashboard"
                className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-blue-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Booking Approvals
              </Link>
            </div>
          </div>
        )}
      </>
    )}

            {!user ? (
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
              <div className="px-4 mt-2">
                {/* Added: Notifications link for mobile menu */}
                <Link
                  to="/notifications"
                  className="flex items-center justify-between px-4 py-2 mb-2 text-gray-700 rounded-lg hover:bg-blue-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <span>🔔</span>
                    <span>Notifications</span>
                  </span>
                </Link>

                <div className="flex items-center p-2 mb-3 space-x-2 rounded-lg bg-blue-50">
                  <img
                    src={roleAvatar}
                    alt={`${isAdmin ? "Admin" : "User"} avatar`}
                    className="object-cover w-8 h-8 rounded-full border border-blue-200"
                  />
                  <div>
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-blue-600 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 mt-2 text-left text-white bg-red-500 rounded-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
