import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Bot, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";

// ---------------------------------------------------------------------------
// SignupPage
//
// FIXES:
// - Removed fake Google/GitHub OAuth buttons
// ---------------------------------------------------------------------------

const highlights = [
  { icon: Shield, title: "Enterprise Security", desc: "End-to-end encryption with per-user document isolation and secure JWT auth." },
  { icon: Zap, title: "Instant RAG Pipeline", desc: "Upload a PDF and start asking questions in seconds with automatic indexing." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track chat activity, document processing, and source usage in real-time." },
];

const SignupPage = () => {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
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
          "Could not connect to the API server. Please ensure the backend server is running locally on http://localhost:5001 or check your network status."
        );
      } else {
        setError(err.response.data?.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-50 border border-base-200 text-base-900 text-sm placeholder-base-400 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all duration-300";

  return (
    <div className="min-h-screen flex">
      {/* Left — Dark branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 py-16 bg-base-900 relative overflow-hidden">
        <div className="absolute top-[12%] right-[8%] w-3 h-3 rounded-full bg-accent-400/15 animate-float" />
        <div className="absolute bottom-[18%] left-[12%] w-2 h-2 rounded-full bg-green-400/15 animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-accent-400/5 via-transparent to-green-400/5 pointer-events-none" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-accent-400 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-bold text-white">Contexta-AI</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Start building <span className="text-accent-400">AI-powered support</span> in minutes.
          </h2>
          <p className="text-base-400 text-sm leading-relaxed mb-10 max-w-sm">
            Deploy intelligent agents that understand your product better than anyone.
          </p>
          <div className="space-y-4">
            {highlights.map((h, i) => (
              <div key={h.title} className="flex gap-4 items-start bg-white/5 border border-white/10 rounded-xl p-4 animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-9 h-9 rounded-lg bg-accent-400/10 flex items-center justify-center shrink-0">
                  <h.icon className="w-4 h-4 text-accent-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white mb-0.5">{h.title}</h3>
                  <p className="text-xs text-base-400 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Signup form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-accent-400 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-bold">Contexta-AI</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-sm text-base-500 mb-8">Get started for free. No credit card required.</p>

          {error && <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                <input name="name" type="text" required autoComplete="name" value={formData.name} onChange={handleChange} placeholder="Jane Doe" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-base-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                <input name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-base-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                <input name="password" type={showPw ? "text" : "password"} required autoComplete="new-password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-base-50 border border-base-200 text-base-900 text-sm placeholder-base-400 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all duration-300" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-400 hover:text-base-600 transition-colors cursor-pointer">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-base-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                <input name="confirmPassword" type="password" required autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputCls} />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-accent-400 text-white hover:bg-accent-500 accent-glow-sm hover:accent-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-base-400 mt-8">Already have an account?{" "}<Link to="/login" className="text-accent-500 hover:text-accent-600 font-medium transition-colors">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
