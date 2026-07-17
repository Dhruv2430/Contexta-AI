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
  <div className="min-h-screen bg-slate-50 text-slate-700 flex">
    <Sidebar active={active} />
    <div className="flex-1 flex flex-col min-h-screen min-w-0">
      <Topbar />
      <main className="flex-1 p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
        <div className="animate-fade-in text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-display">{title}</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const state = status || "unknown";
  const cls =
    state === "processed" || state === "success" || state === "configured" || state === "Active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : state === "failed" || state === "missing" || state === "error"
        ? "bg-red-50 text-red-650 text-red-650 text-red-600 border-red-100"
        : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cls} capitalize`}>
      {state}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="card p-6 shadow-sm transition-colors text-left group hover:border-forest-500 bg-white border border-slate-200/60">
    <div className="w-9 h-9 rounded-md flex items-center justify-center mb-3 bg-slate-50 border border-slate-100 shadow-sm text-forest-600">
      <Icon className="w-4.5 h-4.5" />
    </div>
    <p className="text-2xl font-bold text-slate-900 tracking-tight font-display">{value}</p>
    <p className="text-xs text-slate-500 mt-1 font-semibold">{label}</p>
  </div>
);

const LoadingState = () => (
  <div className="card p-10 flex items-center justify-center shadow-sm bg-white border border-slate-200/60">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-6 h-6 text-forest-600 animate-spin" />
      <p className="text-slate-500 text-xs font-semibold">Loading data...</p>
    </div>
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
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 flex items-center gap-3 text-sm font-medium">
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
            <MetricCard icon={CheckCircle} label="Processed" value={data.metrics.processedDocuments} />
            <MetricCard icon={AlertCircle} label="Failed" value={data.metrics.failedDocuments} />
            <MetricCard icon={BarChart3} label="Chats" value={data.metrics.totalChats} />
            <MetricCard icon={Database} label="Vectors" value={data.metrics.vectorCount} />
            <MetricCard icon={Code2} label="Dimensions" value={data.metrics.vectorDimension} />
          </div>

          <div className="grid xl:grid-cols-3 gap-6">
            <section className="card p-6 xl:col-span-2 text-left bg-white border border-slate-200/60 shadow-sm">
              <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-5">Chat Volume</h2>
              <div className="flex items-end gap-3 h-48 pt-6 border-b border-slate-100">
                {data.dailyChats.map((day) => (
                  <div key={day.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div
                      className="w-full bg-forest-600 rounded-t hover:bg-forest-700 transition-all duration-200 relative shadow-sm"
                      style={{ height: `${Math.max((day.count / maxCount) * 100, 6)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md font-semibold transition-opacity pointer-events-none z-10 shadow-md whitespace-nowrap">
                        {day.count} chat{day.count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">{day.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
              <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4">Top Sources</h2>
              <div className="space-y-3">
                {data.sourceUsage.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium">No source usage yet.</p>
                ) : data.sourceUsage.map((source) => (
                  <div key={source.filename} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-slate-200/60 shadow-sm">
                    <span className="text-xs text-slate-700 truncate font-semibold">{source.filename}</span>
                    <span className="text-xs font-semibold text-forest-700 bg-forest-50 border border-forest-100 px-2 py-0.5 rounded-md">{source.count}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card overflow-hidden text-left bg-white border border-slate-200/60 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Recent Questions</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.recentQuestions.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 font-medium">No chat questions yet.</p>
              ) : data.recentQuestions.map((chat) => (
                <div key={chat.id} className="p-6 hover:bg-slate-50/40 transition-colors">
                  <p className="text-sm font-semibold text-slate-800">{chat.question}</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{chat.answer}</p>
                  <p className="text-[10px] text-slate-400 mt-3 font-semibold">{formatDate(chat.createdAt)}</p>
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
    success: "bg-emerald-500 shadow-sm shadow-emerald-25",
    error: "bg-red-500 shadow-sm shadow-red-25",
    info: "bg-slate-400",
  };

  return (
    <PageShell active="Logs" title="Logs" subtitle="Document, indexing, and chat activity generated from local project data.">
      <ErrorBox message={error} />
      {loading ? <LoadingState /> : (
        <section className="card overflow-hidden text-left bg-white border border-slate-200/60 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Activity Feed</h2>
            <span className="text-xs text-slate-500 font-semibold">{data.events.length} events</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.events.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 font-medium">No logs yet.</p>
            ) : data.events.map((event, index) => (
              <div key={`${event.title}-${index}`} className="p-6 flex gap-3 hover:bg-slate-50/40 transition-colors">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${levelClass[event.level] || levelClass.info}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                    <p className="text-xs text-slate-400 font-semibold">{formatDate(event.time)}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 break-words leading-relaxed font-medium">{event.detail}</p>
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
          <div className="grid md:grid-cols-3 gap-6">
            <MetricCard icon={Key} label="Gemini API" value={data.gemini.configured ? "Ready" : "Missing"} />
            <MetricCard icon={Database} label="MongoDB URI" value={data.database.configured ? "Ready" : "Missing"} />
            <MetricCard icon={Lock} label="JWT Secret" value={data.jwt.configured ? "Ready" : "Missing"} />
          </div>

          <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Gemini Provider</h2>
                <div className="mt-3 space-y-2 text-xs text-slate-500 font-medium">
                  <p className="flex items-center gap-2">Key: <span className="font-semibold text-slate-800">{data.gemini.masked || "Not set"}</span> <StatusBadge status={data.gemini.configured ? "configured" : "missing"} /></p>
                  <p>Chat model: <span className="font-semibold text-slate-800">{data.gemini.chatModel}</span></p>
                  <p>Embedding model: <span className="font-semibold text-slate-800">{data.gemini.embeddingModel}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={testKey}
                disabled={testState.loading || !data.gemini.configured}
                className="btn-forest px-4 py-2.5 text-xs shadow-md shadow-forest-100"
              >
                {testState.loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Zap className="w-4 h-4 text-white" />}
                Test Gemini Key
              </button>
            </div>
            {testState.message && (
              <div className={`mt-4 rounded-lg p-3 text-xs border ${testState.ok ? "bg-emerald-50/50 border-emerald-200 text-emerald-700 font-medium" : "bg-red-50/50 border-red-200 text-red-600 font-medium"}`}>
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
          <div className="grid md:grid-cols-4 gap-6">
            <MetricCard icon={Database} label="Index Usable" value={data.index.usable ? "Yes" : "No"} />
            <MetricCard icon={Code2} label="Dimensions" value={data.index.dimension} />
            <MetricCard icon={BarChart3} label="Vectors" value={data.index.total} />
            <MetricCard icon={FileText} label="Documents" value={data.documents.length} />
          </div>

          <section className="card overflow-hidden text-left bg-white border border-slate-200/60 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Document Processing</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pages</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Text</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-800">{doc.originalName}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">{doc.pageCount || 0}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">{doc.textLength.toLocaleString()} chars</td>
                      <td className="px-6 py-4"><StatusBadge status={doc.processingStatus} /></td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">{formatDate(doc.updatedAt)}</td>
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
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
            <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm text-forest-600">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Answer Generation</h2>
            <p className="text-xl font-bold text-slate-800 mt-3 tracking-tight font-display">{data.gemini.chatModel}</p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">Used after retrieval to answer strictly from uploaded document context.</p>
          </section>
          <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
            <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm text-forest-600">
              <Database className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Embedding Generation</h2>
            <p className="text-xl font-bold text-slate-800 mt-3 tracking-tight font-display">{data.gemini.embeddingModel}</p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">Used for document chunks and incoming user questions.</p>
          </section>
        </div>
      )}
    </PageShell>
  );
};

export const DeploymentsPage = () => (
  <PageShell active="Deployments" title="Deployments" subtitle="Local-first run commands and readiness checks before cloud deployment.">
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
        <Rocket className="w-5 h-5 text-forest-600 mb-4" />
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Backend</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-800 font-mono shadow-inner font-mono"><code>cd server{"\n"}npm start</code></pre>
      </section>
      <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
        <Server className="w-5 h-5 text-forest-600 mb-4" />
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Frontend</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-800 font-mono shadow-inner font-mono"><code>cd client{"\n"}npm run dev</code></pre>
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
      <div className="grid md:grid-cols-4 gap-6">
        <MetricCard icon={CreditCard} label="Current Plan" value="Free" />
        <MetricCard icon={BarChart3} label="Monthly Requests" value={`${usedRequests}/${freeLimit}`} />
        <MetricCard icon={Shield} label="Cloud Spend" value="Skipped" />
        <MetricCard icon={Zap} label="Payment" value="Razorpay next" />
      </div>

      <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Free plan usage</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">The free tier stays active forever and includes 200 chatbot requests per month.</p>
          </div>
          <StatusBadge status={loading ? "loading" : "configured"} />
        </div>
        <div className="mt-5 h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
          <div className="h-full rounded-full bg-forest-600 shadow-xs transition-all" style={{ width: `${usagePercent}%` }} />
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-500 font-semibold">
          <span>{usedRequests} used</span>
          <span>{Math.max(freeLimit - usedRequests, 0)} remaining</span>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <section key={plan.name} className={`card p-6 flex flex-col justify-between text-left bg-white ${plan.active ? "border-2 border-forest-600 shadow-md" : "border-slate-200/60"}`}>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${plan.active ? "bg-forest-50 border-forest-100 text-forest-700" : "bg-slate-50 border-slate-200/60 text-slate-500"}`}>{plan.badge}</span>
                  <h2 className="mt-4 text-sm font-bold text-slate-900 font-display">{plan.name} Plan</h2>
                </div>
                <CreditCard className={`w-4.5 h-4.5 ${plan.active ? "text-forest-600" : "text-slate-400"}`} />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 font-display">{plan.price}</p>
              <p className="mt-2 text-xs text-slate-500 min-h-12 leading-relaxed font-medium">{plan.description}</p>
              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={!plan.active}
              className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border-0 cursor-pointer ${plan.active ? "btn-forest shadow-md shadow-forest-100" : "bg-transparent border border-slate-200 text-slate-400 cursor-not-allowed"}`}
            >
              {plan.active ? "Active plan" : "Razorpay integration later"}
            </button>
          </section>
        ))}
      </div>

      <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Cost control setup</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-slate-200/60 bg-slate-50/50 p-4 shadow-sm">
            <Server className="w-4 h-4 text-forest-600 mb-2" />
            <p className="text-xs font-semibold text-slate-800">Local storage active</p>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">No S3 bill while testing.</p>
          </div>
          <div className="rounded-lg border border-slate-200/60 bg-slate-50/50 p-4 shadow-sm">
            <Database className="w-4 h-4 text-forest-600 mb-2" />
            <p className="text-xs font-semibold text-slate-800">FAISS active</p>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">No paid vector database needed.</p>
          </div>
          <div className="rounded-lg border border-slate-200/60 bg-slate-50/50 p-4 shadow-sm">
            <CreditCard className="w-4 h-4 text-forest-600 mb-2" />
            <p className="text-xs font-semibold text-slate-800">Razorpay planned</p>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Add checkout only after the demo is stable.</p>
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
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="card p-6 lg:col-span-2 text-left bg-white border border-slate-200/60 shadow-sm">
          <Building2 className="w-5 h-5 text-forest-600 mb-4" />
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Company Profile</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-450 text-slate-400 font-bold uppercase">Owner</p>
              <p className="mt-1.5 text-xs font-semibold text-slate-700">{user?.name || "User"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-450 text-slate-400 font-bold uppercase">Email</p>
              <p className="mt-1.5 text-xs font-semibold text-slate-700 break-all">{user?.email}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-450 text-slate-400 font-bold uppercase">Plan</p>
              <p className="mt-1.5 text-xs font-semibold text-slate-700">Free Forever</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-450 text-slate-400 font-bold uppercase">Roles</p>
              <p className="mt-1.5 text-xs font-semibold text-slate-700">Owner, Admin, Support Agent</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-450 text-slate-400 mt-5 font-bold uppercase">Company / Widget ID</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-800 font-mono shadow-inner"><code>{companyId}</code></pre>
        </section>

        <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
          <UserPlus className="w-5 h-5 text-forest-600 mb-4" />
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Invite Member</h2>
          <p className="mt-1 text-[11px] text-slate-500 font-medium leading-relaxed">Demo UI for inviting teammates. Backend email sending can come later.</p>
          <form onSubmit={handleInvite} className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="member@company.com"
                  className="input-field w-full pl-9 pr-3 py-2 text-xs placeholder-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Role</label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="input-field w-full px-3 py-2 text-xs cursor-pointer mt-1 bg-white"
              >
                <option className="bg-white">Admin</option>
                <option className="bg-white">Support Agent</option>
              </select>
            </div>
            <button type="submit" className="btn-forest w-full py-2 text-xs shadow-md shadow-forest-100 mt-2">
              <UserPlus className="w-4 h-4 text-white" />
              Prepare Invite
            </button>
          </form>
        </section>
      </div>

      <section className="card overflow-hidden text-left bg-white border border-slate-200/60 shadow-sm animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Team Members</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Role-based access preview for the SaaS dashboard.</p>
          </div>
          <StatusBadge status="configured" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={`${member.email}-${member.role}`} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-slate-800">{member.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{member.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">{member.role}</td>
                  <td className="px-6 py-4"><StatusBadge status={member.status === "Active" ? "success" : "pending"} /></td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">{member.joined}</td>
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
    <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm">
      <Code2 className="w-5 h-5 text-forest-600 mb-4" />
      <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Website iframe code</h2>
      <p className="mt-1 text-xs text-slate-500 font-medium">Paste this code into any website page where you want the chatbot to appear.</p>
      <div className="mt-4 grid lg:grid-cols-[1fr_auto] gap-3 items-start">
        <pre className="overflow-x-auto rounded-lg bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-800 whitespace-pre-wrap break-all shadow-inner font-mono"><code>{iframeCode}</code></pre>
        <button type="button" onClick={() => copy(iframeCode, "iframe")} className="btn-forest px-4 py-2 text-xs shadow-md shadow-forest-100">
          {copied === "iframe" ? <CheckCircle className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
          {copied === "iframe" ? "Copied" : "Copy iframe"}
        </button>
      </div>
      <h3 className="mt-6 text-[10px] font-bold text-slate-400 uppercase">Widget URL</h3>
      <div className="mt-3 flex flex-col lg:flex-row gap-3">
        <pre className="flex-1 overflow-x-auto rounded-lg bg-slate-50 border border-slate-200/60 p-4 text-xs text-slate-800 shadow-inner font-mono"><code>{widgetUrl}</code></pre>
        <button type="button" onClick={() => copy(widgetUrl, "url")} className="btn-secondary px-4 py-2 text-xs shadow-sm">
          {copied === "url" ? <CheckCircle className="w-4 h-4 text-slate-600" /> : <Copy className="w-4 h-4" />}
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
      return JSON.parse(stored);
    } catch {
      return {};
    }
  });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState("");
  const resolvedSettings = { ...defaults, ...settings };

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
  const widgetUrl = `${origin}/widget/${user?.id || user?._id || "YOUR_COMPANY_ID"}`;

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem("contexta_settings", JSON.stringify(resolvedSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const resetSettings = () => {
    localStorage.removeItem("contexta_settings");
    localStorage.removeItem("nexus_settings");
    setSettings({});
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

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="card p-6 lg:col-span-2 text-left bg-white border border-slate-200/60 shadow-sm">
          <Settings className="w-5 h-5 text-forest-600 mb-4" />
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Workspace Settings</h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">These preferences are saved locally for the demo dashboard.</p>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Company name</span>
              <input
                type="text"
                value={resolvedSettings.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                className="input-field w-full px-3 py-2 text-xs mt-1.5"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Support email</span>
              <input
                type="email"
                value={resolvedSettings.supportEmail}
                onChange={(event) => updateField("supportEmail", event.target.value)}
                className="input-field w-full px-3 py-2 text-xs mt-1.5"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Widget title</span>
              <input
                type="text"
                value={resolvedSettings.widgetTitle}
                onChange={(event) => updateField("widgetTitle", event.target.value)}
                className="input-field w-full px-3 py-2 text-xs mt-1.5"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Monthly free request limit</span>
              <input
                type="number"
                min="1"
                value={resolvedSettings.monthlyLimit}
                onChange={(event) => updateField("monthlyLimit", event.target.value)}
                className="input-field w-full px-3 py-2 text-xs mt-1.5"
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-500 mb-2">Project mode</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {["Local-first", "Cloud-ready"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateField("responseMode", mode)}
                  className={`text-left rounded-lg border p-4 transition-all cursor-pointer bg-transparent ${resolvedSettings.responseMode === mode ? "border-2 border-forest-600 bg-forest-50/10" : "border-slate-200 hover:bg-slate-50/50"}`}
                >
                  <p className="text-xs font-semibold text-slate-800">{mode}</p>
                  <p className="mt-1 text-[10px] text-slate-500 font-medium leading-relaxed">
                    {mode === "Local-first" ? "Use local uploads, MongoDB, and FAISS to control cost." : "Prepared for S3, EC2, and paid billing later."}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={saveSettings} className="btn-forest px-4 py-2 text-xs shadow-md shadow-forest-100">
              <CheckCircle className="w-4 h-4 text-white" />
              {saved ? "Saved" : "Save settings"}
            </button>
            <button type="button" onClick={resetSettings} className="btn-secondary px-4 py-2 text-xs shadow-sm">
              Reset defaults
            </button>
          </div>
        </section>

        <section className="card p-6 shadow-sm text-left bg-white border border-slate-200/60 shadow-sm animate-fade-in">
          <Shield className="w-5 h-5 text-forest-600 mb-4" />
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Provider Status</h2>
          {loading ? (
            <div className="mt-5 flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-forest-600" />
              Checking configuration
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-xs text-slate-500 font-medium">Gemini API</span>
                <StatusBadge status={data?.gemini?.configured ? "configured" : "missing"} />
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-xs text-slate-500 font-medium">MongoDB</span>
                <StatusBadge status={data?.database?.configured ? "configured" : "missing"} />
              </div>
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-xs text-slate-500 font-medium">JWT Auth</span>
                <StatusBadge status={data?.jwt?.configured ? "configured" : "missing"} />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-455 text-slate-400 font-bold uppercase">Chat model</p>
                <p className="mt-1.5 text-xs font-semibold text-slate-700 break-all">{data?.gemini?.chatModel}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="card p-6 text-left bg-white border border-slate-200/60 shadow-sm animate-fade-in">
        <Server className="w-5 h-5 text-forest-600 mb-4" />
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Local App URLs</h2>
        <div className="mt-5 space-y-3">
          {[
            { label: "Frontend", value: origin, type: "frontend" },
            { label: "Backend API", value: apiUrl, type: "api" },
            { label: "Widget URL", value: widgetUrl, type: "widget" },
          ].map((item) => (
            <div key={item.type} className="flex flex-col lg:flex-row lg:items-center gap-3 rounded-lg border border-slate-200/60 bg-slate-50/30 p-3 hover:border-forest-500 transition-colors shadow-sm">
              <div className="lg:w-32 shrink-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">{item.label}</p>
              </div>
              <code className="flex-1 overflow-x-auto text-xs text-slate-800 font-mono">{item.value}</code>
              <div className="flex gap-2">
                <button type="button" onClick={() => copy(item.value, item.type)} className="btn-secondary px-3 py-1.5 text-xs shadow-sm">
                  {copied === item.type ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === item.type ? "Copied" : "Copy"}
                </button>
                <button type="button" onClick={() => window.open(item.value, "_blank", "noopener,noreferrer")} className="btn-secondary px-3 py-1.5 text-xs shadow-sm">
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
