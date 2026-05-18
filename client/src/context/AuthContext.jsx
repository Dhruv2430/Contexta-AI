import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Auth Provider — wraps the entire app
//
// State:
//   user    → { id, name, email } or null
//   token   → JWT string or null
//   loading → true while validating stored token on mount
//
// Actions:
//   signup(name, email, password) → registers, stores token, sets user
//   login(email, password)       → authenticates, stores token, sets user
//   logout()                     → clears everything, redirects to /login
// ---------------------------------------------------------------------------
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState("");
  const navigate = useNavigate();

  // --- Logout (memoized so it can be used in effects) ---
  const logout = useCallback((message = "") => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    if (message) {
      setSessionExpiredMsg(message);
    }
    navigate("/login");
  }, [navigate]);

  // On mount: validate stored token by calling GET /api/auth/me
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        setToken(storedToken);
      } catch {
        // Token is invalid or expired — clean up
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Listen for auth:expired events from the API interceptor
  useEffect(() => {
    const handleExpired = (e) => {
      logout(e.detail?.message || "Your session has expired. Please log in again.");
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [logout]);

  // --- Signup ---
  const signup = async (name, email, password) => {
    const { data } = await api.post("/auth/signup", {
      name,
      email,
      password,
    });

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    navigate("/dashboard");

    return data;
  };

  // --- Login ---
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setSessionExpiredMsg(""); // Clear any prior expiry message
    navigate("/dashboard");

    return data;
  };

  // --- Clear session message (called by login page after displaying it) ---
  const clearSessionMessage = useCallback(() => {
    setSessionExpiredMsg("");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signup,
        login,
        logout,
        isAuthenticated: !!user,
        sessionExpiredMsg,
        clearSessionMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
