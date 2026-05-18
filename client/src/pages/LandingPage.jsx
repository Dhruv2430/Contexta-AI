import { Link } from "react-router-dom";
import { Bot, Database, GitBranch, BarChart3, Rocket, Activity, ArrowRight, Shield, Zap, Globe } from "lucide-react";

const features = [
  { icon: Bot, title: "AI Agents", desc: "Deploy autonomous AI agents that handle complex customer queries with human-like contextual understanding and reasoning." },
  { icon: Database, title: "Vector Database", desc: "Blazing-fast semantic search across millions of documents with sub-millisecond retrieval and automatic indexing." },
  { icon: GitBranch, title: "RAG Pipeline", desc: "Retrieval-Augmented Generation ensures every response is grounded in your verified, up-to-date knowledge base." },
  { icon: BarChart3, title: "Analytics", desc: "Real-time dashboards tracking resolution rates, customer sentiment, agent performance, and operational metrics." },
  { icon: Rocket, title: "Deployments", desc: "One-click deployment to production with zero-downtime rolling updates and automatic rollback capabilities." },
  { icon: Activity, title: "Monitoring", desc: "End-to-end observability with latency tracking, token usage monitoring, and intelligent anomaly detection." },
];

const pipelineSteps = ["User Input", "Embeddings", "Vector Search", "LLM", "Response"];

const stats = [
  { value: "2.4M+", label: "AI Requests / Day" },
  { value: "12ms", label: "Avg Latency" },
  { value: "150+", label: "Active Models" },
  { value: "99.9%", label: "Uptime SLA" },
];

const LandingPage = () => (
  <div className="min-h-screen bg-white text-base-900">
    {/* ── Navbar ── */}
    <header className="glass-nav sticky top-0 z-50">
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 lg:px-8 h-16">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-400 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Nexus AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {["Product", "Solutions", "Pricing", "Docs"].map((l) => (
              <a key={l} href="#" className="text-sm text-base-500 hover:text-base-900 transition-colors duration-300">{l}</a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-base-500 hover:text-base-900 transition-colors duration-300">Sign In</Link>
          <Link to="/signup" className="px-5 py-2 bg-accent-400 text-white rounded-xl text-sm font-semibold hover:bg-accent-500 accent-glow-sm hover:accent-glow transition-all duration-300">
            Start Building
          </Link>
        </div>
      </nav>
    </header>

    <main>
      {/* ── Hero ── */}
      <section className="relative pt-20 pb-24 px-6 lg:px-8 grid-bg overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="max-w-xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-200 bg-accent-50 text-xs text-accent-600 font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
              v4.0 — Now with Multi-Agent Orchestration
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              Build AI Systems{" "}
              <span className="text-accent-400">That Scale.</span>
            </h1>
            <p className="text-lg text-base-500 leading-relaxed mb-8 max-w-lg">
              Enterprise AI infrastructure for modern engineering teams. Deploy, monitor, and scale AI agents with RAG-powered intelligence.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link to="/signup" className="group inline-flex items-center gap-2 px-6 py-3 bg-accent-400 text-white rounded-2xl font-semibold hover:bg-accent-500 accent-glow transition-all duration-300">
                Start Free Trial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <button className="px-6 py-3 rounded-2xl font-semibold border border-base-200 text-base-600 hover:border-accent-400 hover:text-accent-500 transition-all duration-300 cursor-pointer">
                View Docs
              </button>
            </div>
            <div className="flex items-center gap-6 text-sm text-base-400">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-accent-400" /> SOC2 Certified</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-green-400" /> 99.9% Uptime</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-accent-400" /> Global Edge</span>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative animate-slide-up hidden lg:block" style={{ animationDelay: "0.2s" }}>
            <div className="absolute -inset-8 bg-gradient-to-br from-accent-400/10 to-green-400/5 rounded-3xl blur-2xl pointer-events-none" />
            <div className="card rounded-2xl p-4 relative animate-float">
              <div className="bg-base-50 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-base-800">AI Agent Dashboard</span>
                  <span className="text-xs text-green-500 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Live</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[{ v: "1,247", l: "Requests" }, { v: "8ms", l: "Latency" }, { v: "98.7%", l: "Accuracy" }].map((m) => (
                    <div key={m.l} className="bg-white rounded-lg p-3 text-center border border-base-100">
                      <p className="text-base font-bold text-accent-500">{m.v}</p>
                      <p className="text-[11px] text-base-400 mt-1">{m.l}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg p-4 border border-base-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-base-500 font-medium">Request Volume</span>
                    <span className="text-xs text-accent-500 font-medium">Last 24h</span>
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 50, 72, 92, 68, 78, 85, 95, 82].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-accent-100 hover:bg-accent-400 transition-colors duration-300" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 lg:px-8 bg-base-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Enterprise-Ready Infrastructure</h2>
            <p className="text-base text-base-500 leading-relaxed">Everything you need to build, deploy, and scale AI-powered products.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title} className="card rounded-2xl p-6 group hover:border-accent-400/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="w-11 h-11 rounded-xl bg-accent-50 flex items-center justify-center mb-5 group-hover:bg-accent-100 transition-colors duration-300">
                  <f.icon className="w-5 h-5 text-accent-500" />
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-base-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Intelligent RAG Pipeline</h2>
            <p className="text-base text-base-500 leading-relaxed">From user query to AI response — every step optimized for accuracy and speed.</p>
          </div>
          <div className="flex items-center justify-center gap-0 flex-wrap md:flex-nowrap">
            {pipelineSteps.map((step, i) => (
              <div key={step} className="flex items-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex flex-col items-center gap-3 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent-50 border border-accent-200/60 flex items-center justify-center animate-pulse-glow">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-400" />
                  </div>
                  <span className="text-xs font-medium text-base-600 whitespace-nowrap">{step}</span>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <div className="w-12 h-px bg-gradient-to-r from-accent-300 to-accent-100 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-24 px-6 lg:px-8 bg-base-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="card rounded-2xl p-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={s.label} className="text-center animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <p className="text-4xl lg:text-5xl font-extrabold text-accent-500 tracking-tight">{s.value}</p>
                <p className="text-sm text-base-500 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-base-900 rounded-3xl py-16 px-8 lg:px-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-400/10 to-green-400/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to build the future?</h2>
            <p className="text-base text-base-400 mb-8 max-w-md mx-auto leading-relaxed">Join 500+ engineering teams shipping AI-powered products with Nexus AI.</p>
            <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent-400 text-white rounded-2xl font-bold hover:bg-accent-500 accent-glow transition-all duration-300">
              Start Your Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>

    {/* ── Footer ── */}
    <footer className="border-t border-base-100 bg-base-50/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-accent-400 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
              <span className="text-base font-bold">Nexus AI</span>
            </div>
            <p className="text-sm text-base-400 max-w-xs leading-relaxed">Enterprise AI infrastructure for modern engineering teams.</p>
            <div className="flex items-center gap-2 mt-5 text-xs text-green-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> All systems operational
            </div>
          </div>
          {[
            { t: "Product", l: ["Features", "Pricing", "Security", "Changelog"] },
            { t: "Developers", l: ["Docs", "API Reference", "SDKs", "Status"] },
            { t: "Company", l: ["About", "Careers", "Blog", "Contact"] },
          ].map((col) => (
            <div key={col.t}>
              <h4 className="text-sm font-semibold mb-4 text-base-700">{col.t}</h4>
              <ul className="space-y-2.5">
                {col.l.map((l) => (<li key={l}><a href="#" className="text-sm text-base-400 hover:text-accent-500 transition-colors duration-300">{l}</a></li>))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t border-base-200 gap-4">
          <span className="text-xs text-base-400">© 2026 Nexus AI. All rights reserved.</span>
          <div className="flex gap-6 text-xs text-base-400">
            {["Privacy", "Terms", "Security", "Cookies"].map((l) => (<a key={l} href="#" className="hover:text-accent-500 transition-colors duration-300">{l}</a>))}
          </div>
        </div>
      </div>
    </footer>
  </div>
);

export default LandingPage;
