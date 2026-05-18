import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Document Model — stores metadata + extracted text from uploaded PDFs
//
// WHY this file exists:
// Separates the data schema from business logic (controller) and routing.
// This is the single source of truth for what a "document" looks like in the DB.
//
// DESIGN DECISIONS:
// - `extractedText` is stored directly in MongoDB (not a separate collection)
//   because Phase 2 is local-only. In Phase 3+ (RAG), this text will be chunked
//   and embedded into a vector database instead.
// - `uploadedBy` references the User model so each user only sees their own docs.
// - `filepath` stores the relative path to the file on disk (server/uploads/).
// ---------------------------------------------------------------------------
const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
      trim: true,
    },
    filepath: {
      type: String,
      required: [true, "Filepath is required"],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    extractedText: {
      type: String,
      default: "",
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    processingStatus: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },
    processingError: {
      type: String,
      default: "",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Document must belong to a user"],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for fast lookups: "get all documents for this user, newest first"
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
