import { useParams } from "react-router-dom";
import ChatUI from "../components/ChatUI";
import api from "../services/api";

// ---------------------------------------------------------------------------
// Widget Page
//
// WHY this file exists:
// This is the public, standalone page meant to be embedded in an <iframe>.
// It uses the `companyId` from the URL params to query the correct FAISS index.
// It does NOT use the AuthContext, so it can be accessed by anyone visiting
// the company's website.
// ---------------------------------------------------------------------------

const WidgetPage = () => {
  const { companyId } = useParams();
  const hasPlaceholderId = !companyId || companyId.includes("YOUR_");

  const handleSendMessage = async (text) => {
    if (hasPlaceholderId) {
      throw new Error("Invalid widget URL. Copy the iframe from your dashboard so it uses your real company ID.");
    }

    try {
      // Call the public widget API
      const { data } = await api.post(`/chat/widget/${companyId}`, { question: text });
      return data; // { answer, sources }
    } catch (error) {
      console.error("Widget chat error:", error);
      throw new Error(error.response?.data?.message || "Failed to send message", {
        cause: error,
      });
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden">
      <ChatUI onSendMessage={handleSendMessage} title="Customer Support" />
    </div>
  );
};

export default WidgetPage;
