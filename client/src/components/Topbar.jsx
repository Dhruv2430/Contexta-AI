import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, ChevronDown, LogOut, Settings, User as UserIcon, Shield, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../hooks/useAuth";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/documents": "Knowledge Base & Documents",
  "/chat": "AI Chat Playground",
  "/ai-models": "AI Models & Provider Settings",
  "/rag-pipeline": "RAG Pipeline Configuration",
  "/analytics": "Usage & Performance Analytics",
  "/widget-embed": "Widget Deployment & Embed Code",
  "/deployments": "Active Production Deployments",
  "/api-keys": "API Keys & Credentials",
  "/logs": "Audit & System Query Logs",
  "/billing": "Plan & Billing",
  "/team": "Team Members & Permissions",
  "/settings": "System Settings",
};

const Topbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  const currentTitle = pageTitles[location.pathname] || "Dashboard";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setShowLogoutConfirm(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [dropdownOpen]);

  const confirmLogout = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-6 h-15 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 transition-colors duration-200 cursor-pointer border-0 bg-transparent"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-sm font-bold text-slate-900 font-display tracking-tight leading-none">
            {currentTitle}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium hidden sm:block mt-0.5">
            Contexta-AI Platform
          </p>
        </div>
      </div>

      {/* Right: Quick Badge & User Dropdown */}
      <div className="flex items-center gap-3 ml-auto" ref={dropdownRef}>
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/80 border border-emerald-100 text-[10px] font-bold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Engine Operational
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setShowLogoutConfirm(false);
            }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/80 transition-all duration-200 cursor-pointer border-0 bg-transparent group"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-600 flex items-center justify-center text-xs font-bold text-white shadow-sm group-hover:scale-105 transition-transform">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-tight text-slate-900 truncate max-w-[120px]">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight truncate">
                Admin Plan
              </p>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180 text-slate-700" : ""
              }`}
            />
          </button>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "User"}</p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">{user?.email || ""}</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-forest-50 text-forest-700 text-[10px] font-bold border border-forest-100">
                    <Shield className="w-3 h-3 text-forest-600" /> Account Owner
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors no-underline"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </Link>
                  <Link
                    to="/team"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors no-underline"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Team & Access
                  </Link>
                </div>

                {/* Logout Option */}
                <div className="border-t border-slate-100 py-1">
                  {showLogoutConfirm ? (
                    <div className="px-4 py-3 space-y-2.5">
                      <p className="text-xs text-slate-600 font-medium">Log out of Contexta-AI?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={confirmLogout}
                          className="btn-forest flex-1 py-1.5 text-xs font-bold rounded-lg"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowLogoutConfirm(false)}
                          className="btn-secondary flex-1 py-1.5 text-xs font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-colors cursor-pointer border-0 bg-transparent text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      Sign Out
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
