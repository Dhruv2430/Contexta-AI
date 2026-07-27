import mongoose from "mongoose";

const knowledgeGapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    confidenceScore: {
      type: Number,
      default: null,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const KnowledgeGap = mongoose.model("KnowledgeGap", knowledgeGapSchema);

export default KnowledgeGap;
