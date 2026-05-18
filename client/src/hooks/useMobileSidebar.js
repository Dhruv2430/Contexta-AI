import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Shared state hook for mobile sidebar visibility.
// Used by both Topbar (hamburger button) and Sidebar (drawer).
// ---------------------------------------------------------------------------
const useMobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
};

export default useMobileSidebar;
