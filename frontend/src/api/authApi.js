import api from "./api";

const formatError = (error, fallbackMessage) => {
  console.error(error);
  return {
    success: false,
    message: error?.response?.data?.message || fallbackMessage,
    data: error?.response?.data?.data || null,
  };
};

export const register = async (data) => {
  try {
    const response = await api.post("/auth/register", data);
    return response.data;
  } catch (error) {
    return formatError(error, "Registration failed");
  }
};

export const login = async (data) => {
  try {
    const response = await api.post("/auth/login", data);
    return response.data;
  } catch (error) {
    return formatError(error, "Login failed");
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to fetch user data");
  }
};

export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    return response.data;
  } catch (error) {
    return formatError(error, "Logout failed");
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to send password reset email");
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post(`/auth/reset-password/${token}`, { newPassword });
    return response.data;
  } catch (error) {
    return formatError(error, "Failed to reset password");
  }
};
