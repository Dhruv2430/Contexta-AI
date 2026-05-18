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
    <div className="min-h-screen bg-base-50 flex">
      <Sidebar active="Dashboard" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-base-900">Welcome back, {user?.name?.split(" ")[0] || "User"}</h1>
              <p className="text-sm text-base-500 mt-1">Here is what is happening with your AI infrastructure today.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-[11px] font-semibold text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> System Operational
              </span>
            </div>
          </div>

          {error ? (
            <div className="p-4 bg-red-50 text-red-500 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card rounded-2xl p-5 sm:p-6 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-base-200 mb-4" />
                      <div className="h-8 bg-base-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-base-200 rounded w-1/3" />
                    </div>
                  ))
                ) : (
                  metrics.map((m, i) => (
                    <div key={i} className="card rounded-2xl p-5 sm:p-6 group hover:-translate-y-1 transition-all duration-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                          <m.icon className={`w-5 h-5 ${m.color}`} />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-base-300 group-hover:text-base-500 transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-base-900">{m.value}</h3>
                        <p className="text-sm font-medium text-base-500 mt-1">{m.label}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-base-100">
                        <p className="text-[11px] font-semibold text-green-500">{m.change}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Chart Area */}
                <div className="card rounded-2xl p-5 sm:p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-sm font-bold text-base-900">Chat Volume (7 Days)</h2>
                      <p className="text-xs text-base-500 mt-1">Queries processed across your widgets</p>
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {loading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-base-300 animate-spin" />
                      </div>
                    ) : stats?.dailyChats?.length > 0 ? (
                      stats.dailyChats.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                          <div
                            className="w-full bg-accent-100 rounded-t-lg group-hover:bg-accent-400 transition-all duration-300 relative"
                            style={{ height: `${Math.max((day.count / maxChats) * 100, 4)}%` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-base-900 text-white text-[10px] py-1 px-2 rounded font-medium transition-opacity pointer-events-none">
                              {day.count}
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-base-400">{day.label}</span>
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-base-400">
                        No chat data available.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card rounded-2xl p-5 sm:p-6">
                  <h2 className="text-sm font-bold text-base-900 mb-6">Quick Actions</h2>
                  <div className="space-y-3">
                    {quickActions.map((action, i) => (
                      <Link
                        key={i}
                        to={action.link}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-base-50 border border-transparent hover:border-base-100 transition-all cursor-pointer no-underline group"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-base-50 group-hover:bg-white flex items-center justify-center border border-base-100 shrink-0 transition-colors`}>
                          <action.icon className={`w-4 h-4 ${action.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-base-900 truncate">{action.label}</h3>
                          <p className="text-xs text-base-500 truncate mt-0.5">{action.desc}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-base-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
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
