import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  Bot,
  LayoutDashboard,
  FileText,
  Cpu,
  GitBranch,
  BarChart3,
  Rocket,
  Key,
  ScrollText,
  CreditCard,
  Users,
  Settings,
  X,
  Code2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const routeMap = {
  Dashboard: "/dashboard",
  Documents: "/documents",
  "Chat Testing": "/chat",
  "RAG Pipeline": "/rag-pipeline",
  Analytics: "/analytics",
  "Widget Embed": "/widget-embed",
  Logs: "/logs",
  Billing: "/billing",
  Team: "/team",
  Settings: "/settings",
};

const topNav = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: FileText, label: "Documents" },
  { icon: Bot, label: "Chat Testing" },
  { icon: GitBranch, label: "RAG Pipeline" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Code2, label: "Widget Embed" },
  { icon: ScrollText, label: "Logs" },
];

const bottomNav = [
  { icon: CreditCard, label: "Billing" },
  { icon: Users, label: "Team" },
  { icon: Settings, label: "Settings" },
];

const Sidebar = ({ active, mobileOpen = false, onMobileClose }) => {
  const location = useLocation();

  const currentActive =
    active ||
    Object.entries(routeMap).find(([, path]) => location.pathname === path)?.[0] ||
    "Dashboard";

  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const renderNavGroup = (items) => (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = item.label === currentActive;
        const href = routeMap[item.label];

        return (
          <Link
            key={item.label}
            to={href}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer no-underline group ${
              isActive
                ? "text-forest-700 font-bold bg-forest-50/80 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-forest-600"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <item.icon
              className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? "text-forest-600" : "text-slate-400 group-hover:text-slate-700"
              }`}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <Link to="/dashboard" className="flex items-center gap-3 group no-underline">
          <img
            src="/logo.png"
            alt="Contexta-AI Logo"
            className="w-8 h-8 rounded-xl object-contain transition-all duration-300 group-hover:scale-105 shadow-md shadow-forest-200/50"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-900 font-display flex items-center gap-1.5">
              Contexta-AI
              <span className="px-1.5 py-0.5 rounded-md bg-forest-50 text-forest-700 text-[9px] font-extrabold uppercase tracking-wider border border-forest-100/60">
                PRO
              </span>
            </span>
            <span className="text-[10px] font-medium text-slate-400">Knowledge Engine</span>
          </div>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border-0 bg-transparent"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Infrastructure
          </p>
          {renderNavGroup(topNav)}
        </div>
      </nav>

      {/* Footer Navigation & Upgrade Badge */}
      <div className="px-3 pb-5 space-y-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-forest-50/80 to-accent-50/50 border border-forest-100/60 space-y-2">
          <div className="flex items-center gap-2 text-forest-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-forest-600 shrink-0" />
            <span>RAG Engine v4.2</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Gemini 1.5 Flash + FAISS Vector Pipeline active.
          </p>
        </div>

        <div className="h-px bg-slate-100 mx-1" />

        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Account
          </p>
          {renderNavGroup(bottomNav)}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 bg-white text-slate-800 shrink-0 border-r border-slate-200/70 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/30 z-40 md:hidden backdrop-blur-xs"
              onClick={onMobileClose}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-68 bg-white text-slate-800 z-50 md:hidden flex flex-col shadow-2xl border-r border-slate-200/70"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
