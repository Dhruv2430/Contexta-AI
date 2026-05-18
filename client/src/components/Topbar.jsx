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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-base-100 px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      {/* Left: Hamburger (mobile) + Page context */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-base-100 transition-colors duration-200 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5 text-base-600" />
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
            className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-base-100 transition-colors duration-200 cursor-pointer"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-400 to-green-400 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight text-base-800">{user?.name || "User"}</p>
              <p className="text-[10px] text-base-400 leading-tight">Free Plan</p>
            </div>
            <ChevronDown className={`w-3 h-3 text-base-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-base-200 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-base-100">
                <p className="text-sm font-semibold text-base-800 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-base-400 truncate">{user?.email || ""}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-base-600 hover:bg-base-50 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <Link
                  to="/team"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-base-600 hover:bg-base-50 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </Link>
              </div>

              {/* Logout Section */}
              <div className="border-t border-base-100 py-1">
                {showLogoutConfirm ? (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-xs text-base-500">Are you sure you want to log out?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={confirmLogout}
                        className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Log Out
                      </button>
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 px-3 py-1.5 bg-base-100 text-base-600 rounded-lg text-xs font-medium hover:bg-base-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
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
