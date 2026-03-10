import api from "./api";

const formatError = (error, fallbackMessage) => {
  console.log(error);
  return {
    success: false,
    message: error?.response?.data?.message || fallbackMessage,
    data: error?.response?.data?.data || null,
  };
};

export const getAllNotifications = async () => {
  try {
    const response = await api.get("/notifications");
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch notifications");
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to mark notification as read");
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to mark all notifications as read");
  }
};
