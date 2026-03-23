import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import ForgotPassword from '../pages/auth/Forgotpassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Public Pages
import Home from '../pages/Home';

// Resource Pages
import BrowseResources from '../pages/resources/BrowseResources';
import ResourcesList from '../pages/resources/ResourcesList';
import ResourceDetails from '../pages/resources/ResourceDetails';
import BookingForm from '../pages/resources/BookingForm';

// Booking Pages
import MyBookings from '../bookings/MyBookings';
import BookingHistory from '../bookings/BookingHistory';
import QRCheckIn from '../bookings/QRCheckIn';

// User Pages
import Dashboard from '../user/Dashboard';
import Profile from '../user/Profile';
import Notifications from '../user/Notifications';
import NotFound from '../user/NotFound';
import Unauthorized from '../user/Unauthorized';

// Admin Pages
import AdminDashboard from '../admin/AdminDashboard';
import BookingApprovals from '../admin/BookingApprovals';
import ResourceManagement from '../admin/ResourceManagement';
import Analytics from '../admin/Analytics';
import NoShowManagement from '../admin/NoShowManagement';

const Router = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Resource Routes (Public) */}
              <Route path="/resources" element={<BrowseResources />} />
              <Route path="/resources/:type" element={<ResourcesList />} />
              <Route path="/resources/:id" element={<ResourceDetails />} />

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
                path="/book/:resourceId" 
                element={
                  <ProtectedRoute>
                    <BookingForm />
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
                path="/check-in/:bookingId" 
                element={
                  <ProtectedRoute>
                    <QRCheckIn />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Admin Routes */}
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
                path="/admin/approvals" 
                element={
                  <AdminRoute>
                    <BookingApprovals />
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
                path="/admin/analytics" 
                element={
                  <AdminRoute>
                    <Analytics />
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

              {/* Error Routes */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Router;
