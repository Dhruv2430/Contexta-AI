import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import useMobileSidebar from "../hooks/useMobileSidebar";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import Toast from "../components/Toast";
import { CardSkeleton, ChartSkeleton } from "../components/SkeletonLoader";
import {
  FileText,
  MessageSquare,
  Database,
  ArrowUpRight,
  Zap,
  RefreshCw,
  AlertCircle,
  Plus,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
} from "lucide-react";

const DashboardPage = () => {
  const { user } = useAuth();
  const { isOpen, toggle, close } = useMobileSidebar();
  const [stats, setStats] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gapsLoading, setGapsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/dashboard/stats");
      setStats(data);
      setError("");
    } catch {
      setError("Failed to load dashboard metrics. Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGaps = async () => {
    setGapsLoading(true);
    try {
      const { data } = await api.get("/gaps");
      setGaps(data.data || []);
    } catch {
      console.warn("Failed to load knowledge gaps.");
    } finally {
      setGapsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchGaps();
  }, []);

  const metrics = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "Indexed Documents",
        value: stats.documents ?? 0,
        change: "+12% this week",
        desc: "Active Knowledge Base",
        icon: FileText,
        color: "text-forest-600",
        bg: "bg-forest-50 border-forest-100",
      },
      {
        label: "Queries Handled",
        value: stats.chats ?? 0,
        change: "+28% query growth",
        desc: "RAG & Assistant chats",
        icon: MessageSquare,
        color: "text-accent-600",
        bg: "bg-accent-50 border-accent-100",
      },
      {
        label: "Processed Vector Docs",
        value: stats.processedDocs ?? 0,
        change: "100% Vectorized",
        desc: "FAISS Embedded",
        icon: Database,
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-100",
      },
    ];
  }, [stats]);

  const quickActions = [
    {
      label: "Upload Document",
      desc: "Add PDF to knowledge base",
      icon: Plus,
      link: "/documents",
    },
    {
      label: "Test AI Chat",
      desc: "Interact with your indexed data",
      icon: MessageSquare,
      link: "/chat",
    },
    {
      label: "View Analytics",
      desc: "Check usage metrics & charts",
      icon: LayoutDashboard,
      link: "/analytics",
    },
    {
      label: "Widget Embed",
      desc: "Deploy chatbot on your site",
      icon: Zap,
      link: "/widget-embed",
    },
  ];

  const maxChats = stats?.dailyChats
    ? Math.max(...stats.dailyChats.map((d) => d.count), 1)
    : 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex">
      <Sidebar active="Dashboard" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />

        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-forest-50/30 p-6 rounded-2xl border border-slate-200/70 shadow-xs"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-forest-100 text-forest-700 text-[11px] font-bold uppercase tracking-wider">
                  Overview
                </span>
                <span className="text-xs text-slate-400 font-medium">• Live Telemetry</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
                Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                Here is what is happening across your AI vector knowledge engine today.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  fetchStats();
                  setToastMsg("Dashboard metrics refreshed!");
                }}
                className="btn-secondary px-3 py-2 text-xs font-bold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>
          </motion.div>

          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3 text-sm font-semibold shadow-xs"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Metrics Grid */}
              {loading ? (
                <CardSkeleton count={3} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {metrics.map((m, i) => (
                    <motion.div
                      key={i}
                      variants={itemVariants}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="card p-6 bg-white border border-slate-200/70 shadow-xs hover:shadow-md hover:border-forest-200 transition-all text-left relative overflow-hidden group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`w-11 h-11 rounded-xl ${m.bg} border flex items-center justify-center shadow-xs transition-transform group-hover:scale-110`}
                        >
                          <m.icon className={`w-5.5 h-5.5 ${m.color}`} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          {m.change}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                          {m.value}
                        </h3>
                        <p className="text-xs font-bold text-slate-700 mt-1">{m.label}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>{m.desc}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-forest-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Chart & Quick Actions Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* 7-Day Chart Area */}
                <motion.div
                  variants={itemVariants}
                  className="card p-6 lg:col-span-2 bg-white border border-slate-200/70 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-6 text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-forest-600" />
                        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                          Chat Volume (7 Days)
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Queries processed across your RAG components and support widgets
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      Last 7 Days
                    </span>
                  </div>

                  {loading ? (
                    <ChartSkeleton />
                  ) : (
                    <div className="h-60 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
                      {stats?.dailyChats?.length > 0 ? (
                        stats.dailyChats.map((day, i) => {
                          const heightPct = Math.max((day.count / maxChats) * 100, 8);
                          return (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative"
                            >
                              <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden h-full flex items-end">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${heightPct}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.05 }}
                                  className="w-full bg-gradient-to-t from-forest-700 to-forest-500 rounded-t-lg group-hover:from-forest-800 group-hover:to-forest-600 transition-all relative"
                                >
                                  {/* Tooltip */}
                                  <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg font-bold transition-all pointer-events-none z-20 shadow-lg whitespace-nowrap">
                                    {day.count} query{day.count !== 1 ? "s" : ""}
                                  </div>
                                </motion.div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                                {day.label}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                          No query history available yet.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 text-forest-700 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-forest-600" /> Gemini API Latency ~180ms
                    </span>
                    <span>Auto-synced</span>
                  </div>
                </motion.div>

                {/* Quick Actions List */}
                <motion.div
                  variants={itemVariants}
                  className="card p-6 bg-white border border-slate-200/70 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-4 text-left">
                      Quick Management
                    </h2>
                    <div className="space-y-3">
                      {quickActions.map((action, i) => (
                        <Link
                          key={i}
                          to={action.link}
                          className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/60 hover:border-forest-200 transition-all cursor-pointer no-underline group text-left shadow-xs hover:shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-forest-600 group-hover:scale-105 transition-transform shadow-xs">
                            <action.icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-bold text-slate-800 group-hover:text-forest-700 truncate">
                              {action.label}
                            </h3>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                              {action.desc}
                            </p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-forest-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-forest-50/60 border border-forest-100 text-left">
                    <div className="flex items-center gap-2 text-forest-800 text-xs font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 text-forest-600" /> Need Help?
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Check system logs or test questions live in the Chat Playground.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Knowledge Gaps Panel */}
              <motion.div
                variants={itemVariants}
                className="card p-6 bg-white border border-slate-200/70 shadow-xs text-left mt-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Knowledge Gaps Detected
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Unanswered questions flagged when vector match distance exceeds confidence threshold
                    </p>
                  </div>
                  <button
                    onClick={fetchGaps}
                    className="p-2 rounded-lg text-slate-400 hover:text-forest-700 hover:bg-slate-100 transition-colors"
                    title="Refresh gaps"
                  >
                    <RefreshCw className={`w-4 h-4 ${gapsLoading ? "animate-spin text-forest-600" : ""}`} />
                  </button>
                </div>

                {gapsLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading knowledge gaps...</div>
                ) : gaps.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {gaps.map((gap) => (
                      <div key={gap._id || gap.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{gap.question}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Logged {new Date(gap.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {gap.confidenceScore !== null && gap.confidenceScore !== undefined && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold">
                              L2 Score: {Number(gap.confidenceScore).toFixed(3)}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                            Flagged Gap
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                    No knowledge gaps detected yet. All user questions passed vector confidence thresholds.
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg("")} />
    </div>
  );
};

export default DashboardPage;
