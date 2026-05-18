import Document from "../models/Document.js";
import ChatHistory from "../models/ChatHistory.js";

// ---------------------------------------------------------------------------
// Dashboard Controller
// ---------------------------------------------------------------------------

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get documents count and processed count
    const documentsCount = await Document.countDocuments({ uploadedBy: userId });
    const processedDocs = await Document.countDocuments({ uploadedBy: userId, processingStatus: "processed" });
    const chatsCount = await ChatHistory.countDocuments({ companyId: userId });

    // Generate daily chats for the last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const dailyChatsAgg = await ChatHistory.aggregate([
      {
        $match: {
          companyId: userId,
          createdAt: { $gte: last7Days[0] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const dailyChats = last7Days.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const found = dailyChatsAgg.find((d) => d._id === dateStr);
      return {
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        count: found ? found.count : 0,
      };
    });

    res.status(200).json({
      success: true,
      documents: documentsCount,
      processedDocs,
      chats: chatsCount,
      dailyChats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};
