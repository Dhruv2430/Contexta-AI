import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Chat History Model
//
// WHY this file exists:
// Stores every question and AI answer. Essential for analytics (how many chats?)
// and displaying past conversations in the dashboard.
// ---------------------------------------------------------------------------
const chatHistorySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for fast retrieval by company
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    sources: [
      {
        filename: String,
        documentId: String,
      },
    ],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Index for sorting newest first
chatHistorySchema.index({ companyId: 1, createdAt: -1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;
