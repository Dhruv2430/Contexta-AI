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
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="p-4 border-b border-base-200 flex items-center gap-3 bg-white/80 backdrop-blur-md z-10">
        <div className="w-8 h-8 rounded-full bg-accent-50 flex items-center justify-center">
          <Bot className="w-5 h-5 text-accent-500" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-base-900">{title}</h2>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 p-3 flex items-center gap-2 text-sm text-red-600 border-b border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-base-100" : "bg-accent-50"
            }`}>
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-base-600" />
              ) : (
                <Bot className="w-4 h-4 text-accent-500" />
              )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent-500 text-white rounded-tr-sm shadow-md shadow-accent-500/20"
                  : "bg-base-50 text-base-800 rounded-tl-sm border border-base-100"
              }`}>
                {msg.text}
              </div>

              {/* Sources */}
              {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-base-400 font-medium">Sources:</span>
                  {msg.sources.map((s, i) => (
                    <span key={`${msg.id}-src-${i}`} className="px-2 py-0.5 bg-base-100 text-base-500 rounded text-[10px] truncate max-w-[150px]">
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
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-50 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-accent-500" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-base-50 rounded-tl-sm border border-base-100 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-base-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-base-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-base-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-base-200">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question..."
            className="w-full pl-4 pr-12 py-3 bg-base-50 border border-base-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:hover:bg-accent-500 transition-colors cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <div className="mt-2 text-center">
           <span className="text-[10px] text-base-400">Powered by AI • Answers based on uploaded knowledge</span>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
