import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";

// Pages - Public
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/Forgotpassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Pages - User
import Dashboard from "./user/Dashboard";
import Profile from "./user/Profile";
import Notifications from "./user/Notifications";
import NotFound from "./user/NotFound";
import Unauthorized from "./user/Unauthorized";

// Pages - Resources
import BrowseResources from "./pages/resources/BrowseResources";
import ResourceDetails from "./pages/resources/ResourceDetails";
import ResourcesList from "./pages/resources/ResourcesList";
import BookingForm from "./pages/resources/BookingForm";
import BookingStatus from "./pages/resources/BookingStatus";

// Pages - Bookings
import MyBookings from "./bookings/MyBookings";
import BookingHistory from "./bookings/BookingHistory";
import QRCheckIn from "./bookings/QRCheckIn";

// Pages - Admin
import AdminDashboard from "./admin/AdminDashboard";
import ResourceManagement from "./admin/ResourceManagement";
import BookingApprovals from "./admin/BookingApprovals";
import NoShowManagement from "./admin/NoShowManagement";
import Analytics from "./admin/Analytics";
import { useAuth } from "./context/AuthContext";


function App() {
  const { user, loading } = useAuth();
  const rootElement = loading
    ? null
    : user
      ? <Navigate to={String(user.role || "").toLowerCase() === "admin" ? "/admin/dashboard" : "/dashboard"} replace />
      : <Home />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={rootElement} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <BrowseResources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources/:type"
            element={
              <ProtectedRoute>
                <ResourcesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resource/:id"
            element={
              <ProtectedRoute>
                <ResourceDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book/:resourceId"
            element={
              <ProtectedRoute>
                <BookingForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-status"
            element={
              <ProtectedRoute>
                <BookingStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-history"
            element={
              <ProtectedRoute>
                <BookingHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qr-checkin/:bookingId"
            element={
              <ProtectedRoute>
                <QRCheckIn />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Navigate to="/admin/dashboard" replace />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <AdminRoute>
                <ResourceManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <AdminRoute>
                <BookingApprovals />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/no-shows"
            element={
              <AdminRoute>
                <NoShowManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <Analytics />
              </AdminRoute>
            }
          />

          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
            marginTop: "60px",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}

export default App;
