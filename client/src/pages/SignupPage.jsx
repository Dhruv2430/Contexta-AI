import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { Bot, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Zap, BarChart3, Sparkles } from "lucide-react";

const highlights = [
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "End-to-end encryption with per-user document isolation and secure JWT auth.",
  },
  {
    icon: Zap,
    title: "Instant RAG Pipeline",
    desc: "Upload a PDF and start asking questions in seconds with automatic FAISS indexing.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Track chat activity, document processing, and source usage metrics live.",
  },
];

const SignupPage = () => {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      await signup(formData.name, formData.email, formData.password);
    } catch (err) {
      console.error("Signup request failed:", err);
      if (!err.response) {
        setError(
          `Could not connect to the API server at ${api.defaults.baseURL}. Please verify your network.`
        );
      } else {
        setError(err.response.data?.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "input-field w-full pl-10 pr-4 py-2.5 text-xs font-medium placeholder-slate-400";

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 relative overflow-hidden">
      {/* Left Dark Branding Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between px-16 py-16 bg-gradient-to-b from-slate-900 via-slate-900 to-forest-950 text-white relative overflow-hidden border-r border-slate-800">
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="Contexta-AI Logo" className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-forest-900/50" />
          <span className="text-xl font-bold tracking-tight font-display">Contexta-AI</span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/80 border border-forest-700/50 text-forest-200 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-forest-400" />
            Get Started Free
          </div>
          <h2 className="text-3xl font-extrabold leading-tight font-display tracking-tight text-white">
            Start building <span className="text-forest-400">AI-powered knowledge bases</span> in minutes.
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed font-medium">
            Deploy intelligent RAG agents that understand your internal documentation better than anyone.
          </p>

          <div className="space-y-3 pt-2">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex gap-3.5 items-start text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-forest-600/30 border border-forest-500/40 flex items-center justify-center shrink-0 text-forest-400">
                  <h.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white mb-0.5">{h.title}</h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 font-semibold border-t border-slate-800/80 pt-4">
          Free 14-day evaluation • No credit card required
        </div>
      </div>

      {/* Right Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-forest-600 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold text-slate-900 font-display">Contexta-AI</span>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
              Create your account
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Start building your knowledge engine for free
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className={inputCls}
                />
              </div>
            </div>

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
                  placeholder="you@company.com"
                  className={inputCls}
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
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={inputCls}
                />
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
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 font-medium pt-2">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-forest-600 hover:text-forest-700 font-bold transition-colors no-underline"
            >
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
