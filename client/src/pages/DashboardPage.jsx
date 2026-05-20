import { useEffect, useState, useCallback, useMemo } from "react";
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
      } catch (err) {
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
      { label: "Total Documents", value: stats.documents, change: "+0% this week", icon: FileText, color: "text-accent-500", bg: "bg-accent-50" },
      { label: "Total Chats", value: stats.chats, change: "+0% this week", icon: MessageSquare, color: "text-green-500", bg: "bg-green-50" },
      { label: "Processed Docs", value: stats.processedDocs || 0, change: "AI Indexed", icon: Database, color: "text-warn-500", bg: "bg-warn-50" },
    ];
  }, [stats]);

  const quickActions = [
    { label: "Upload Document", desc: "Add PDF to knowledge base", icon: Plus, link: "/documents", color: "text-accent-500" },
    { label: "Test AI Chat", desc: "Interact with your data", icon: MessageSquare, link: "/chat", color: "text-green-500" },
    { label: "View Analytics", desc: "Check usage metrics", icon: LayoutDashboard, link: "/analytics", color: "text-warn-500" },
    { label: "API Configuration", desc: "Manage Gemini & DB keys", icon: Zap, link: "/api-keys", color: "text-red-500" },
  ];

  const maxChats = stats?.dailyChats ? Math.max(...stats.dailyChats.map(d => d.count), 1) : 1;

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex">
      <Sidebar active="Dashboard" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Welcome back, {user?.name?.split(" ")[0] || "User"}</h1>
              <p className="text-sm text-slate-400 mt-1">Here is what is happening with your AI infrastructure today.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> System Operational
              </span>
            </div>
          </div>

          {error ? (
            <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-[#0A0F1D] border border-slate-950 rounded-2xl p-5 sm:p-6 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 mb-4" />
                      <div className="h-8 bg-slate-900 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-slate-900 rounded w-1/3" />
                    </div>
                  ))
                ) : (
                  metrics.map((m, i) => (
                    <div key={i} className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 sm:p-6 group hover:-translate-y-1 hover:border-slate-800/80 transition-all duration-300 shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                          <m.icon className={`w-5 h-5 ${m.color}`} />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-extrabold text-white tracking-tight">{m.value}</h3>
                        <p className="text-sm font-semibold text-slate-400 mt-1">{m.label}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-900">
                        <p className="text-[11px] font-semibold text-emerald-400">{m.change}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 sm:p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-sm font-bold text-white">Chat Volume (7 Days)</h2>
                      <p className="text-xs text-slate-400 mt-1">Queries processed across your widgets</p>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-slate-900">
                    {loading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
                      </div>
                    ) : stats?.dailyChats?.length > 0 ? (
                      stats.dailyChats.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                          <div
                            className="w-full bg-gradient-to-t from-cyan-500/20 to-cyan-400 rounded-t-lg group-hover:from-cyan-400 group-hover:to-cyan-300 transition-all duration-300 relative shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                            style={{ height: `${Math.max((day.count / maxChats) * 100, 6)}%` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-950 text-cyan-400 border border-slate-900 text-[10px] py-1 px-2 rounded font-semibold transition-opacity pointer-events-none z-10 shadow-xl whitespace-nowrap">
                              {day.count} chat{day.count !== 1 ? 's' : ''}
                            </div>
                            <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-300 rounded-t-lg shadow-[0_0_8px_#22d3ee]" />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">{day.label}</span>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-slate-500 pb-6">
                        No chat data available.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-[#0A0F1D] border border-slate-900/60 rounded-2xl p-5 sm:p-6">
                  <h2 className="text-sm font-bold text-white mb-6">Quick Actions</h2>
                  <div className="space-y-3">
                    {quickActions.map((action, i) => (
                      <Link
                        key={i}
                        to={action.link}
                        className="flex items-center gap-4 p-3 rounded-xl bg-[#080C16]/40 hover:bg-[#080C16]/80 border border-slate-900/60 hover:border-slate-800/40 transition-all cursor-pointer no-underline group"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-[#0A0F1D] group-hover:bg-slate-900 flex items-center justify-center border border-slate-900 shrink-0 transition-colors`}>
                          <action.icon className={`w-4.5 h-4.5 ${action.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-200 truncate">{action.label}</h3>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{action.desc}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
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
