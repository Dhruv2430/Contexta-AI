import { generateAnswer } from "../services/chatService.js";
import ChatHistory from "../models/ChatHistory.js";
import User from "../models/User.js";
import mongoose from "mongoose";

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
const processChat = async (question, companyId) => {
  const { answer, sources } = await generateAnswer(question, companyId);
  
  // Save to History
  await ChatHistory.create({
    companyId,
    question,
    answer,
    sources,
  });

  return { answer, sources };
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
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ success: false, message: "Question is required." });
    }

    const { answer, sources } = await processChat(question, req.user._id);

    return res.status(200).json({ success: true, answer, sources });
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
 * @desc    Public widget endpoint to ask a question
 * @route   POST /api/chat/widget/:companyId
 * @access  Public (Used by iframes on external websites)
 */
export const widgetChat = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ success: false, message: "Question is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company widget ID. Copy the iframe from your dashboard so it includes your real company ID.",
      });
    }

    // Verify company exists
    const companyExists = await User.findById(companyId);
    if (!companyExists) {
      return res.status(404).json({ success: false, message: "Invalid company widget ID." });
    }

    // Process using companyId
    const { answer, sources } = await processChat(question, companyId);

    return res.status(200).json({ success: true, answer, sources });
  } catch (error) {
    console.error("Widget chat error:", error);
    return res.status(500).json({ success: false, message: getChatErrorMessage(error) });
  }
};
