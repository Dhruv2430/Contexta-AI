import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
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

  // Show session expiry message if redirected from expired session
  useEffect(() => {
    if (sessionExpiredMsg) {
      setError(sessionExpiredMsg);
      clearSessionMessage();
    }
  }, [sessionExpiredMsg, clearSessionMessage]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      console.error("Login request failed:", err);
      if (!err.response) {
        setError(
          "Could not connect to the API server. Please ensure the backend server is running locally on http://localhost:5001 or check your network status."
        );
      } else {
        setError(err.response.data?.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Dark branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-12 py-16 bg-base-900 relative overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-3 h-3 rounded-full bg-accent-400/20 animate-float" />
        <div className="absolute bottom-[20%] right-[15%] w-2 h-2 rounded-full bg-green-400/20 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[55%] left-[60%] w-4 h-4 rounded-full bg-accent-400/10 animate-float" style={{ animationDelay: "4s" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-accent-400/5 via-transparent to-green-400/5 pointer-events-none" />

        <div className="relative z-10 max-w-sm text-center space-y-8">
          <div className="flex items-center justify-center gap-8 mb-6">
            <Cpu className="w-10 h-10 text-accent-400/25" />
            <div className="w-20 h-20 rounded-2xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center animate-pulse-glow">
              <Bot className="w-10 h-10 text-accent-400" />
            </div>
            <Network className="w-10 h-10 text-accent-400/25" />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            Welcome back to <span className="text-accent-400">Contexta-AI</span>
          </h2>
          <p className="text-base-400 text-sm leading-relaxed max-w-xs mx-auto">
            Access your AI infrastructure dashboard. Monitor agents, manage deployments, and scale with confidence.
          </p>
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-accent-400 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-bold">Contexta-AI</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Sign in</h1>
          <p className="text-sm text-base-500 mb-8">Enter your credentials to access your dashboard</p>

          {error && <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-base-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                <input name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-50 border border-base-200 text-base-900 text-sm placeholder-base-400 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all duration-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-base-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                <input name="password" type={showPw ? "text" : "password"} required autoComplete="current-password" value={formData.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-base-50 border border-base-200 text-base-900 text-sm placeholder-base-400 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all duration-300" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-400 hover:text-base-600 transition-colors cursor-pointer">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-accent-400 text-white hover:bg-accent-500 accent-glow-sm hover:accent-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-base-400 mt-8">Don&apos;t have an account?{" "}<Link to="/signup" className="text-accent-500 hover:text-accent-600 font-medium transition-colors">Create one</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
