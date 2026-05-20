import { useEffect, useState, useCallback, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ChatUI from "../components/ChatUI";
import useMobileSidebar from "../hooks/useMobileSidebar";
import api from "../services/api";
import { Loader2, Trash2 } from "lucide-react";

// ---------------------------------------------------------------------------
// ChatPage — Dashboard chat with persistent history
//
// FIXES:
// - Fetches chat history from GET /api/chat/history on mount
// - Clear history button
// - Passes initialMessages to ChatUI for history restoration
// ---------------------------------------------------------------------------

const ChatPage = () => {
  const [initialMessages, setInitialMessages] = useState(null); // null = loading
  const [historyError, setHistoryError] = useState("");
  const { isOpen, toggle, close } = useMobileSidebar();

  // Fetch chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await api.get("/chat/history?limit=50");
        if (data.chats && data.chats.length > 0) {
          const messages = [];
          data.chats.forEach((chat) => {
            messages.push({ id: `h-q-${chat.id}`, role: "user", text: chat.question, sources: [] });
            messages.push({ id: `h-a-${chat.id}`, role: "ai", text: chat.answer, sources: chat.sources || [] });
          });
          setInitialMessages(messages);
        } else {
          setInitialMessages([]); // No history, use default greeting
        }
      } catch (err) {
        console.warn("Failed to load chat history:", err);
        setHistoryError("Could not load previous chats.");
        setInitialMessages([]);
      }
    };
    loadHistory();
  }, []);

  const handleSendMessage = useCallback(async (question) => {
    const { data } = await api.post("/chat", { question });
    return { answer: data.answer, sources: data.sources || [] };
  }, []);

  const handleClearHistory = useCallback(async () => {
    if (!confirm("Clear all chat history? This cannot be undone.")) return;
    try {
      await api.delete("/chat/history");
      // Force re-render with empty initial messages
      setInitialMessages([]);
      // Small hack: reset key to remount ChatUI
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex animate-fade-in">
      <Sidebar active="Chat Testing" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-900">
            <div>
              <h1 className="text-lg font-bold text-white">Chat Testing</h1>
              <p className="text-xs text-slate-400">Ask questions about your uploaded documents</p>
            </div>
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-900/60 hover:border-red-500/20 rounded-xl transition-colors cursor-pointer bg-transparent"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-[#070A13]">
            {initialMessages === null ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <ChatUI
                onSendMessage={handleSendMessage}
                title="Contexta-AI Assistant"
                initialMessages={initialMessages}
              />
            )}
          </div>
          {historyError && (
            <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-amber-400 text-xs text-center">{historyError}</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
