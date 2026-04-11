import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuClock, LuBarChart3, LuInfo } from 'react-icons/lu';
import staffApi from '../api/staffApi';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import '../admin/AdminDashboard.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);

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
      {/* Header */}
      <div className="admin-dashboard-header">
        <div className="profile-section">
          <img src="/images/staff.png" alt="Staff" className="profile-image" />
          <div className="profile-info">
            <h1>Staff Dashboard</h1>
            <p className="subtitle">View pending bookings and system analytics</p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="alert alert-info" style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#e0f2fe',
        border: '1px solid #0284c7',
        borderRadius: '6px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start'
      }}>
        <LuInfo size={20} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ margin: 0, color: '#0c4a6e', fontWeight: 500 }}>
            Booking approvals are now handled by administrators only.
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#0c4a6e', fontSize: '0.9em' }}>
            Admins can approve or reject pending bookings. Staff members can view pending bookings for reference.
          </p>
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
            icon={<LuBarChart3 size={24} />}
            color="#10b981"
          />
          <StatCard
            title="Rejected"
            value={analytics.rejectedBookings || 0}
            icon={<LuBarChart3 size={24} />}
            color="#ef4444"
          />
          <StatCard
            title="Utilization Rate"
            value={`${analytics.utilizationRate || 0}%`}
            icon={<LuBarChart3 size={24} />}
            color="#8b5cf6"
          />
        </div>
      )}

      {/* Pending Bookings Section - Read Only View */}
      <div className="section-card">
        <h2>Pending Bookings ({pendingBookings.length})</h2>

        {pendingBookings.length === 0 ? (
          <div className="empty-state">
            <p>No pending bookings at the moment</p>
          </div>
        ) : (
          <div className="bookings-list">
            {pendingBookings.map((booking) => (
              <div key={booking._id} className="booking-approval-card" style={{ opacity: 0.9 }}>
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

                <div style={{
                  padding: '15px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  fontSize: '0.9em',
                  color: '#6b7280',
                  marginTop: '15px'
                }}>
                  <p style={{ margin: 0 }}>
                    ℹ️ Approval/Rejection actions are available only to administrators.
                  </p>
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
