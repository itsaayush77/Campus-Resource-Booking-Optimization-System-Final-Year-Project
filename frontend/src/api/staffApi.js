import axios from './axios';

const API_URL = '/api/staff';

const staffApi = {
  // Get pending bookings (read-only view for staff)
  getStaffPendingBookings: async () => {
    const response = await axios.get(`${API_URL}/bookings/pending`);
    return response;
  },

  // Get analytics for system overview
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
