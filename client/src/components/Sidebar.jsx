import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Bot, LayoutDashboard, FileText, Cpu, GitBranch, BarChart3, Rocket, Key, ScrollText, CreditCard, Users, Settings, X, Code2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Sidebar — desktop persistent + mobile drawer
//
// FIXES:
// - Added mobile drawer mode with backdrop overlay and slide animation
// - Closes on route change and click-outside
// ---------------------------------------------------------------------------

// Route map: sidebar label → frontend path
const routeMap = {
  Dashboard: "/dashboard",
  Documents: "/documents",
  "Chat Testing": "/chat",
  "AI Models": "/ai-models",
  "RAG Pipeline": "/rag-pipeline",
  Analytics: "/analytics",
  "Widget Embed": "/widget-embed",
  Deployments: "/deployments",
  "API Keys": "/api-keys",
  Logs: "/logs",
  Billing: "/billing",
  Team: "/team",
  Settings: "/settings",
};

const topNav = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: FileText, label: "Documents" },
  { icon: Bot, label: "Chat Testing" },
  { icon: Cpu, label: "AI Models" },
  { icon: GitBranch, label: "RAG Pipeline" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Code2, label: "Widget Embed" },
  { icon: Rocket, label: "Deployments" },
  { icon: Key, label: "API Keys" },
  { icon: ScrollText, label: "Logs" },
];
const bottomNav = [
  { icon: CreditCard, label: "Billing" },
  { icon: Users, label: "Team" },
  { icon: Settings, label: "Settings" },
];

const Sidebar = ({ active, mobileOpen = false, onMobileClose }) => {
  const location = useLocation();

  // Determine active item from prop or current path
  const currentActive = active || Object.entries(routeMap).find(([, path]) => location.pathname === path)?.[0] || "Dashboard";

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-5 py-6">
        <Link to="/dashboard" className="flex items-center gap-3 group no-underline">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <Bot className="w-4.5 h-4.5 text-slate-950 font-bold" />
          </div>
          <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
            Contexta-AI
          </span>
        </Link>
        {/* Close button - mobile only */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 mt-2 space-y-1 overflow-y-auto">
        {topNav.map((item) => {
          const isActive = item.label === currentActive;
          const href = routeMap[item.label];

          return (
            <Link key={item.label} to={href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 cursor-pointer no-underline border-l-2
                ${isActive 
                  ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/5 text-cyan-400 font-semibold border-cyan-400" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border-transparent"}`}>
              <item.icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "scale-105 text-cyan-400" : "group-hover:scale-105"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="h-px bg-slate-900 mx-3 my-3" />
      <nav className="px-3 pb-6 space-y-1">
        {bottomNav.map((item) => {
          const isActive = item.label === currentActive;

          return (
            <Link key={item.label} to={routeMap[item.label]} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 cursor-pointer no-underline border-l-2
                ${isActive 
                  ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/5 text-cyan-400 font-semibold border-cyan-400" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 border-transparent"}`}>
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex flex-col w-56 h-screen sticky top-0 bg-[#080C16] text-white shrink-0 border-r border-slate-900/80">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — drawer with backdrop */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="fixed inset-y-0 left-0 w-64 bg-[#080C16] text-white z-50 md:hidden flex flex-col shadow-2xl border-r border-slate-900"
            style={{ animation: "slide-in-left 0.25s ease-out" }}
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
