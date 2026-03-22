import api from "./api";

const formatError = (error, fallbackMessage) => {
  console.log(error);
  return {
    success: false,
    message: error?.response?.data?.message || fallbackMessage,
    data: error?.response?.data?.data || null,
  };
};

export const getAllBookings = async (status) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const query = params.toString();
    const url = query ? `/admin/bookings?${query}` : "/admin/bookings";
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch all bookings");
  }
};

export const approveBooking = async (bookingId) => {
  try {
    const response = await api.patch(`/admin/bookings/${bookingId}/approve`);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to approve booking");
  }
};

export const rejectBooking = async (bookingId, reason) => {
  try {
    const response = await api.patch(`/admin/bookings/${bookingId}/reject`, { reason });
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to reject booking");
  }
};

export const markNoShow = async (bookingId) => {
  try {
    const response = await api.patch(`/admin/bookings/${bookingId}/mark-no-show`);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to mark booking as no-show");
  }
};

export const getAllUsers = async () => {
  try {
    const response = await api.get("/admin/users");
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch users");
  }
};

export const toggleUserActive = async (userId) => {
  try {
    const response = await api.patch(`/admin/users/${userId}/toggle-active`);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to toggle user active status");
  }
};

export const suspendUser = async (userId, days, reason) => {
  try {
    const response = await api.patch(`/admin/users/${userId}/suspend`, {
      days,
      reason,
    });
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to suspend user");
  }
};

export const unsuspendUser = async (userId) => {
  try {
    const response = await api.patch(`/admin/users/${userId}/unsuspend`);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to unsuspend user");
  }
};

export const createResource = async (resourceData) => {
  try {
    const response = await api.post("/resources", resourceData);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to create resource");
  }
};

export const updateResource = async (resourceId, resourceData) => {
  try {
    const response = await api.put(`/resources/${resourceId}`, resourceData);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to update resource");
  }
};

export const toggleResourceActive = async (resourceId) => {
  try {
    const response = await api.patch(`/resources/${resourceId}/toggle`);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to toggle resource active status");
  }
};
