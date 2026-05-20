import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import useAuth from "../hooks/useAuth";

// ---------------------------------------------------------------------------
// Topbar — top navigation bar
//
// FIXES APPLIED:
// - Removed fake search bar (non-functional)
// - Removed fake notification bell (non-functional badge)
// - Replaced instant-logout on avatar click with a real dropdown menu
// - Added hamburger menu button for mobile sidebar toggle
// ---------------------------------------------------------------------------

const Topbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
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

  // Close dropdown on Escape
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

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#080C16]/80 backdrop-blur-xl border-b border-slate-900/60 px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      {/* Left: Hamburger (mobile) + Page context */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Right: User dropdown */}
      <div className="flex items-center gap-3 ml-auto" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setShowLogoutConfirm(false);
            }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-900/60 transition-colors duration-200 cursor-pointer"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/10">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold leading-tight text-slate-200">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-400 leading-tight">Free Plan</p>
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#0A0F1D] border border-slate-900 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-slate-900">
                <p className="text-sm font-bold text-slate-200 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 transition-colors cursor-pointer no-underline"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  Settings
                </Link>
                <Link
                  to="/team"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 transition-colors cursor-pointer no-underline"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  Profile
                </Link>
              </div>

              {/* Logout Section */}
              <div className="border-t border-slate-900 py-1">
                {showLogoutConfirm ? (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs text-slate-400">Are you sure you want to log out?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={confirmLogout}
                        className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors cursor-pointer border-0"
                      >
                        Log Out
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer border-0"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer border-0 bg-transparent text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    Log Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
