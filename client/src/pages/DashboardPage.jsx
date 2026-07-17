import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import useMobileSidebar from "../hooks/useMobileSidebar";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import {
  FileText, MessageSquare, Database, ArrowUpRight, Zap, RefreshCw, AlertCircle, Plus, LayoutDashboard
} from "lucide-react";

// ---------------------------------------------------------------------------
// DashboardPage
//
// FIXES:
// - Uses real metrics from /dashboard/stats instead of fake data
// - Real quick action links
// ---------------------------------------------------------------------------

const DashboardPage = () => {
  const { user } = useAuth();
  const { isOpen, toggle, close } = useMobileSidebar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data);
      } catch {
        setError("Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const metrics = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Total Documents", value: stats.documents, change: "+0% this week", icon: FileText, color: "text-forest-600", bg: "bg-forest-50 border-forest-100/50" },
      { label: "Total Chats", value: stats.chats, change: "+0% this week", icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50 border-purple-100/50" },
      { label: "Processed Docs", value: stats.processedDocs || 0, change: "AI Indexed", icon: Database, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100/50" },
    ];
  }, [stats]);

  const quickActions = [
    { label: "Upload Document", desc: "Add PDF to knowledge base", icon: Plus, link: "/documents" },
    { label: "Test AI Chat", desc: "Interact with your data", icon: MessageSquare, link: "/chat" },
    { label: "View Analytics", desc: "Check usage metrics", icon: LayoutDashboard, link: "/analytics" },
    { label: "API Configuration", desc: "Manage Gemini & DB keys", icon: Zap, link: "/api-keys" },
  ];

  const maxChats = stats?.dailyChats ? Math.max(...stats.dailyChats.map(d => d.count), 1) : 1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex">
      <Sidebar active="Dashboard" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />
        <main className="flex-1 p-6 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-display">Welcome back, {user?.name?.split(" ")[0] || "User"}</h1>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">Here is what is happening with your AI infrastructure today.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-55 bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-700 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> System Operational
              </span>
            </div>
          </div>

          {error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-xl p-6 animate-pulse shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 mb-4" />
                      <div className="h-8 bg-slate-100 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                    </div>
                  ))
                ) : (
                  metrics.map((m, i) => (
                    <div key={i} className="card p-6 group hover:border-forest-500 shadow-sm hover:shadow-md transition-all duration-200 text-left bg-white border border-slate-200/60">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg ${m.bg} border flex items-center justify-center shadow-sm`}>
                          <m.icon className={`w-5 h-5 ${m.color}`} />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-forest-600 transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight font-display">{m.value}</h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1">{m.label}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-medium text-slate-400">{m.change}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="card p-6 lg:col-span-2 bg-white border border-slate-200/60 shadow-sm">
                  <div className="flex items-center justify-between mb-6 text-left">
                    <div>
                      <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Chat Volume (7 Days)</h2>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Queries processed across your widgets</p>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
                    {loading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-forest-600 animate-spin" />
                      </div>
                    ) : stats?.dailyChats?.length > 0 ? (
                      stats.dailyChats.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                          <div
                            className="w-full bg-forest-600 rounded-t hover:bg-forest-700 transition-all duration-200 relative shadow-sm"
                            style={{ height: `${Math.max((day.count / maxChats) * 100, 6)}%` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md font-semibold transition-opacity pointer-events-none z-10 shadow-md whitespace-nowrap">
                              {day.count} chat{day.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">{day.label}</span>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-slate-400 pb-6">
                        No chat data available.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card p-6 bg-white border border-slate-200/60 shadow-sm">
                  <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-6 text-left">Quick Actions</h2>
                  <div className="space-y-3">
                    {quickActions.map((action, i) => (
                      <Link
                        key={i}
                        to={action.link}
                        className="flex items-center gap-4 p-3 rounded-lg bg-white hover:bg-slate-50/50 border border-slate-200/60 hover:border-forest-150 transition-all cursor-pointer no-underline group shadow-sm"
                      >
                        <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-forest-600">
                          <action.icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h3 className="text-xs font-semibold text-slate-700 group-hover:text-forest-600 truncate">{action.label}</h3>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{action.desc}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
