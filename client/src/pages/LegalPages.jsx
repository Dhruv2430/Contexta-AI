import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  FileText,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Sparkles,
  Server,
  Key,
} from "lucide-react";

// --- Shared Layout for Legal Pages ---
const LegalShell = ({ title, subtitle, icon: Icon, lastUpdated, children }) => {
  const location = useLocation();

  const navLinks = [
    { label: "Privacy Policy", path: "/privacy", icon: Lock },
    { label: "Terms of Service", path: "/terms", icon: FileText },
    { label: "Security Statement", path: "/security", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-forest-100 selection:text-forest-900 overflow-x-hidden relative bg-arch-grid">
      {/* Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-forest-100/50 via-slate-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/70">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <img src="/logo.png" alt="Contexta-AI Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform" />
            <span className="text-lg font-bold tracking-tight text-slate-900 font-display">Contexta-AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="btn-secondary px-3.5 py-1.5 text-xs font-semibold no-underline flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <Link to="/signup" className="btn-forest px-4 py-1.5 text-xs font-bold no-underline">
              Start Free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-12 pb-8 px-6 max-w-7xl mx-auto text-left relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-800 text-xs font-bold">
              <Icon className="w-4 h-4 text-forest-600" />
              <span>Legal &amp; Trust Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              {title}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl font-medium">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium shrink-0">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Effective Date: {lastUpdated || "July 28, 2026"}</span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-6 pb-20 relative z-10 grid lg:grid-cols-12 gap-8 text-left">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-2">
          <div className="sticky top-24 card p-4 bg-white border border-slate-200/80 shadow-xs space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">Legal Documents</p>
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all no-underline ${
                    isActive
                      ? "bg-forest-50 text-forest-800 border border-forest-100/80 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <ItemIcon className={`w-4 h-4 ${isActive ? "text-forest-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Content Body */}
        <article className="lg:col-span-9 card p-8 sm:p-10 bg-white border border-slate-200/80 shadow-xs space-y-8 leading-relaxed text-sm text-slate-600 font-medium">
          {children}
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Contexta-AI Inc. Enterprise PDF Vector Engine. All rights reserved.</p>
          <div className="flex items-center gap-6 font-semibold">
            <Link to="/privacy" className="hover:text-forest-600 no-underline">Privacy</Link>
            <Link to="/terms" className="hover:text-forest-600 no-underline">Terms</Link>
            <Link to="/security" className="hover:text-forest-600 no-underline">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ── 1. PRIVACY POLICY PAGE ──
export const PrivacyPolicyPage = () => (
  <LegalShell
    title="Privacy Policy"
    subtitle="Learn how Contexta-AI collects, uses, isolates, and protects your uploaded knowledge base documents and account telemetry."
    icon={Lock}
    lastUpdated="July 28, 2026"
  >
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">1. Information We Collect</h2>
      <p>
        At Contexta-AI, we respect your data privacy. To provide document retrieval and AI assistant capabilities, we collect the following categories of information:
      </p>
      <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
        <li><strong>Account Data:</strong> Name, email address, salted password hashes, and authentication tokens required to manage your account.</li>
        <li><strong>Knowledge Base Documents:</strong> Unstructured PDF documents uploaded through our dashboard to build your isolated vector indices.</li>
        <li><strong>Query Telemetry:</strong> Customer support questions asked via the Chat Testing playground or embedded widget, stored solely to log knowledge gaps and chat metrics.</li>
      </ul>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">2. How We Process &amp; Embed Your Documents</h2>
      <p>
        When a PDF document is uploaded to Contexta-AI, our automated pipeline extracts text, creates semantic chunks, and generates 768-dimensional vector embeddings using Google Gemini API (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">gemini-embedding-001</code>).
      </p>
      <div className="p-4 rounded-xl bg-forest-50/60 border border-forest-100 space-y-2 text-forest-900">
        <p className="font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-forest-600" /> Strictly Grounded Zero-Training Guarantee
        </p>
        <p className="text-xs font-medium leading-relaxed">
          Your uploaded document text and vector embeddings are processed through enterprise API channels. They are <strong>never used to train</strong> public foundation models or shared across external data providers.
        </p>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">3. Multi-Tenant Vector Store Isolation</h2>
      <p>
        We employ per-user directory isolation for FAISS vector indices (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">user_[userId]</code>). Queries submitted under your account or widget company ID search <em>strictly</em> against your isolated vector database. Cross-tenant retrieval is architecturally impossible.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">4. Data Retention &amp; User Control</h2>
      <p>
        You retain 100% ownership of your data. You may delete processed PDF documents or reset your vector store index at any time directly through the Documents dashboard. Upon deletion request, all extracted text chunks and FAISS vector index files are permanently purged.
      </p>
    </section>
  </LegalShell>
);

// ── 2. TERMS OF SERVICE PAGE ──
export const TermsOfServicePage = () => (
  <LegalShell
    title="Terms of Service"
    subtitle="The terms and operational rules governing your use of Contexta-AI platform services, API endpoints, and embeddable widgets."
    icon={FileText}
    lastUpdated="July 28, 2026"
  >
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">1. Acceptance of Terms</h2>
      <p>
        By creating a Contexta-AI account, uploading documents, or embedding our widget scripts on external web pages, you agree to comply with these Terms of Service.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">2. Account Responsibility &amp; Acceptable Use</h2>
      <p>
        You are responsible for maintaining the confidentiality of your login credentials and API keys. You warrant that all uploaded documents comply with intellectual property laws and do not contain malware, unlawful content, or trade secrets belonging to unauthorized third parties.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">3. Service Levels &amp; RAG Accuracy</h2>
      <p>
        Contexta-AI implements strict confidence gating (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">L2 Distance Threshold &lt; 0.9</code>) to minimize AI hallucinations. However, AI generation depends on the quality of uploaded knowledge base documents. Contexta-AI provides services on an &quot;AS IS&quot; basis and is not liable for operational decisions made based on AI output.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">4. Embeddable Widget Usage</h2>
      <p>
        When deploying the Contexta-AI customer support iframe (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">&lt;iframe src=&quot;.../widget/:companyId&quot;&gt;</code>) on customer-facing websites, you are responsible for providing appropriate end-user privacy notifications regarding automated support chat.
      </p>
    </section>
  </LegalShell>
);

// ── 3. SECURITY STATEMENT PAGE ──
export const SecurityStatementPage = () => (
  <LegalShell
    title="Security Statement"
    subtitle="Overview of Contexta-AI's enterprise security architecture, vector database isolation, encryption standards, and trust controls."
    icon={ShieldCheck}
    lastUpdated="July 28, 2026"
  >
    <div className="grid sm:grid-cols-3 gap-4 mb-4">
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
        <Key className="w-5 h-5 text-forest-600" />
        <h4 className="text-xs font-bold text-slate-900 font-display">TLS 1.3 &amp; AES-256</h4>
        <p className="text-[11px] text-slate-500">Encrypted in transit and at rest</p>
      </div>
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
        <Server className="w-5 h-5 text-indigo-600" />
        <h4 className="text-xs font-bold text-slate-900 font-display">Isolated FAISS</h4>
        <p className="text-[11px] text-slate-500">Per-user isolated vector stores</p>
      </div>
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
        <Sparkles className="w-5 h-5 text-amber-600" />
        <h4 className="text-xs font-bold text-slate-900 font-display">Confidence Gate</h4>
        <p className="text-[11px] text-slate-500">Distance-gated RAG verification</p>
      </div>
    </div>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">1. Architecture &amp; Data Encryption</h2>
      <p>
        Contexta-AI enforces strict cryptographic protection across all layers:
      </p>
      <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
        <li><strong>In Transit:</strong> All HTTP traffic between client web apps, backend servers, and API endpoints is encrypted via TLS 1.3.</li>
        <li><strong>At Rest:</strong> MongoDB databases and FAISS vector indices are stored on encrypted file systems.</li>
        <li><strong>Password Hashing:</strong> User passwords are salted and hashed using bcrypt before database insertion.</li>
      </ul>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">2. Confidence-Gated Hallucination Control</h2>
      <p>
        To prevent false or ungrounded statements, our RAG pipeline evaluates vector match similarity. If query matches fall outside the strict L2 distance cutoff threshold (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">score &gt; 0.9</code>), the generation engine refuses to hallucinate, logs the gap, and returns a safe fallback message.
      </p>
    </section>

    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 font-display">3. Vulnerability Management &amp; Monitoring</h2>
      <p>
        Our infrastructure uses automated rate-limiting (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">express-rate-limit</code>), HTTP security headers (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">helmet</code>), and continuous log auditing to defend against cross-site scripting and unauthorized access.
      </p>
    </section>
  </LegalShell>
);
