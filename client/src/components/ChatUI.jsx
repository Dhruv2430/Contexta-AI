import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, AlertCircle, Copy, Check, Sparkles, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

let messageCounter = 0;
const nextId = () => `msg-${Date.now()}-${++messageCounter}`;

const ChatUI = ({ onSendMessage, title = "AI Assistant", initialWelcome, themeColor, initialMessages = [] }) => {
  const [messages, setMessages] = useState(() => {
    if (initialMessages.length > 0)
      return initialMessages.map((m) => ({ ...m, id: m.id || nextId() }));
    return [
      {
        id: nextId(),
        role: "ai",
        text: initialWelcome || "Hello! I am your Contexta-AI assistant. Ask me anything about your uploaded knowledge base documents.",
        sources: [],
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage = { id: nextId(), role: "user", text: input.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setError(null);
      setIsLoading(true);

      try {
        const historyPayload = messages.slice(-6).map((m) => ({
          sender: m.role === "user" ? "user" : "bot",
          text: m.text,
        }));
        const response = await onSendMessage(userMessage.text, historyPayload);
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
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to retrieve answer. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, onSendMessage]
  );

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden border border-slate-200/70 rounded-2xl shadow-xs">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200/70 flex items-center justify-between bg-white/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-forest-600 flex items-center justify-center shadow-xs text-white">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 font-display flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 text-[10px] font-bold border border-forest-100">
                Gemini 1.5 Flash
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> FAISS Vector Index Sync
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: nextId(),
                role: "ai",
                text: "Chat cleared. Ask me any question based on your documents!",
                sources: [],
              },
            ])
          }
          className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer border-0 bg-transparent"
        >
          Clear Chat
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 p-3 px-5 flex items-center justify-between text-xs font-semibold text-red-700 border-b border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 underline cursor-pointer border-0 bg-transparent font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex items-start gap-3 max-w-3xl ${
                m.role === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                  m.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-forest-600 text-white"
                }`}
              >
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Content Bubble */}
              <div
                className={`group relative p-4 rounded-2xl text-xs leading-relaxed max-w-xl text-left ${
                  m.role === "user"
                    ? "bg-forest-600 text-white font-medium rounded-tr-xs shadow-xs"
                    : "bg-white text-slate-800 border border-slate-200/70 rounded-tl-xs shadow-xs"
                }`}
              >
                <p className="whitespace-pre-wrap font-medium">{m.text}</p>

                {/* Sources Citation Preview */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] space-y-1.5">
                    <p className="font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                      <BookOpen className="w-3 h-3 text-forest-600" />
                      Retrieved Sources ({m.sources.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200"
                        >
                          {typeof s === "string" ? s : s.filename || `Doc #${idx + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy Action Button */}
                {m.role === "ai" && (
                  <button
                    onClick={() => copyToClipboard(m.text, m.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 border-0 bg-transparent cursor-pointer"
                    title="Copy response"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Streaming Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 max-w-xl"
          >
            <div className="w-8 h-8 rounded-xl bg-forest-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-slate-500 text-xs font-semibold flex items-center gap-2 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-forest-600" />
              <span>Querying vector engine & Gemini API...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-white border-t border-slate-200/70">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question about your documents..."
            className="input-field flex-1 py-3 px-4 text-xs font-medium pr-12 shadow-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-forest absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white disabled:opacity-40 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatUI;
