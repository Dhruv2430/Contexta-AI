import KnowledgeGap from "../models/KnowledgeGap.js";

// ---------------------------------------------------------------------------
// @desc    Get latest logged knowledge gaps for authenticated user
// @route   GET /api/gaps
// @access  Private
// ---------------------------------------------------------------------------
export const getKnowledgeGaps = async (req, res) => {
  try {
    const gaps = await KnowledgeGap.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: gaps,
    });
  } catch (error) {
    console.error("GetKnowledgeGaps error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching knowledge gaps",
    });
  }
};
