import axios from "axios";

// ---------------------------------------------------------------------------
// Centralised Axios instance
// - Base URL configurable via env var (no more hardcoded localhost)
// - Request interceptor auto-attaches JWT from localStorage
// - Response interceptor dispatches auth expiry event on 401
// - No global Content-Type — lets axios auto-detect (crucial for FormData)
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
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
