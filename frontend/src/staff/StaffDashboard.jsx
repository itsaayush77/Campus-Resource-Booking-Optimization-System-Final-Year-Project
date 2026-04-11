import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuCheck, LuX, LuClock, LuBarChart3 } from 'react-icons/lu';
import axios from '../api/axios';
import staffApi from '../api/staffApi';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import '../admin/AdminDashboard.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [processingBookingId, setProcessingBookingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, analyticsRes] = await Promise.all([
        staffApi.getStaffPendingBookings(),
        staffApi.getStaffAnalytics(),
      ]);

      setPendingBookings(bookingsRes.data.bookings || []);
      setAnalytics(analyticsRes.data.analytics || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      setProcessingBookingId(bookingId);
      await staffApi.approveStaffBooking(bookingId);
      toast.success('Booking approved successfully');
      
      // Remove from pending list and refresh
      setPendingBookings(pendingBookings.filter((b) => b._id !== bookingId));
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving booking:', error);
      toast.error(error.response?.data?.message || 'Failed to approve booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    const reason = rejectReason[bookingId] || '';
    if (!reason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    try {
      setProcessingBookingId(bookingId);
      await staffApi.rejectStaffBooking(bookingId, { reason });
      toast.success('Booking rejected successfully');
      
      // Remove from pending list and refresh
      setPendingBookings(pendingBookings.filter((b) => b._id !== bookingId));
      setRejectReason((prev) => {
        const updated = { ...prev };
        delete updated[bookingId];
        return updated;
      });
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error(error.response?.data?.message || 'Failed to reject booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="dashboard-container">
      {/* Header with Staff Profile */}
      <div className="admin-dashboard-header">
        <div className="profile-section">
          <img src="/images/staff.png" alt="Staff" className="profile-image" />
          <div className="profile-info">
            <h1>Staff Dashboard</h1>
            <p className="subtitle">Manage booking approvals for your assigned resources</p>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="stats-grid">
          <StatCard
            title="Pending Approvals"
            value={analytics.pendingBookings || 0}
            icon={<LuClock size={24} />}
            color="#f59e0b"
          />
          <StatCard
            title="Approved"
            value={analytics.approvedBookings || 0}
            icon={<LuCheck size={24} />}
            color="#10b981"
          />
          <StatCard
            title="Assigned Resources"
            value={analytics.assignedResourceCount || 0}
            icon={<LuBarChart3 size={24} />}
            color="#3b82f6"
          />
          <StatCard
            title="Utilization Rate"
            value={`${analytics.utilizationRate || 0}%`}
            icon={<LuBarChart3 size={24} />}
            color="#8b5cf6"
          />
        </div>
      )}

      {/* Pending Bookings Section */}
      <div className="section-card">
        <h2>Pending Booking Approvals ({pendingBookings.length})</h2>

        {pendingBookings.length === 0 ? (
          <div className="empty-state">
            <p>No pending bookings for your assigned resources</p>
          </div>
        ) : (
          <div className="bookings-list">
            {pendingBookings.map((booking) => (
              <div key={booking._id} className="booking-approval-card">
                <div className="booking-header">
                  <div className="booking-resource">
                    <h3>{booking.resourceId?.name}</h3>
                    <p className="booking-location">{booking.resourceId?.location}</p>
                  </div>
                  <div className="booking-time">
                    <p className="date">{formatDate(booking.startTime)}</p>
                    <p className="time">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                  </div>
                </div>

                <div className="booking-details">
                  <div className="detail-item">
                    <strong>Requested by:</strong>
                    <span>{booking.userId?.name}</span>
                    <span className="email">{booking.userId?.email}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Purpose:</strong>
                    <span>{booking.purpose}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Expected Attendees:</strong>
                    <span>{booking.expectedAttendees}</span>
                  </div>
                  {booking.notes && (
                    <div className="detail-item">
                      <strong>Additional Notes:</strong>
                      <span>{booking.notes}</span>
                    </div>
                  )}
                </div>

                <div className="booking-actions">
                  <div className="action-buttons">
                    <button
                      className="btn btn-approve"
                      onClick={() => handleApprove(booking._id)}
                      disabled={processingBookingId === booking._id}
                    >
                      <LuCheck size={18} />
                      {processingBookingId === booking._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      className="btn btn-reject-toggle"
                      onClick={() => {
                        // Show rejection reason input if not shown
                        const element = document.getElementById(`reject-${booking._id}`);
                        if (element) {
                          element.style.display =
                            element.style.display === 'none' ? 'block' : 'none';
                        }
                      }}
                    >
                      <LuX size={18} />
                      Reject
                    </button>
                  </div>

                  <div
                    id={`reject-${booking._id}`}
                    className="rejection-reason-input"
                    style={{ display: 'none' }}
                  >
                    <textarea
                      placeholder="Enter reason for rejection (required)..."
                      value={rejectReason[booking._id] || ''}
                      onChange={(e) =>
                        setRejectReason((prev) => ({
                          ...prev,
                          [booking._id]: e.target.value,
                        }))
                      }
                      className="reason-textarea"
                    />
                    <div className="rejection-action-buttons">
                      <button
                        className="btn btn-confirm-reject"
                        onClick={() => handleReject(booking._id)}
                        disabled={
                          processingBookingId === booking._id ||
                          !rejectReason[booking._id]?.trim()
                        }
                      >
                        Confirm Rejection
                      </button>
                      <button
                        className="btn btn-cancel-reject"
                        onClick={() => {
                          const element = document.getElementById(`reject-${booking._id}`);
                          if (element) element.style.display = 'none';
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
