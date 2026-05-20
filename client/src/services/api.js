import axios from "axios";

// ---------------------------------------------------------------------------
// Centralised Axios instance
// - Base URL configurable via env var (no more hardcoded localhost)
// - Request interceptor auto-attaches JWT from localStorage
// - Response interceptor dispatches auth expiry event on 401
// - No global Content-Type — lets axios auto-detect (crucial for FormData)
// ---------------------------------------------------------------------------
const getBaseUrl = () => {
  // If running locally in a browser, connect to the local backend on port 5001
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]"
  ) {
    return "http://localhost:5001/api";
  }

  let envUrl = import.meta.env.VITE_API_URL || "";
  
  // Strip trailing slashes
  envUrl = envUrl.trim().replace(/\/+$/, "");

  if (envUrl) {
    if (envUrl.endsWith("/api")) {
      return envUrl;
    }
    return `${envUrl}/api`;
  }
  
  // In production, fallback to relative API prefix
  return "/api";
};

const api = axios.create({
  baseURL: getBaseUrl()
});

// Attach token to every outgoing request (if it exists)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally — dispatch auth expiry event
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      // Dispatch event so AuthContext can react (redirect + notification)
      window.dispatchEvent(new CustomEvent("auth:expired", {
        detail: { message: error.response.data?.message || "Session expired" },
      }));
    }
    return Promise.reject(error);
  }
);

export default api;
