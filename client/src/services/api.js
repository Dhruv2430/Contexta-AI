import axios from "axios";

// ---------------------------------------------------------------------------
// Centralised Axios instance
// - Base URL configurable via env var (no more hardcoded localhost)
// - Request interceptor auto-attaches JWT from localStorage
// - Response interceptor dispatches auth expiry event on 401
// - No global Content-Type — lets axios auto-detect (crucial for FormData)
// ---------------------------------------------------------------------------
const getBaseUrl = () => {
  let envUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

  const hostname = window.location.hostname;
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    hostname.endsWith(".local");

  // In local development environment or local hostname, use local backend on port 5001 unless env explicitly specifies a non-render local URL
  if (isLocalHost) {
    if (envUrl && !envUrl.includes("onrender.com") && !envUrl.includes("vercel.app")) {
      return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
    }
    const host = hostname === "localhost" || hostname.endsWith(".local") ? "localhost" : hostname;
    return `http://${host}:5001/api`;
  }

  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }

  // In production, fallback to relative API prefix
  return "/api";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 40000, // 40s timeout to gracefully accommodate Render cold starts
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
