import api from "./api";

const formatError = (error, fallbackMessage) => {
  console.log(error);
  return {
    success: false,
    message: error?.response?.data?.message || fallbackMessage,
    data: error?.response?.data?.data || null,
  };
};

export const createBooking = async (bookingData) => {
  try {
    const response = await api.post("/bookings", bookingData);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to create booking");
  }
};

export const getMyBookings = async () => {
  try {
    const response = await api.get("/bookings/my");
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch active bookings");
  }
};

export const getBookingHistory = async () => {
  try {
    const response = await api.get("/bookings/my/history");
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch booking history");
  }
};

export const getBookingById = async (bookingId) => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch booking");
  }
};

export const cancelBooking = async (bookingId, reason) => {
  try {
    const response = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to cancel booking");
  }
};

export const checkInBooking = async (bookingId, token) => {
  try {
    const response = await api.post(`/bookings/${bookingId}/check-in`, { token });
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to check in booking");
  }
};
