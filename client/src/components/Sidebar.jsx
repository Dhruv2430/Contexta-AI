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
          <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center transition-transform duration-200 shadow-md shadow-forest-100">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 font-display">
            Contexta-AI
          </span>
        </Link>
        {/* Close button - mobile only */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 cursor-pointer no-underline border-l-2
                ${isActive
                  ? "bg-forest-50/70 text-forest-600 font-semibold border-forest-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent"}`}>
              <item.icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "text-forest-600" : "text-slate-400 group-hover:text-slate-700"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="h-px bg-slate-100 mx-3 my-3" />
      <nav className="px-3 pb-6 space-y-1">
        {bottomNav.map((item) => {
          const isActive = item.label === currentActive;

          return (
            <Link key={item.label} to={routeMap[item.label]}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 cursor-pointer no-underline border-l-2
                ${isActive
                  ? "bg-forest-50/70 text-forest-600 font-semibold border-forest-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent"}`}>
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-forest-600" : "text-slate-400"}`} />
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
      <aside className="hidden md:flex flex-col w-56 h-screen sticky top-0 bg-white text-slate-800 shrink-0 border-r border-slate-200/60">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar — drawer with backdrop */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/20 z-40 md:hidden backdrop-blur-xs"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="fixed inset-y-0 left-0 w-64 bg-white text-slate-800 z-50 md:hidden flex flex-col shadow-xl border-r border-slate-200/60"
            style={{ animation: "slide-in-left 0.2s ease-out" }}
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
