import ChatHistory from "../models/ChatHistory.js";
import Document from "../models/Document.js";
import { getEmbeddingsModel } from "../services/embeddingService.js";
import { getUserVectorStoreStats } from "../services/vectorService.js";

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const getLastSevenDays = () => {
  const today = startOfDay(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return day;
  });
};

const buildDailyCounts = (chats) => {
  const days = getLastSevenDays();

  return days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }),
      count: chats.filter((chat) => chat.createdAt >= day && chat.createdAt < nextDay).length,
    };
  });
};

const getSourceUsage = (chats) => {
  const usage = new Map();

  chats.forEach((chat) => {
    chat.sources.forEach((source) => {
      if (!source.filename) return;
      usage.set(source.filename, (usage.get(source.filename) || 0) + 1);
    });
  });

  return Array.from(usage.entries())
    .map(([filename, count]) => ({ filename, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

const documentLogEvents = (documents) =>
  documents.flatMap((doc) => {
    const events = [
      {
        type: "document",
        level: "info",
        title: "Document uploaded",
        detail: doc.originalName,
        time: doc.createdAt,
      },
    ];

    if (doc.processingStatus === "processed") {
      events.push({
        type: "rag",
        level: "success",
        title: "AI indexing completed",
        detail: `${doc.originalName} (${doc.pageCount || 0} pages)`,
        time: doc.updatedAt,
      });
    }

    if (doc.processingStatus === "failed") {
      events.push({
        type: "rag",
        level: "error",
        title: "AI indexing failed",
        detail: doc.processingError || doc.originalName,
        time: doc.updatedAt,
      });
    }

    return events;
  });

const chatLogEvents = (chats) =>
  chats.map((chat) => ({
    type: "chat",
    level: "info",
    title: "Question answered",
    detail: chat.question,
    time: chat.createdAt,
  }));

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const [documents, chats, indexStats] = await Promise.all([
      Document.find({ uploadedBy: userId }).sort({ createdAt: -1 }),
      ChatHistory.find({ companyId: userId }).sort({ createdAt: -1 }).limit(100),
      getUserVectorStoreStats(userId.toString()),
    ]);

    const processedDocuments = documents.filter((doc) => doc.processingStatus === "processed").length;
    const failedDocuments = documents.filter((doc) => doc.processingStatus === "failed").length;
    const totalPages = documents.reduce((sum, doc) => sum + (doc.pageCount || 0), 0);

    return res.status(200).json({
      success: true,
      metrics: {
        totalDocuments: documents.length,
        processedDocuments,
        failedDocuments,
        totalChats: chats.length,
        totalPages,
        vectorCount: indexStats.total,
        vectorDimension: indexStats.dimension,
      },
      dailyChats: buildDailyCounts(chats),
      sourceUsage: getSourceUsage(chats),
      recentQuestions: chats.slice(0, 10).map((chat) => ({
        id: chat._id,
        question: chat.question,
        answer: chat.answer,
        sources: chat.sources,
        createdAt: chat.createdAt,
      })),
      documents: documents.map((doc) => ({
        id: doc._id,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        pageCount: doc.pageCount,
        processingStatus: doc.processingStatus,
        processingError: doc.processingError,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({ success: false, message: "Failed to load analytics." });
  }
};

export const getLogs = async (req, res) => {
  try {
    const userId = req.user._id;

    const [documents, chats] = await Promise.all([
      Document.find({ uploadedBy: userId }).sort({ updatedAt: -1 }).limit(50),
      ChatHistory.find({ companyId: userId }).sort({ createdAt: -1 }).limit(50),
    ]);

    const events = [...documentLogEvents(documents), ...chatLogEvents(chats)]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 80);

    return res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("Logs error:", error);
    return res.status(500).json({ success: false, message: "Failed to load logs." });
  }
};

export const getRagStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const [documents, indexStats] = await Promise.all([
      Document.find({ uploadedBy: userId }).sort({ createdAt: -1 }),
      getUserVectorStoreStats(userId.toString()),
    ]);

    return res.status(200).json({
      success: true,
      index: indexStats,
      documents: documents.map((doc) => ({
        id: doc._id,
        originalName: doc.originalName,
        pageCount: doc.pageCount,
        textLength: doc.extractedText?.length || 0,
        processingStatus: doc.processingStatus,
        processingError: doc.processingError,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (error) {
    console.error("RAG status error:", error);
    return res.status(500).json({ success: false, message: "Failed to load RAG status." });
  }
};

export const getApiKeyStatus = async (req, res) => {
  const geminiKey = process.env.GEMINI_API || "";

  return res.status(200).json({
    success: true,
    gemini: {
      configured: Boolean(geminiKey),
      masked: geminiKey ? `****${geminiKey.slice(-4)}` : "",
      chatModel: process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash",
      embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    },
    database: {
      configured: Boolean(process.env.MONGODB_URI),
    },
    jwt: {
      configured: Boolean(process.env.JWT_SECRET),
    },
  });
};

export const testApiKey = async (req, res) => {
  try {
    const embeddings = getEmbeddingsModel();
    const vector = await embeddings.embedQuery("local api key health check");

    return res.status(200).json({
      success: true,
      message: "Gemini embedding test succeeded.",
      dimension: vector.length,
    });
  } catch (error) {
    console.error("API key test error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Gemini API test failed.",
    });
  }
};
