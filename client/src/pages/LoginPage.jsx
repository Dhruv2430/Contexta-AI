import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight, Cpu, Network, Sparkles, ShieldCheck } from "lucide-react";

const LoginPage = () => {
  const { login, sessionExpiredMsg, clearSessionMessage } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const displayError = error || sessionExpiredMsg;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
    if (sessionExpiredMsg) clearSessionMessage();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sessionExpiredMsg) clearSessionMessage();
    setError("");
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      console.error("Login request failed:", err);
      if (!err.response) {
        setError(
          `Could not connect to the API server at ${api.defaults.baseURL}. If running locally, ensure backend is running on port 5001. If using Render, free instances may take up to 60 seconds to spin up.`
        );
      } else {
        setError(err.response.data?.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Background Ambient Mesh */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-forest-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between px-16 py-16 bg-gradient-to-b from-slate-900 via-slate-900 to-forest-950 text-white relative overflow-hidden border-r border-slate-800">
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="Contexta-AI Logo" className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-forest-900/50" />
          <span className="text-xl font-bold tracking-tight font-display">Contexta-AI</span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-900/80 border border-forest-700/50 text-forest-200 text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-forest-400" />
            Enterprise Vector Infrastructure
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl font-extrabold leading-tight font-display tracking-tight text-white"
          >
            Empower your platform with intelligent document retrieval.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-sm leading-relaxed font-medium"
          >
            Seamlessly chunk PDFs, query FAISS indices, embed AI widgets, and monitor performance in real-time.
          </motion.p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-slate-400 font-semibold border-t border-slate-800/80 pt-6">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> SOC2 Compliant Security
          </span>
          <span>•</span>
          <span>Gemini 1.5 Flash Powered</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center shadow-md text-white">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 font-display">Contexta-AI</span>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
              Sign in to Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Enter your registered credentials to access your control panel
            </p>
          </div>

          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
            >
              {displayError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="input-field w-full pl-10 pr-4 py-2.5 text-xs font-medium placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field w-full pl-10 pr-10 py-2.5 text-xs font-medium placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-forest w-full py-3 text-xs font-bold shadow-md shadow-forest-200"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 font-medium pt-2">
            Don&apos;t have an account yet?{" "}
            <Link
              to="/signup"
              className="text-forest-600 hover:text-forest-700 font-bold transition-colors no-underline"
            >
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
