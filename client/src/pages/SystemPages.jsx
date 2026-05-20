import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle,
  Code2,
  Copy,
  CreditCard,
  Database,
  FileText,
  Key,
  Loader2,
  Lock,
  Mail,
  Rocket,
  Server,
  Settings,
  Shield,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const formatDate = (date) =>
  new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const PageShell = ({ active, title, subtitle, children }) => (
  <div className="min-h-screen bg-[#070A13] text-slate-100 flex">
    <Sidebar active={active} />
    <div className="flex-1 flex flex-col min-h-screen min-w-0">
      <Topbar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const state = status || "unknown";
  const cls =
    state === "processed" || state === "success" || state === "configured"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : state === "failed" || state === "missing" || state === "error"
        ? "bg-red-500/10 text-red-400 border border-red-500/20"
        : "bg-amber-500/10 text-amber-400 border border-amber-500/20";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${cls}`}>
      {state}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, tone = "accent" }) => (
  <div className="bg-[#0A0F1D] border border-slate-900/60 hover:border-slate-800/80 rounded-2xl p-5 shadow-lg transition-colors group">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${tone === "green" ? "bg-emerald-500/10 border border-emerald-500/25" : "bg-cyan-500/10 border border-cyan-500/25"}`}>
      <Icon className={`w-4 h-4 ${tone === "green" ? "text-emerald-400" : "text-cyan-400"}`} />
    </div>
    <p className="text-2xl font-extrabold text-white tracking-tight">{value}</p>
    <p className="text-xs text-slate-400 mt-1 font-semibold">{label}</p>
  </div>
);

const LoadingState = () => (
  <div className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-10 flex items-center justify-center shadow-lg">
    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
  </div>
);

const useSystemData = (endpoint) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(endpoint);
        setData(res.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [endpoint]);

  return { data, error, loading, setData };
};

const ErrorBox = ({ message }) =>
  message ? (
    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 flex items-center gap-3 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {message}
    </div>
  ) : null;

export const AnalyticsPage = () => {
  const { data, error, loading } = useSystemData("/system/analytics");
  const maxCount = Math.max(...(data?.dailyChats || []).map((day) => day.count), 1);

  return (
    <PageShell active="Analytics" title="Analytics" subtitle="Live usage, documents, sources, and recent questions from MongoDB.">
      <ErrorBox message={error} />
      {loading ? <LoadingState /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
            <MetricCard icon={FileText} label="Documents" value={data.metrics.totalDocuments} />
            <MetricCard icon={CheckCircle} label="Processed" value={data.metrics.processedDocuments} tone="green" />
            <MetricCard icon={AlertCircle} label="Failed" value={data.metrics.failedDocuments} />
            <MetricCard icon={BarChart3} label="Chats" value={data.metrics.totalChats} tone="green" />
            <MetricCard icon={Database} label="Vectors" value={data.metrics.vectorCount} />
            <MetricCard icon={Code2} label="Dimensions" value={data.metrics.vectorDimension} />
          </div>

          <div className="grid xl:grid-cols-3 gap-5">
            <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 xl:col-span-2 shadow-lg">
              <h2 className="text-sm font-bold text-white mb-5">Chat Volume</h2>
              <div className="flex items-end gap-3 h-48 pt-6 border-b border-slate-900">
                {data.dailyChats.map((day) => (
                  <div key={day.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div 
                      className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500/20 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 relative shadow-[0_0_12px_rgba(6,182,212,0.1)]" 
                      style={{ height: `${Math.max((day.count / maxCount) * 100, 6)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-950 text-cyan-400 border border-slate-900 text-[10px] py-1 px-2 rounded font-semibold transition-opacity pointer-events-none z-10 shadow-xl whitespace-nowrap">
                        {day.count} chat{day.count !== 1 ? 's' : ''}
                      </div>
                      <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-300 rounded-t-lg shadow-[0_0_8px_#22d3ee]" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">{day.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
              <h2 className="text-sm font-bold text-white mb-4">Top Sources</h2>
              <div className="space-y-3">
                {data.sourceUsage.length === 0 ? (
                  <p className="text-sm text-slate-500 font-medium">No source usage yet.</p>
                ) : data.sourceUsage.map((source) => (
                  <div key={source.filename} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-900/30 border border-slate-900/60">
                    <span className="text-sm text-slate-300 truncate font-semibold">{source.filename}</span>
                    <span className="text-xs font-extrabold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg">{source.count}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-slate-900">
              <h2 className="text-sm font-bold text-white">Recent Questions</h2>
            </div>
            <div className="divide-y divide-slate-900">
              {data.recentQuestions.length === 0 ? (
                <p className="p-5 text-sm text-slate-500 font-medium">No chat questions yet.</p>
              ) : data.recentQuestions.map((chat) => (
                <div key={chat.id} className="p-5 hover:bg-slate-900/10 transition-colors">
                  <p className="text-sm font-bold text-slate-200">{chat.question}</p>
                  <p className="text-sm text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{chat.answer}</p>
                  <p className="text-xs text-slate-500 mt-3 font-semibold">{formatDate(chat.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
};

export const LogsPage = () => {
  const { data, error, loading } = useSystemData("/system/logs");
  const levelClass = {
    success: "bg-emerald-400 shadow-[0_0_8px_#34d399]",
    error: "bg-red-400 shadow-[0_0_8px_#f87171]",
    info: "bg-cyan-400 shadow-[0_0_8px_#22d3ee]",
  };

  return (
    <PageShell active="Logs" title="Logs" subtitle="Document, indexing, and chat activity generated from local project data.">
      <ErrorBox message={error} />
      {loading ? <LoadingState /> : (
        <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 border-b border-slate-900 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Activity Feed</h2>
            <span className="text-xs text-slate-400 font-semibold">{data.events.length} events</span>
          </div>
          <div className="divide-y divide-slate-900">
            {data.events.length === 0 ? (
              <p className="p-5 text-sm text-slate-500 font-medium">No logs yet.</p>
            ) : data.events.map((event, index) => (
              <div key={`${event.title}-${index}`} className="p-5 flex gap-3 hover:bg-slate-900/10 transition-colors">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${levelClass[event.level] || levelClass.info}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-sm font-bold text-slate-200">{event.title}</p>
                    <p className="text-xs text-slate-500 font-semibold">{formatDate(event.time)}</p>
                  </div>
                  <p className="text-sm text-slate-400 mt-1.5 break-words leading-relaxed">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
};

export const ApiKeysPage = () => {
  const { data, error, loading } = useSystemData("/system/api-keys");
  const [testState, setTestState] = useState({ loading: false, message: "", ok: false });

  const testKey = async () => {
    try {
      setTestState({ loading: true, message: "", ok: false });
      const res = await api.post("/system/api-keys/test");
      setTestState({ loading: false, message: `${res.data.message} Dimension: ${res.data.dimension}`, ok: true });
    } catch (err) {
      setTestState({ loading: false, message: err.response?.data?.message || "Gemini API test failed.", ok: false });
    }
  };

  return (
    <PageShell active="API Keys" title="API Keys" subtitle="Check local provider configuration and test the Gemini key without exposing secrets.">
      <ErrorBox message={error} />
      {loading ? <LoadingState /> : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <MetricCard icon={Key} label="Gemini API" value={data.gemini.configured ? "Ready" : "Missing"} tone={data.gemini.configured ? "green" : "accent"} />
            <MetricCard icon={Database} label="MongoDB URI" value={data.database.configured ? "Ready" : "Missing"} tone={data.database.configured ? "green" : "accent"} />
            <MetricCard icon={Lock} label="JWT Secret" value={data.jwt.configured ? "Ready" : "Missing"} tone={data.jwt.configured ? "green" : "accent"} />
          </div>

          <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-white">Gemini Provider</h2>
                <div className="mt-3 space-y-2 text-sm text-slate-400">
                  <p className="flex items-center gap-2">Key: <span className="font-bold text-slate-200">{data.gemini.masked || "Not set"}</span> <StatusBadge status={data.gemini.configured ? "configured" : "missing"} /></p>
                  <p>Chat model: <span className="font-bold text-slate-200">{data.gemini.chatModel}</span></p>
                  <p>Embedding model: <span className="font-bold text-slate-200">{data.gemini.embeddingModel}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={testKey}
                disabled={testState.loading || !data.gemini.configured}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 rounded-xl text-sm font-bold hover:bg-cyan-400 hover:shadow-cyan-400/20 shadow-md shadow-cyan-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed border-0 cursor-pointer"
              >
                {testState.loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Zap className="w-4 h-4 text-slate-950" />}
                Test Gemini Key
              </button>
            </div>
            {testState.message && (
              <div className={`mt-4 rounded-xl p-3 text-sm border ${testState.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                {testState.message}
              </div>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
};

export const RagPipelinePage = () => {
  const { data, error, loading } = useSystemData("/system/rag");

  return (
    <PageShell active="RAG Pipeline" title="RAG Pipeline" subtitle="Inspect local chunking, indexing, FAISS health, and document processing status.">
      <ErrorBox message={error} />
      {loading ? <LoadingState /> : (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <MetricCard icon={Database} label="Index Usable" value={data.index.usable ? "Yes" : "No"} tone={data.index.usable ? "green" : "accent"} />
            <MetricCard icon={Code2} label="Dimensions" value={data.index.dimension} />
            <MetricCard icon={BarChart3} label="Vectors" value={data.index.total} tone="green" />
            <MetricCard icon={FileText} label="Documents" value={data.documents.length} />
          </div>

          <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-slate-900">
              <h2 className="text-sm font-bold text-white">Document Processing</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-900">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Document</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Pages</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Text</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {data.documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-4 text-sm font-bold text-slate-200">{doc.originalName}</td>
                      <td className="px-5 py-4 text-sm text-slate-400 font-semibold">{doc.pageCount || 0}</td>
                      <td className="px-5 py-4 text-sm text-slate-400 font-semibold">{doc.textLength.toLocaleString()} chars</td>
                      <td className="px-5 py-4"><StatusBadge status={doc.processingStatus} /></td>
                      <td className="px-5 py-4 text-sm text-slate-400 font-semibold">{formatDate(doc.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
};

export const AIModelsPage = () => {
  const { data, error, loading } = useSystemData("/system/api-keys");

  return (
    <PageShell active="AI Models" title="AI Models" subtitle="Current local model configuration used by the chatbot and RAG pipeline.">
      <ErrorBox message={error} />
      {loading ? <LoadingState /> : (
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Answer Generation</h2>
            <p className="text-2xl font-extrabold text-cyan-400 mt-3 tracking-tight">{data.gemini.chatModel}</p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed font-semibold">Used after retrieval to answer strictly from uploaded document context.</p>
          </section>
          <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Embedding Generation</h2>
            <p className="text-2xl font-extrabold text-emerald-400 mt-3 tracking-tight">{data.gemini.embeddingModel}</p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed font-semibold">Used for document chunks and incoming user questions.</p>
          </section>
        </div>
      )}
    </PageShell>
  );
};

export const DeploymentsPage = () => (
  <PageShell active="Deployments" title="Deployments" subtitle="Local-first run commands and readiness checks before cloud deployment.">
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
        <Rocket className="w-5 h-5 text-cyan-400 mb-4" />
        <h2 className="text-sm font-bold text-white">Backend</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-[#070A13] border border-slate-900 p-4 text-xs text-cyan-400"><code>cd server{"\n"}npm start</code></pre>
      </section>
      <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
        <Server className="w-5 h-5 text-emerald-400 mb-4" />
        <h2 className="text-sm font-bold text-white">Frontend</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-[#070A13] border border-slate-900 p-4 text-xs text-cyan-400"><code>cd client{"\n"}npm run dev</code></pre>
      </section>
    </div>
  </PageShell>
);

export const BillingPage = () => {
  const { data, error, loading } = useSystemData("/system/analytics");
  const usedRequests = data?.metrics?.totalChats || 0;
  const freeLimit = 200;
  const usagePercent = Math.min((usedRequests / freeLimit) * 100, 100);
  const plans = [
    {
      name: "Free",
      price: "Always free",
      badge: "Current plan",
      description: "Best for demos, testing, and your current local-first project.",
      features: ["200 chatbot requests/month", "Local PDF storage", "FAISS vector search", "Widget embed code"],
      active: true,
    },
    {
      name: "Go",
      price: "Razorpay later",
      badge: "Growth",
      description: "For small businesses that need higher usage after the demo phase.",
      features: ["2,000 requests/month", "More documents", "Basic analytics", "Email support"],
      active: false,
    },
    {
      name: "Enterprise",
      price: "Custom",
      badge: "Scale",
      description: "For teams that need larger limits, custom deployment, and support.",
      features: ["Custom request limits", "Team roles", "Priority support", "Cloud deployment option"],
      active: false,
    },
  ];

  return (
    <PageShell active="Billing" title="Billing" subtitle="Plans, usage limits, and cost-control status for the local-first project.">
      <ErrorBox message={error} />
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard icon={CreditCard} label="Current Plan" value="Free" tone="green" />
        <MetricCard icon={BarChart3} label="Monthly Requests" value={`${usedRequests}/${freeLimit}`} />
        <MetricCard icon={Shield} label="Cloud Spend" value="Skipped" tone="green" />
        <MetricCard icon={Zap} label="Payment" value="Razorpay next" />
      </div>

      <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Free plan usage</h2>
            <p className="text-sm text-slate-400 mt-1 font-semibold">The free tier stays active forever and includes 200 chatbot requests per month.</p>
          </div>
          <StatusBadge status={loading ? "loading" : "configured"} />
        </div>
        <div className="mt-5 h-3 rounded-full bg-slate-900 overflow-hidden">
          <div className="h-full rounded-full bg-cyan-500 transition-all shadow-[0_0_8px_#22d3ee]" style={{ width: `${usagePercent}%` }} />
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-500 font-bold">
          <span>{usedRequests} used</span>
          <span>{Math.max(freeLimit - usedRequests, 0)} remaining</span>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <section key={plan.name} className={`bg-[#0A0F1D] border rounded-2xl p-5 shadow-lg flex flex-col justify-between ${plan.active ? "border-cyan-500/50 shadow-cyan-500/5" : "border-slate-900/60"}`}>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${plan.active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-500"}`}>{plan.badge}</span>
                  <h2 className="mt-4 text-lg font-bold text-white">{plan.name} Plan</h2>
                </div>
                <CreditCard className={`w-5 h-5 ${plan.active ? "text-cyan-400" : "text-slate-600"}`} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-white">{plan.price}</p>
              <p className="mt-2 text-sm text-slate-400 min-h-12 leading-relaxed font-semibold">{plan.description}</p>
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={!plan.active}
              className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-0 cursor-pointer ${plan.active ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15" : "bg-slate-950 border border-slate-900 text-slate-600 cursor-not-allowed"}`}
            >
              {plan.active ? "Active plan" : "Razorpay integration later"}
            </button>
          </section>
        ))}
      </div>

      <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white">Cost control setup</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-4">
            <Server className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-slate-200">Local storage active</p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">No S3 bill while testing.</p>
          </div>
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-4">
            <Database className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-slate-200">FAISS active</p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">No paid vector database needed.</p>
          </div>
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-4">
            <CreditCard className="w-4 h-4 text-cyan-400 mb-2" />
            <p className="text-sm font-bold text-slate-200">Razorpay planned</p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Add checkout only after the demo is stable.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
};

export const TeamPage = () => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Support Agent");
  const companyId = user?.id || user?._id || "YOUR_COMPANY_ID";
  const members = [
    {
      name: user?.name || "Owner",
      email: user?.email || "owner@company.com",
      role: "Owner",
      status: "Active",
      joined: "Today",
    },
    {
      name: "Admin User",
      email: "admin@company.com",
      role: "Admin",
      status: "Demo",
      joined: "Preview",
    },
    {
      name: "Support Agent",
      email: "support@company.com",
      role: "Support Agent",
      status: "Demo",
      joined: "Preview",
    },
  ];

  const handleInvite = (event) => {
    event.preventDefault();
    setInviteEmail("");
    setInviteRole("Support Agent");
  };

  return (
    <PageShell active="Team" title="Team" subtitle="Company profile, member roles, and widget identity for the SaaS workspace.">
      <div className="grid lg:grid-cols-3 gap-5">
        <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 lg:col-span-2 shadow-lg">
          <Building2 className="w-5 h-5 text-cyan-400 mb-4" />
          <h2 className="text-sm font-bold text-white">Company Profile</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Owner</p>
              <p className="mt-1.5 text-sm font-bold text-slate-200">{user?.name || "User"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Email</p>
              <p className="mt-1.5 text-sm font-bold text-slate-200 break-all">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Plan</p>
              <p className="mt-1.5 text-sm font-bold text-emerald-400">Free Forever</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Roles</p>
              <p className="mt-1.5 text-sm font-bold text-slate-200">Owner, Admin, Support Agent</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-5 font-semibold uppercase">Company / Widget ID</p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-[#070A13] border border-slate-900 p-4 text-xs text-cyan-400"><code>{companyId}</code></pre>
        </section>

        <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
          <UserPlus className="w-5 h-5 text-emerald-400 mb-4" />
          <h2 className="text-sm font-bold text-white">Invite Member</h2>
          <p className="mt-1 text-xs text-slate-400 font-semibold leading-relaxed">Demo UI for inviting teammates. Backend email sending can come later.</p>
          <form onSubmit={handleInvite} className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="member@company.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070A13] border border-slate-900 text-sm focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Role</label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#070A13] border border-slate-900 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/10"
              >
                <option className="bg-[#0A0F1D]">Admin</option>
                <option className="bg-[#0A0F1D]">Support Agent</option>
              </select>
            </div>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-bold hover:shadow-cyan-400/20 shadow-md shadow-cyan-500/10 transition-colors border-0 cursor-pointer">
              <UserPlus className="w-4 h-4 text-slate-950 font-bold" />
              Prepare Invite
            </button>
          </form>
        </section>
      </div>

      <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-900 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Team Members</h2>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Role-based access preview for the SaaS dashboard.</p>
          </div>
          <StatusBadge status="configured" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-900">
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Member</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Role</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {members.map((member) => (
                <tr key={`${member.email}-${member.role}`} className="hover:bg-slate-900/10 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-slate-200">{member.name}</p>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">{member.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400 font-semibold">{member.role}</td>
                  <td className="px-5 py-4"><StatusBadge status={member.status === "Active" ? "success" : "pending"} /></td>
                  <td className="px-5 py-4 text-sm text-slate-400 font-semibold">{member.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
};

const WidgetEmbedContent = () => {
  const { user } = useAuth();
  const widgetUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    return `${origin}/widget/${user?.id || user?._id || "YOUR_COMPANY_ID"}`;
  }, [user]);
  const iframeCode = useMemo(() => {
    return `<iframe
  src="${widgetUrl}"
  width="400"
  height="600"
  style="border:0;border-radius:16px;box-shadow:0 12px 32px rgba(15,23,42,0.16);"
  title="AI Customer Support Chatbot"
></iframe>`;
  }, [widgetUrl]);
  const [copied, setCopied] = useState("");

  const copy = async (value, type) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
      <Code2 className="w-5 h-5 text-cyan-400 mb-4" />
      <h2 className="text-sm font-bold text-white">Website iframe code</h2>
      <p className="mt-1 text-sm text-slate-400 font-semibold">Paste this code into any website page where you want the chatbot to appear.</p>
      <div className="mt-4 grid lg:grid-cols-[1fr_auto] gap-3 items-start">
        <pre className="overflow-x-auto rounded-xl bg-[#070A13] border border-slate-900 p-4 text-xs text-cyan-400 whitespace-pre-wrap break-all"><code>{iframeCode}</code></pre>
        <button type="button" onClick={() => copy(iframeCode, "iframe")} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-bold hover:shadow-cyan-400/20 shadow-md shadow-cyan-500/10 transition-colors border-0 cursor-pointer">
          {copied === "iframe" ? <CheckCircle className="w-4 h-4 text-slate-950 font-bold" /> : <Copy className="w-4 h-4 text-slate-950 font-bold" />}
          {copied === "iframe" ? "Copied" : "Copy iframe"}
        </button>
      </div>
      <h3 className="mt-6 text-xs font-semibold text-slate-500 uppercase">Widget URL</h3>
      <div className="mt-3 flex flex-col lg:flex-row gap-3">
        <pre className="flex-1 overflow-x-auto rounded-xl bg-[#070A13] border border-slate-900 p-4 text-xs text-slate-300"><code>{widgetUrl}</code></pre>
        <button type="button" onClick={() => copy(widgetUrl, "url")} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer">
          {copied === "url" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === "url" ? "Copied" : "Copy URL"}
        </button>
      </div>
    </section>
  );
};

export const WidgetEmbedPage = () => (
  <PageShell active="Widget Embed" title="Widget Embed" subtitle="Copy the iframe code for adding your chatbot to any external website.">
    <WidgetEmbedContent />
  </PageShell>
);

export const SettingsPage = () => {
  const { user } = useAuth();
  const { data, error, loading } = useSystemData("/system/api-keys");
  const defaults = useMemo(() => ({
    companyName: user?.name ? `${user.name}'s Company` : "My Company",
    supportEmail: user?.email || "",
    widgetTitle: "Customer Support",
    responseMode: "Local-first",
    monthlyLimit: "200",
  }), [user]);
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem("contexta_settings") || localStorage.getItem("nexus_settings") || "{}";
      return { ...defaults, ...JSON.parse(stored) };
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setSettings((current) => ({ ...defaults, ...current }));
  }, [defaults]);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
  const widgetUrl = `${origin}/widget/${user?.id || user?._id || "YOUR_COMPANY_ID"}`;

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem("contexta_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const resetSettings = () => {
    localStorage.removeItem("contexta_settings");
    localStorage.removeItem("nexus_settings");
    setSettings(defaults);
    setSaved(false);
  };

  const copy = async (value, type) => {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <PageShell active="Settings" title="Settings" subtitle="Workspace preferences, local URLs, and provider readiness.">
      <ErrorBox message={error} />

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 lg:col-span-2 shadow-lg">
          <Settings className="w-5 h-5 text-cyan-400 mb-4" />
          <h2 className="text-sm font-bold text-white">Workspace Settings</h2>
          <p className="mt-1 text-sm text-slate-400 font-semibold">These preferences are saved locally for the demo dashboard.</p>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Company name</span>
              <input
                type="text"
                value={settings.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-[#070A13] border border-slate-900 text-sm focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Support email</span>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(event) => updateField("supportEmail", event.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-[#070A13] border border-slate-900 text-sm focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Widget title</span>
              <input
                type="text"
                value={settings.widgetTitle}
                onChange={(event) => updateField("widgetTitle", event.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-[#070A13] border border-slate-900 text-sm focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400">Monthly free request limit</span>
              <input
                type="number"
                min="1"
                value={settings.monthlyLimit}
                onChange={(event) => updateField("monthlyLimit", event.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-[#070A13] border border-slate-900 text-sm focus:outline-none focus:border-cyan-400 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/10"
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-400 mb-2">Project mode</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {["Local-first", "Cloud-ready"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateField("responseMode", mode)}
                  className={`text-left rounded-xl border p-4 transition-colors cursor-pointer bg-transparent ${settings.responseMode === mode ? "border-cyan-500/50 bg-cyan-500/5" : "border-slate-900 hover:bg-slate-900/30"}`}
                >
                  <p className="text-sm font-bold text-slate-200">{mode}</p>
                  <p className="mt-1 text-xs text-slate-400 font-semibold leading-relaxed">
                    {mode === "Local-first" ? "Use local uploads, MongoDB, and FAISS to control cost." : "Prepared for S3, EC2, and paid billing later."}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={saveSettings} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-bold hover:shadow-cyan-400/20 shadow-md shadow-cyan-500/10 transition-colors border-0 cursor-pointer">
              <CheckCircle className="w-4 h-4 text-slate-950 font-bold" />
              {saved ? "Saved" : "Save settings"}
            </button>
            <button type="button" onClick={resetSettings} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer">
              Reset defaults
            </button>
          </div>
        </section>

        <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
          <Shield className="w-5 h-5 text-emerald-400 mb-4" />
          <h2 className="text-sm font-bold text-white">Provider Status</h2>
          {loading ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-500 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              Checking configuration
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-slate-400 font-semibold">Gemini API</span>
                <StatusBadge status={data?.gemini?.configured ? "configured" : "missing"} />
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-slate-400 font-semibold">MongoDB</span>
                <StatusBadge status={data?.database?.configured ? "configured" : "missing"} />
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-slate-400 font-semibold">JWT Auth</span>
                <StatusBadge status={data?.jwt?.configured ? "configured" : "missing"} />
              </div>
              <div className="pt-4 border-t border-slate-900">
                <p className="text-xs text-slate-500 font-semibold uppercase">Chat model</p>
                <p className="mt-1.5 text-sm font-bold text-slate-300 break-all">{data?.gemini?.chatModel}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 shadow-lg">
        <Server className="w-5 h-5 text-cyan-400 mb-4" />
        <h2 className="text-sm font-bold text-white">Local App URLs</h2>
        <div className="mt-5 space-y-3">
          {[
            { label: "Frontend", value: origin, type: "frontend" },
            { label: "Backend API", value: apiUrl, type: "api" },
            { label: "Widget URL", value: widgetUrl, type: "widget" },
          ].map((item) => (
            <div key={item.type} className="flex flex-col lg:flex-row lg:items-center gap-3 rounded-xl border border-slate-900/60 bg-slate-950/20 p-3 hover:border-slate-800 transition-colors">
              <div className="lg:w-32 shrink-0">
                <p className="text-xs font-bold text-slate-500 uppercase">{item.label}</p>
              </div>
              <code className="flex-1 overflow-x-auto text-xs text-cyan-400">{item.value}</code>
              <div className="flex gap-2">
                <button type="button" onClick={() => copy(item.value, item.type)} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                  {copied === item.type ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === item.type ? "Copied" : "Copy"}
                </button>
                <button type="button" onClick={() => window.open(item.value, "_blank", "noopener,noreferrer")} className="inline-flex items-center justify-center px-3 py-2 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
};
