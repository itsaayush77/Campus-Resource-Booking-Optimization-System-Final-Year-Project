import axios from './axios';

const API_URL = '/api/staff';

const staffApi = {
  // Get pending bookings for staff's assigned resources
  getStaffPendingBookings: async () => {
    const response = await axios.get(`${API_URL}/bookings/pending`);
    return response;
  },

  // Approve a booking (staff can only approve for assigned resources)
  approveStaffBooking: async (bookingId) => {
    const response = await axios.patch(`${API_URL}/bookings/${bookingId}/approve`);
    return response;
  },

  // Reject a booking (staff can only reject for assigned resources)
  rejectStaffBooking: async (bookingId, data) => {
    const response = await axios.patch(`${API_URL}/bookings/${bookingId}/reject`, data);
    return response;
  },

  // Get analytics for staff's assigned resources only
  getStaffAnalytics: async () => {
    const response = await axios.get(`${API_URL}/analytics`);
    return response;
  },

  // Get resources assigned to staff
  getStaffResources: async () => {
    const response = await axios.get(`${API_URL}/resources`);
    return response;
  },
};

export default staffApi;
