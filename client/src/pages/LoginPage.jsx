import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight, Cpu, Network } from "lucide-react";

// ---------------------------------------------------------------------------
// LoginPage
//
// FIXES:
// - Removed fake Google/GitHub OAuth buttons (no backend implementation)
// - Removed "Remember me" checkbox (not implemented)
// - Removed "Forgot password?" link (not implemented)
// - Added session expiry message display
// ---------------------------------------------------------------------------

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
          `Could not connect to the API server at ${api.defaults.baseURL}. Please verify your Vercel VITE_API_URL environment variable is set to your Render URL and that you have triggered a new Vercel deployment/rebuild.`
        );
      } else {
        setError(err.response.data?.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left — Dark branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-12 py-16 bg-slate-100 border-r border-slate-200/60 relative overflow-hidden">
        <div className="relative z-10 max-w-sm text-center space-y-6">
          <div className="flex items-center justify-center gap-6 mb-6">
            <Cpu className="w-8 h-8 text-slate-400" />
            <div className="w-16 h-16 rounded-xl bg-forest-600 border border-forest-700 flex items-center justify-center shadow-lg shadow-forest-200">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <Network className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 leading-tight font-display">
            Welcome back to <span className="text-forest-600">Contexta-AI</span>
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto font-medium">
            Access your AI infrastructure dashboard. Monitor agents, manage deployments, and scale with confidence.
          </p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center shadow-md shadow-forest-100"><Bot className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-bold text-slate-900 font-display">Contexta-AI</span>
          </div>

          <h1 className="text-xl font-bold mb-1 text-slate-900 font-display">Sign in</h1>
          <p className="text-sm text-slate-500 mb-8 font-medium">Enter your credentials to access your dashboard</p>

          {displayError && <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-650 text-red-600 text-sm font-medium">{displayError}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange}
                  placeholder="you@company.com"
                  className="input-field w-full pl-10 pr-4 py-2.5 text-sm placeholder-slate-400 font-medium" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="password" type={showPw ? "text" : "password"} required autoComplete="current-password" value={formData.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field w-full pl-10 pr-10 py-2.5 text-sm placeholder-slate-400 font-medium" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-0 bg-transparent">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="btn-forest w-full py-2.5 text-sm shadow-md shadow-forest-100">
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8 font-medium">Don&apos;t have an account?{" "}<Link to="/signup" className="text-forest-600 hover:text-forest-700 font-semibold transition-colors no-underline">Create one</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
