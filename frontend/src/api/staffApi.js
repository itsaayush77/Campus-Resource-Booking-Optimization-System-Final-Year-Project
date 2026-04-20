import api from './api';

const API_URL = '/staff';

const staffApi = {
  // Get staff-visible bookings for review and monitoring
  getStaffReviewBookings: async (status = 'all') => {
    const response = await api.get(`${API_URL}/bookings/review`, {
      params: { status },
    });
    return response;
  },

  // Get pending bookings (read-only view for staff)
  getStaffPendingBookings: async () => {
    const response = await api.get(`${API_URL}/bookings/pending`);
    return response;
  },

  // Save a staff recommendation note for admin review
  submitBookingReview: async (bookingId, payload) => {
    const response = await api.patch(`${API_URL}/bookings/${bookingId}/review`, payload);
    return response;
  },

  // Get analytics for system overview
  getStaffAnalytics: async () => {
    const response = await api.get(`${API_URL}/analytics`);
    return response;
  },

  // Get resources assigned to staff
  getStaffResources: async () => {
    const response = await api.get(`${API_URL}/resources`);
    return response;
  },
};

export default staffApi;
