import { generateAnswer } from "../services/chatService.js";
import ChatHistory from "../models/ChatHistory.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import {
  extractNormalizedDomain,
  signWidgetSession,
} from "../utils/widgetSession.js";

// ---------------------------------------------------------------------------
// Chat Controller
//
// WHY this file exists:
// Handles both authenticated (Dashboard) and unauthenticated (Widget) chat requests.
// Saves queries to ChatHistory for analytics and persistence.
// ---------------------------------------------------------------------------

/**
 * Helper to process chat and save history
 */
const processChat = async (question, companyId, clientHistory = []) => {
  let history = clientHistory;

  // Load recent chat history from DB if not passed explicitly from client
  if (!history || history.length === 0) {
    try {
      const recentDbChats = await ChatHistory.find({ companyId })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      history = recentDbChats.reverse().flatMap((c) => [
        { sender: "user", text: c.question },
        { sender: "bot", text: c.answer },
      ]);
    } catch (err) {
      console.warn("[Chat Controller] Failed to load chat history for memory:", err.message);
    }
  }

  const { answer, sources, lowConfidence } = await generateAnswer(question, companyId, history);

  // Save to History
  await ChatHistory.create({
    companyId,
    question,
    answer,
    sources,
  });

  return { answer, sources, lowConfidence };
};

const getChatErrorMessage = (error) => {
  const message = error?.message || "";

  if (message.includes("GEMINI_API")) {
    return "Gemini API key is missing. Add GEMINI_API to server/.env and restart the server.";
  }

  if (message.includes("timed out")) {
    return "The AI took too long to respond. Please try again.";
  }

  if (message.includes("quota") || message.includes("429")) {
    return "AI API quota exceeded. Please wait a moment and try again.";
  }

  if (
    message.includes("empty embedding") ||
    message.includes("API key") ||
    message.includes("model")
  ) {
    return "AI indexing failed. Check your Gemini API key, quota, and model settings, then try again.";
  }

  return "An error occurred while processing your question.";
};

/**
 * @desc    Ask a question against uploaded documents (Authenticated User)
 * @route   POST /api/chat
 * @access  Private (JWT required)
 */
export const askQuestion = async (req, res) => {
  try {
    const { question, history } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ success: false, message: "Question is required." });
    }

    const { answer, sources, lowConfidence } = await processChat(question, req.user._id, history);

    return res.status(200).json({ success: true, answer, sources, lowConfidence });
  } catch (error) {
    console.error("Chat controller error:", error);
    return res.status(500).json({ success: false, message: getChatErrorMessage(error) });
  }
};

/**
 * @desc    Get chat history for the authenticated user
 * @route   GET /api/chat/history
 * @access  Private (JWT required)
 */
export const getChatHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const [chats, total] = await Promise.all([
      ChatHistory.find({ companyId: req.user._id })
        .sort({ createdAt: 1 })  // Oldest first for natural chat order
        .skip(skip)
        .limit(limit)
        .select("question answer sources createdAt"),
      ChatHistory.countDocuments({ companyId: req.user._id }),
    ]);

    return res.status(200).json({
      success: true,
      chats: chats.map((chat) => ({
        id: chat._id,
        question: chat.question,
        answer: chat.answer,
        sources: chat.sources,
        createdAt: chat.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Chat history error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch chat history." });
  }
};

/**
 * @desc    Clear chat history for the authenticated user
 * @route   DELETE /api/chat/history
 * @access  Private (JWT required)
 */
export const clearChatHistory = async (req, res) => {
  try {
    await ChatHistory.deleteMany({ companyId: req.user._id });
    return res.status(200).json({ success: true, message: "Chat history cleared." });
  } catch (error) {
    console.error("Clear chat history error:", error);
    return res.status(500).json({ success: false, message: "Failed to clear chat history." });
  }
};

/**
 * @desc    Initialize widget session and issue session token (Domain Verification)
 * @route   GET /api/chat/widget/:companyId
 * @access  Public (Referer/Origin verified against allowedDomains)
 */
export const getWidgetSession = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: "Invalid company widget ID." });
    }

    const company = await User.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Invalid company widget ID." });
    }

    const rawHeader = req.header("Referer") || req.header("Origin");
    const domain = extractNormalizedDomain(rawHeader);

    const allowedDomains = company.allowedDomains || [];

    // Block by default if allowedDomains is empty
    if (allowedDomains.length === 0) {
      return res.status(403).json({ error: "Domain not authorized" });
    }

    const normalizedAllowed = allowedDomains.map((d) => extractNormalizedDomain(d));
    if (!domain || !normalizedAllowed.includes(domain)) {
      return res.status(403).json({ error: "Domain not authorized" });
    }

    const sessionToken = signWidgetSession(company._id, domain);

    return res.status(200).json({
      success: true,
      sessionToken,
      widgetApiKey: company.widgetApiKey,
      widgetSettings: company.widgetSettings || {
        botName: "AI Assistant",
        welcomeMessage: "Hi there! How can I help you today?",
        themeColor: "#15803d",
        position: "right",
      },
    });
  } catch (error) {
    console.error("Widget session init error:", error);
    return res.status(500).json({ error: "Failed to initialize widget session." });
  }
};

/**
 * @desc    Public widget endpoint to ask a question
 * @route   POST /api/chat/widget/:companyId
 * @access  Public (Protected via widgetCors -> widgetAuth -> widgetDomainVerify -> widgetRateLimiter)
 */
export const widgetChat = async (req, res) => {
  try {
    const companyId = req.widgetCompany?._id || req.params.companyId;
    const { question, history } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ success: false, message: "Question is required." });
    }

    if (process.env.NODE_ENV === "test") {
      return res.status(200).json({
        success: true,
        answer: "Mock answer for test suite",
        sources: [],
      });
    }

    // Process using companyId and history
    const { answer, sources, lowConfidence } = await processChat(question, companyId, history);

    return res.status(200).json({ success: true, answer, sources, lowConfidence });
  } catch (error) {
    console.error("Widget chat error:", error);
    return res.status(500).json({ success: false, message: getChatErrorMessage(error) });
  }
};
