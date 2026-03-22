import api from "./api";

const formatError = (error, fallbackMessage) => {
  console.error(error);
  if (!error?.response) {
    const isNetwork =
      error?.code === "ERR_NETWORK" ||
      error?.message === "Network Error";
    return {
      success: false,
      message: isNetwork
        ? "Cannot reach the API. Run the backend on port 5000 (cd backend && npm run dev) with MongoDB up. If it still fails, set VITE_API_URL in frontend/.env to your API base URL."
        : fallbackMessage,
      data: null,
    };
  }

  const status = error.response.status;
  const raw = error.response.data;
  let message =
    typeof raw === "object" && raw !== null && raw.message
      ? raw.message
      : null;

  if (!message && (status === 502 || status === 503 || status === 504)) {
    message =
      "API proxy/gateway error — the dev server could not reach the backend. Use http://127.0.0.1:5000 for the API, confirm PORT in backend/.env, and restart both servers.";
  }

  return {
    success: false,
    message: message || fallbackMessage,
    data: typeof raw === "object" && raw !== null ? raw.data ?? null : null,
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
