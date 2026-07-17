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
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white z-10 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-forest-50 border border-forest-100 flex items-center justify-center shadow-sm text-forest-700 text-forest-600">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 font-display">{title}</h2>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 p-3 flex items-center gap-2 text-sm text-red-650 text-red-600 border-b border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === "user" ? "bg-forest-600 border-forest-650 text-white shadow-md shadow-forest-100" : "bg-white border-slate-100 text-slate-500 shadow-xs"
              }`}>
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-forest-600 text-white font-medium shadow-md shadow-forest-50 animate-slide-up"
                  : "bg-white text-slate-800 border border-slate-200/60 shadow-sm animate-slide-up font-medium"
                }`}>
                {msg.text}
              </div>

              {/* Sources */}
              {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-bold">Sources:</span>
                  {msg.sources.map((s, i) => (
                    <span key={`${msg.id}-src-${i}`} className="px-2 py-0.5 bg-white hover:bg-forest-50 border border-slate-200/60 hover:border-forest-200 text-forest-700 text-forest-600 rounded text-[10px] truncate max-w-[150px] transition-colors font-medium shadow-xs">
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
            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xs text-slate-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-xl bg-white border border-slate-200/60 flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-forest-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-forest-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-forest-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-150 border-slate-100">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question..."
            className="input-field w-full pl-4 pr-12 py-2.5 text-sm placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-forest-600 hover:bg-forest-700 disabled:bg-slate-150 disabled:opacity-50 text-white rounded-md transition-all cursor-pointer border-0 shadow-md shadow-forest-100"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </form>
        <div className="mt-2.5 text-center">
          <span className="text-[10px] text-slate-400 font-semibold">Answers are generated based on uploaded knowledge documents</span>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
