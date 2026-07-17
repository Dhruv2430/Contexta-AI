import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
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
          `Could not connect to the API server at ${api.defaults.baseURL}. Please verify your Vercel VITE_API_URL environment variable is set to your Render URL and that you have triggered a new Vercel deployment/rebuild.`
        );
      } else {
        setError(err.response.data?.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

    const inputCls = "input-field w-full pl-10 pr-4 py-2.5 text-sm placeholder-slate-400 font-medium";

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left — Dark branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-12 py-16 bg-slate-100 border-r border-slate-200/60 relative overflow-hidden">
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center shadow-md shadow-forest-100"><Bot className="w-4.5 h-4.5 text-white stroke-[2]" /></div>
            <span className="text-lg font-bold text-slate-900 font-display">Contexta-AI</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-3 font-display">
            Start building <span className="text-forest-600">AI-powered support</span> in minutes.
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm font-medium">
            Deploy intelligent agents that understand your product better than anyone.
          </p>
          <div className="space-y-3.5">
            {highlights.map((h) => (
              <div key={h.title} className="card bg-white border border-slate-200/60 p-4 shadow-sm flex gap-4 items-start hover:border-forest-150">
                <div className="w-9 h-9 rounded-lg bg-forest-50 border border-forest-100 flex items-center justify-center shrink-0 text-forest-600">
                  <h.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{h.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Signup form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center shadow-md shadow-forest-100"><Bot className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-bold text-slate-900 font-display">Contexta-AI</span>
          </div>

          <h1 className="text-xl font-bold mb-1 text-slate-900 font-display">Create your account</h1>
          <p className="text-sm text-slate-500 mb-8 font-medium">Get started for free. No credit card required.</p>

          {error && <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-650 text-red-600 text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="name" type="text" required autoComplete="name" value={formData.name} onChange={handleChange} placeholder="Jane Doe" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="password" type={showPw ? "text" : "password"} required autoComplete="new-password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters"
                  className="input-field w-full pl-10 pr-10 py-2.5 text-sm placeholder-slate-400 font-medium" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-0 bg-transparent">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input name="confirmPassword" type="password" required autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputCls} />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="btn-forest w-full py-2.5 text-sm shadow-md shadow-forest-100">
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8 font-medium">Already have an account?{" "}<Link to="/login" className="text-forest-600 hover:text-forest-700 font-semibold transition-colors no-underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
