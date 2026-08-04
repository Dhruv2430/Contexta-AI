import { Component, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ChatUI from "../components/ChatUI";
import api from "../services/api";
import { AlertCircle, Bot, Lock } from "lucide-react";

// --- React Error Boundary to prevent blank white screens in iframe ---
class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Widget Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-slate-50 p-4 flex items-center justify-center font-sans text-left">
          <div className="card p-6 bg-white border border-slate-200 shadow-md max-w-sm text-xs space-y-3">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Widget Load Error</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              {this.state.error?.message || "An unexpected error occurred while loading the widget."}
            </p>
            <p className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
              Check your company ID or copy the embed code from your Contexta-AI dashboard.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const WidgetContent = () => {
  const { companyId } = useParams();
  const isDemo = !companyId || companyId.includes("YOUR_");

  const [sessionToken, setSessionToken] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [widgetSettings, setWidgetSettings] = useState(null);
  const [loadingSession, setLoadingSession] = useState(!isDemo);
  const [sessionError, setSessionError] = useState(null);

  useEffect(() => {
    if (isDemo) return;

    let isMounted = true;
    const initSession = async () => {
      try {
        setLoadingSession(true);
        const { data } = await api.get(`/chat/widget/${companyId}`);
        if (isMounted) {
          setSessionToken(data.sessionToken);
          setApiKey(data.widgetApiKey);
          if (data.widgetSettings) {
            setWidgetSettings(data.widgetSettings);
          }
        }
      } catch (err) {
        if (isMounted) {
          setSessionError(
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Unauthorized domain or invalid company ID."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingSession(false);
        }
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, [companyId, isDemo]);

  const handleSendMessage = async (text, history) => {
    // Demo Mode fallback for placeholder company IDs
    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const lower = text.toLowerCase();
      let answer =
        "Thank you for testing Contexta-AI! This widget is running in Demo Mode. To connect your real documents, log into your Contexta-AI dashboard and copy your unique iframe embed code.";

      if (lower.includes("refund") || lower.includes("restock")) {
        answer =
          "[Demo Mode Answer]: Standard physical returns are subject to a 10% restocking fee. Digital subscriptions are 100% refundable within 14 days.";
      } else if (lower.includes("api") || lower.includes("rate") || lower.includes("auth")) {
        answer =
          "[Demo Mode Answer]: Authenticate API calls using Bearer tokens in the Authorization header. Rate limits are 60 req/min for Free tier.";
      }

      return {
        answer,
        sources: ["Demo_Knowledge_Base.pdf"],
      };
    }

    // Real API Call for valid Company IDs
    try {
      const { data } = await api.post(
        `/chat/widget/${companyId}`,
        { question: text, history },
        {
          headers: {
            "X-Widget-Key": apiKey || "",
            "X-Widget-Session": sessionToken || "",
          },
        }
      );
      return data;
    } catch (error) {
      console.error("Widget chat error:", error);
      throw new Error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to retrieve answer from Knowledge Base"
      );
    }
  };

  if (!isDemo && sessionError) {
    return (
      <div className="h-full w-full bg-slate-50 p-4 flex items-center justify-center font-sans text-left">
        <div className="card p-6 bg-white border border-slate-200 shadow-md max-w-sm text-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-600 font-bold">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Widget Authorization Blocked</span>
          </div>
          <p className="text-slate-600 leading-relaxed font-medium">
            {sessionError}
          </p>
          <p className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
            Please ensure your domain is added to allowedDomains in your Contexta-AI settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col bg-slate-50 p-1.5 sm:p-2.5 box-border overflow-hidden">
      {isDemo && (
        <div className="mb-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-lg text-[10px] font-bold text-amber-800 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1">
            <Bot className="w-3 h-3 text-amber-600" /> Demo Widget Mode
          </span>
          <span className="text-[9px] text-amber-600 font-medium">Embed code from Dashboard to connect your data</span>
        </div>
      )}
      <div className="flex-1 h-full min-h-0 flex flex-col overflow-hidden">
        <ChatUI
          onSendMessage={handleSendMessage}
          title={isDemo ? "Contexta Support (Demo)" : "Customer Support AI"}
        />
      </div>
    </div>
  );
};

const WidgetPage = () => (
  <WidgetErrorBoundary>
    <WidgetContent />
  </WidgetErrorBoundary>
);

export default WidgetPage;
