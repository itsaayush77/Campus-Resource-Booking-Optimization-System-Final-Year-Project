import axios from "axios";
import { clearStoredAuth, getStoredToken } from "../utils/authStorage";

// Dev: use IPv4 loopback — on Windows, "localhost" often hits ::1 while Express listens on IPv4,
// which causes Axios "Network Error" or Vite proxy 502 + useless HTML bodies.
// Override with VITE_API_URL if your API runs elsewhere.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://127.0.0.1:5000/api"
    : "/api");

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (String(config.method || "").toLowerCase() === "get") {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
      config.headers.Pragma = "no-cache";
      config.headers.Expires = "0";
      config.params = {
        ...(config.params || {}),
        _ts: Date.now(),
      };
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredAuth();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
