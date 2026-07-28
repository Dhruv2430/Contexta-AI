import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ChatUI from "../components/ChatUI";
import useMobileSidebar from "../hooks/useMobileSidebar";
import api from "../services/api";
import Toast from "../components/Toast";
import { Loader2, Trash2, Bot, Sparkles } from "lucide-react";

const ChatPage = () => {
  const [initialMessages, setInitialMessages] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const { isOpen, toggle, close } = useMobileSidebar();

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
          setInitialMessages([]);
        }
      } catch (err) {
        console.warn("Failed to load chat history:", err);
        setHistoryError("Could not load previous chats.");
        setInitialMessages([]);
      }
    };
    loadHistory();
  }, []);

  const handleSendMessage = useCallback(async (question, history) => {
    const { data } = await api.post("/chat", { question, history });
    return { answer: data.answer, sources: data.sources || [] };
  }, []);

  const handleClearHistory = useCallback(async () => {
    if (!confirm("Clear all persistent chat history?")) return;
    try {
      await api.delete("/chat/history");
      setInitialMessages([]);
      setToastMsg("Chat history cleared");
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex">
      <Sidebar active="Chat Testing" mobileOpen={isOpen} onMobileClose={close} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Topbar onMenuToggle={toggle} />
        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden max-w-7xl mx-auto w-full">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-6 rounded-2xl border border-slate-200/70 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-forest-600" />
                <h1 className="text-lg font-bold tracking-tight text-slate-900 font-display">
                  RAG Chat Playground
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Test question retrieval against your uploaded knowledge base documents.
              </p>
            </div>
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200/70 rounded-xl transition-all cursor-pointer bg-white shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {initialMessages === null ? (
              <div className="card flex items-center justify-center h-full bg-white">
                <Loader2 className="w-6 h-6 text-forest-600 animate-spin" />
              </div>
            ) : (
              <ChatUI
                onSendMessage={handleSendMessage}
                title="Contexta-AI RAG Playground"
                initialMessages={initialMessages}
              />
            )}
          </div>
        </main>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg("")} />
    </div>
  );
};

export default ChatPage;
