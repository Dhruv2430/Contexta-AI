import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// ChatUI Component
//
// A reusable, polished chat interface. Completely decoupled from API logic.
// Takes an `onSendMessage` prop so it can be used inside both the
// authenticated Dashboard and the public Iframe Widget.
//
// FIXES:
// - Accepts `initialMessages` prop for history restoration
// - Uses stable keys instead of array indices
// - Memoized handleSubmit
// ---------------------------------------------------------------------------

let messageCounter = 0;
const nextId = () => `msg-${Date.now()}-${++messageCounter}`;

const ChatUI = ({ onSendMessage, title = "AI Assistant", initialMessages = [] }) => {
  const [messages, setMessages] = useState(() => {
    if (initialMessages.length > 0) return initialMessages.map((m) => ({ ...m, id: m.id || nextId() }));
    return [
      {
        id: nextId(),
        role: "ai",
        text: "Hello! I am your AI assistant. Ask me anything about the uploaded documents.",
        sources: [],
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // Update messages when initialMessages changes (e.g. history loaded)
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages.map((m) => ({ ...m, id: m.id || nextId() })));
    }
  }, [initialMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: nextId(), role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await onSendMessage(userMessage.text);

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "ai",
          text: response.answer,
          sources: response.sources || [],
        },
      ]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to get an answer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, onSendMessage]);

  return (
    <div className="flex flex-col h-full bg-[#0A0F1D] relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-900 flex items-center gap-3 bg-[#0A0F1D]/80 backdrop-blur-md z-10">
        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Bot className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 p-3 flex items-center gap-2 text-sm text-red-400 border-b border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#070A13]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
              msg.role === "user" ? "bg-slate-900 border-slate-800" : "bg-cyan-500/10 border-cyan-500/20 shadow-sm"
            }`}>
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-slate-300" />
              ) : (
                <Bot className="w-4 h-4 text-cyan-400" />
              )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-cyan-500 text-slate-950 font-bold rounded-tr-sm shadow-lg shadow-cyan-500/10"
                  : "bg-[#0A0F1D] text-slate-100 rounded-tl-sm border border-slate-900 shadow-md"
              }`}>
                {msg.text}
              </div>

              {/* Sources */}
              {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">Sources:</span>
                  {msg.sources.map((s, i) => (
                    <span key={`${msg.id}-src-${i}`} className="px-2.5 py-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-800 text-slate-300 rounded-lg text-[10px] truncate max-w-[150px] transition-colors font-medium">
                      {s.filename}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[#0A0F1D] rounded-tl-sm border border-slate-900 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0A0F1D] border-t border-slate-900">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question..."
            className="w-full pl-4 pr-12 py-3 bg-[#070A13] border border-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/15 focus:border-cyan-400 transition-all disabled:opacity-50 text-slate-100 placeholder-slate-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 disabled:opacity-50 text-slate-950 rounded-lg transition-colors cursor-pointer border-0 shadow-md shadow-cyan-500/10"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4 text-slate-950 font-bold" />}
          </button>
        </form>
        <div className="mt-3 text-center">
           <span className="text-[10px] text-slate-500 font-medium">Powered by AI • Answers based on uploaded knowledge</span>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
