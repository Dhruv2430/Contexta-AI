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
  <div className="min-h-screen bg-base-50 flex">
    <Sidebar active={active} />
    <div className="flex-1 flex flex-col min-h-screen min-w-0">
      <Topbar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="animate-fade-in">
          <h1 className="text-xl font-bold text-base-900">{title}</h1>
          <p className="text-sm text-base-500 mt-0.5">{subtitle}</p>
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
      ? "bg-green-50 text-green-700"
      : state === "failed" || state === "missing" || state === "error"
        ? "bg-red-50 text-red-600"
        : "bg-warn-50 text-warn-500";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {state}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, tone = "accent" }) => (
  <div className="card rounded-2xl p-5">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${tone === "green" ? "bg-green-50" : "bg-accent-50"}`}>
      <Icon className={`w-4 h-4 ${tone === "green" ? "text-green-500" : "text-accent-500"}`} />
    </div>
    <p className="text-2xl font-bold text-base-900">{value}</p>
    <p className="text-xs text-base-400 mt-1">{label}</p>
  </div>
);

const LoadingState = () => (
  <div className="card rounded-2xl p-10 flex items-center justify-center">
    <Loader2 className="w-6 h-6 text-accent-400 animate-spin" />
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
    <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 flex items-center gap-3 text-sm">
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
            <section className="card rounded-2xl p-5 xl:col-span-2">
              <h2 className="text-sm font-semibold text-base-800 mb-5">Chat Volume</h2>
              <div className="flex items-end gap-3 h-48">
                {data.dailyChats.map((day) => (
                  <div key={day.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full rounded-t-lg bg-accent-100 hover:bg-accent-400 transition-colors" style={{ height: `${Math.max((day.count / maxCount) * 100, 4)}%` }} />
                    <span className="text-[11px] text-base-400">{day.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-base-800 mb-4">Top Sources</h2>
              <div className="space-y-3">
                {data.sourceUsage.length === 0 ? (
                  <p className="text-sm text-base-400">No source usage yet.</p>
                ) : data.sourceUsage.map((source) => (
                  <div key={source.filename} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-base-700 truncate">{source.filename}</span>
                    <span className="text-xs font-semibold text-accent-500">{source.count}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-base-100">
              <h2 className="text-sm font-semibold text-base-800">Recent Questions</h2>
            </div>
            <div className="divide-y divide-base-100">
              {data.recentQuestions.length === 0 ? (
                <p className="p-5 text-sm text-base-400">No chat questions yet.</p>
              ) : data.recentQuestions.map((chat) => (
                <div key={chat.id} className="p-5">
                  <p className="text-sm font-medium text-base-800">{chat.question}</p>
                  <p className="text-sm text-base-500 mt-1 line-clamp-2">{chat.answer}</p>
                  <p className="text-xs text-base-400 mt-2">{formatDate(chat.createdAt)}</p>
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
    success: "bg-green-400",
    error: "bg-red-400",
    info: "bg-accent-400",
  };

  return (
    <PageShell active="Logs" title="Logs" subtitle="Document, indexing, and chat activity generated from local project data.">
      <ErrorBox message={error} />
      {loading ? <LoadingState /> : (
        <section className="card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-base-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-base-800">Activity Feed</h2>
            <span className="text-xs text-base-400">{data.events.length} events</span>
          </div>
          <div className="divide-y divide-base-100">
            {data.events.length === 0 ? (
              <p className="p-5 text-sm text-base-400">No logs yet.</p>
            ) : data.events.map((event, index) => (
              <div key={`${event.title}-${index}`} className="p-5 flex gap-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${levelClass[event.level] || levelClass.info}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-sm font-medium text-base-800">{event.title}</p>
                    <p className="text-xs text-base-400">{formatDate(event.time)}</p>
                  </div>
                  <p className="text-sm text-base-500 mt-1 break-words">{event.detail}</p>
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

          <section className="card rounded-2xl p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-base-800">Gemini Provider</h2>
                <div className="mt-3 space-y-2 text-sm text-base-600">
                  <p>Key: {data.gemini.masked || "Not set"} <StatusBadge status={data.gemini.configured ? "configured" : "missing"} /></p>
                  <p>Chat model: <span className="font-medium text-base-800">{data.gemini.chatModel}</span></p>
                  <p>Embedding model: <span className="font-medium text-base-800">{data.gemini.embeddingModel}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={testKey}
                disabled={testState.loading || !data.gemini.configured}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-400 text-white rounded-xl text-sm font-semibold hover:bg-accent-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {testState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Test Gemini Key
              </button>
            </div>
            {testState.message && (
              <div className={`mt-4 rounded-xl p-3 text-sm ${testState.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
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

          <section className="card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-base-100">
              <h2 className="text-sm font-semibold text-base-800">Document Processing</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-base-100">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Document</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Pages</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Text</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-100">
                  {data.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-5 py-4 text-sm text-base-800">{doc.originalName}</td>
                      <td className="px-5 py-4 text-sm text-base-500">{doc.pageCount || 0}</td>
                      <td className="px-5 py-4 text-sm text-base-500">{doc.textLength.toLocaleString()} chars</td>
                      <td className="px-5 py-4"><StatusBadge status={doc.processingStatus} /></td>
                      <td className="px-5 py-4 text-sm text-base-500">{formatDate(doc.updatedAt)}</td>
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
          <section className="card rounded-2xl p-5">
            <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-accent-500" />
            </div>
            <h2 className="text-sm font-semibold text-base-800">Answer Generation</h2>
            <p className="text-2xl font-bold text-base-900 mt-3">{data.gemini.chatModel}</p>
            <p className="text-sm text-base-500 mt-2">Used after retrieval to answer strictly from uploaded document context.</p>
          </section>
          <section className="card rounded-2xl p-5">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-sm font-semibold text-base-800">Embedding Generation</h2>
            <p className="text-2xl font-bold text-base-900 mt-3">{data.gemini.embeddingModel}</p>
            <p className="text-sm text-base-500 mt-2">Used for document chunks and incoming user questions.</p>
          </section>
        </div>
      )}
    </PageShell>
  );
};

export const DeploymentsPage = () => (
  <PageShell active="Deployments" title="Deployments" subtitle="Local-first run commands and readiness checks before cloud deployment.">
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="card rounded-2xl p-5">
        <Rocket className="w-5 h-5 text-accent-500 mb-4" />
        <h2 className="text-sm font-semibold text-base-800">Backend</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-base-900 p-4 text-xs text-base-100"><code>cd server{"\n"}npm start</code></pre>
      </section>
      <section className="card rounded-2xl p-5">
        <Server className="w-5 h-5 text-green-500 mb-4" />
        <h2 className="text-sm font-semibold text-base-800">Frontend</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-base-900 p-4 text-xs text-base-100"><code>cd client{"\n"}npm run dev</code></pre>
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

      <section className="card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-base-800">Free plan usage</h2>
            <p className="text-sm text-base-500 mt-1">The free tier stays active forever and includes 200 chatbot requests per month.</p>
          </div>
          <StatusBadge status={loading ? "loading" : "configured"} />
        </div>
        <div className="mt-5 h-3 rounded-full bg-base-100 overflow-hidden">
          <div className="h-full rounded-full bg-accent-400 transition-all" style={{ width: `${usagePercent}%` }} />
        </div>
        <div className="mt-3 flex justify-between text-xs text-base-400">
          <span>{usedRequests} used</span>
          <span>{Math.max(freeLimit - usedRequests, 0)} remaining</span>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <section key={plan.name} className={`card rounded-2xl p-5 ${plan.active ? "border-accent-300" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${plan.active ? "bg-green-50 text-green-700" : "bg-base-100 text-base-500"}`}>{plan.badge}</span>
                <h2 className="mt-4 text-lg font-bold text-base-900">{plan.name} Plan</h2>
              </div>
              <CreditCard className={`w-5 h-5 ${plan.active ? "text-accent-500" : "text-base-300"}`} />
            </div>
            <p className="mt-3 text-2xl font-bold text-base-900">{plan.price}</p>
            <p className="mt-2 text-sm text-base-500 min-h-12">{plan.description}</p>
            <div className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-base-600">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={!plan.active}
              className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${plan.active ? "bg-green-50 text-green-700" : "bg-base-100 text-base-400 cursor-not-allowed"}`}
            >
              {plan.active ? "Active plan" : "Razorpay integration later"}
            </button>
          </section>
        ))}
      </div>

      <section className="card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-base-800">Cost control setup</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-base-100 p-4">
            <Server className="w-4 h-4 text-green-500 mb-2" />
            <p className="text-sm font-semibold text-base-800">Local storage active</p>
            <p className="text-xs text-base-500 mt-1">No S3 bill while testing.</p>
          </div>
          <div className="rounded-xl border border-base-100 p-4">
            <Database className="w-4 h-4 text-green-500 mb-2" />
            <p className="text-sm font-semibold text-base-800">FAISS active</p>
            <p className="text-xs text-base-500 mt-1">No paid vector database needed.</p>
          </div>
          <div className="rounded-xl border border-base-100 p-4">
            <CreditCard className="w-4 h-4 text-accent-500 mb-2" />
            <p className="text-sm font-semibold text-base-800">Razorpay planned</p>
            <p className="text-xs text-base-500 mt-1">Add checkout only after the demo is stable.</p>
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
        <section className="card rounded-2xl p-5 lg:col-span-2">
          <Building2 className="w-5 h-5 text-accent-500 mb-4" />
          <h2 className="text-sm font-semibold text-base-800">Company Profile</h2>
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-base-400">Owner</p>
              <p className="mt-1 text-sm font-semibold text-base-800">{user?.name || "User"}</p>
            </div>
            <div>
              <p className="text-xs text-base-400">Email</p>
              <p className="mt-1 text-sm font-semibold text-base-800 break-all">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-base-400">Plan</p>
              <p className="mt-1 text-sm font-semibold text-green-600">Free Forever</p>
            </div>
            <div>
              <p className="text-xs text-base-400">Roles</p>
              <p className="mt-1 text-sm font-semibold text-base-800">Owner, Admin, Support Agent</p>
            </div>
          </div>
          <p className="text-xs text-base-400 mt-5">Company / Widget ID</p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-base-900 p-4 text-xs text-base-100"><code>{companyId}</code></pre>
        </section>

        <section className="card rounded-2xl p-5">
          <UserPlus className="w-5 h-5 text-green-500 mb-4" />
          <h2 className="text-sm font-semibold text-base-800">Invite Member</h2>
          <p className="mt-1 text-sm text-base-500">Demo UI for inviting teammates. Backend email sending can come later.</p>
          <form onSubmit={handleInvite} className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-base-500">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-300" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="member@company.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-base-200 text-sm focus:outline-none focus:border-accent-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-base-500">Role</label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-base-200 text-sm bg-white focus:outline-none focus:border-accent-400"
              >
                <option>Admin</option>
                <option>Support Agent</option>
              </select>
            </div>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-400 text-white rounded-xl text-sm font-semibold hover:bg-accent-500">
              <UserPlus className="w-4 h-4" />
              Prepare Invite
            </button>
          </form>
        </section>
      </div>

      <section className="card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-base-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-base-800">Team Members</h2>
            <p className="text-xs text-base-400 mt-1">Role-based access preview for the SaaS dashboard.</p>
          </div>
          <StatusBadge status="configured" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Member</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Role</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-base-400 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {members.map((member) => (
                <tr key={`${member.email}-${member.role}`}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-base-800">{member.name}</p>
                    <p className="text-xs text-base-400 mt-0.5">{member.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-base-600">{member.role}</td>
                  <td className="px-5 py-4"><StatusBadge status={member.status === "Active" ? "success" : "pending"} /></td>
                  <td className="px-5 py-4 text-sm text-base-500">{member.joined}</td>
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
    <section className="card rounded-2xl p-5">
      <Code2 className="w-5 h-5 text-accent-500 mb-4" />
      <h2 className="text-sm font-semibold text-base-800">Website iframe code</h2>
      <p className="mt-1 text-sm text-base-500">Paste this code into any website page where you want the chatbot to appear.</p>
      <div className="mt-4 grid lg:grid-cols-[1fr_auto] gap-3 items-start">
        <pre className="overflow-x-auto rounded-xl bg-base-900 p-4 text-xs text-base-100 whitespace-pre-wrap break-all"><code>{iframeCode}</code></pre>
        <button type="button" onClick={() => copy(iframeCode, "iframe")} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent-400 text-white rounded-xl text-sm font-semibold hover:bg-accent-500">
          {copied === "iframe" ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied === "iframe" ? "Copied" : "Copy iframe"}
        </button>
      </div>
      <h3 className="mt-6 text-xs font-semibold text-base-500 uppercase">Widget URL</h3>
      <div className="mt-3 flex flex-col lg:flex-row gap-3">
        <pre className="flex-1 overflow-x-auto rounded-xl bg-base-50 border border-base-100 p-4 text-xs text-base-700"><code>{widgetUrl}</code></pre>
        <button type="button" onClick={() => copy(widgetUrl, "url")} className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-base-200 text-base-600 rounded-xl text-sm font-semibold hover:bg-base-50">
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
      return { ...defaults, ...JSON.parse(localStorage.getItem("nexus_settings") || "{}") };
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
    localStorage.setItem("nexus_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const resetSettings = () => {
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
        <section className="card rounded-2xl p-5 lg:col-span-2">
          <Settings className="w-5 h-5 text-accent-500 mb-4" />
          <h2 className="text-sm font-semibold text-base-800">Workspace Settings</h2>
          <p className="mt-1 text-sm text-base-500">These preferences are saved locally for the demo dashboard.</p>

          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-base-500">Company name</span>
              <input
                type="text"
                value={settings.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-base-200 text-sm focus:outline-none focus:border-accent-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-base-500">Support email</span>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(event) => updateField("supportEmail", event.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-base-200 text-sm focus:outline-none focus:border-accent-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-base-500">Widget title</span>
              <input
                type="text"
                value={settings.widgetTitle}
                onChange={(event) => updateField("widgetTitle", event.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-base-200 text-sm focus:outline-none focus:border-accent-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-base-500">Monthly free request limit</span>
              <input
                type="number"
                min="1"
                value={settings.monthlyLimit}
                onChange={(event) => updateField("monthlyLimit", event.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-base-200 text-sm focus:outline-none focus:border-accent-400"
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium text-base-500 mb-2">Project mode</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {["Local-first", "Cloud-ready"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateField("responseMode", mode)}
                  className={`text-left rounded-xl border p-4 transition-colors ${settings.responseMode === mode ? "border-accent-300 bg-accent-50" : "border-base-100 hover:bg-base-50"}`}
                >
                  <p className="text-sm font-semibold text-base-800">{mode}</p>
                  <p className="mt-1 text-xs text-base-500">
                    {mode === "Local-first" ? "Use local uploads, MongoDB, and FAISS to control cost." : "Prepared for S3, EC2, and paid billing later."}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={saveSettings} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-400 text-white rounded-xl text-sm font-semibold hover:bg-accent-500">
              <CheckCircle className="w-4 h-4" />
              {saved ? "Saved" : "Save settings"}
            </button>
            <button type="button" onClick={resetSettings} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-base-200 text-base-600 rounded-xl text-sm font-semibold hover:bg-base-50">
              Reset defaults
            </button>
          </div>
        </section>

        <section className="card rounded-2xl p-5">
          <Shield className="w-5 h-5 text-green-500 mb-4" />
          <h2 className="text-sm font-semibold text-base-800">Provider Status</h2>
          {loading ? (
            <div className="mt-5 flex items-center gap-2 text-sm text-base-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking configuration
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-base-600">Gemini API</span>
                <StatusBadge status={data?.gemini?.configured ? "configured" : "missing"} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-base-600">MongoDB</span>
                <StatusBadge status={data?.database?.configured ? "configured" : "missing"} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-base-600">JWT Auth</span>
                <StatusBadge status={data?.jwt?.configured ? "configured" : "missing"} />
              </div>
              <div className="pt-4 border-t border-base-100">
                <p className="text-xs text-base-400">Chat model</p>
                <p className="mt-1 text-sm font-semibold text-base-800 break-all">{data?.gemini?.chatModel}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="card rounded-2xl p-5">
        <Server className="w-5 h-5 text-accent-500 mb-4" />
        <h2 className="text-sm font-semibold text-base-800">Local App URLs</h2>
        <div className="mt-5 space-y-3">
          {[
            { label: "Frontend", value: origin, type: "frontend" },
            { label: "Backend API", value: apiUrl, type: "api" },
            { label: "Widget URL", value: widgetUrl, type: "widget" },
          ].map((item) => (
            <div key={item.type} className="flex flex-col lg:flex-row lg:items-center gap-3 rounded-xl border border-base-100 p-3">
              <div className="lg:w-32 shrink-0">
                <p className="text-xs font-semibold text-base-400 uppercase">{item.label}</p>
              </div>
              <code className="flex-1 overflow-x-auto text-xs text-base-700">{item.value}</code>
              <div className="flex gap-2">
                <button type="button" onClick={() => copy(item.value, item.type)} className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-base-200 text-base-600 rounded-lg text-xs font-semibold hover:bg-base-50">
                  {copied === item.type ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === item.type ? "Copied" : "Copy"}
                </button>
                <button type="button" onClick={() => window.open(item.value, "_blank", "noopener,noreferrer")} className="inline-flex items-center justify-center px-3 py-2 border border-base-200 text-base-600 rounded-lg text-xs font-semibold hover:bg-base-50">
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
