import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import Document from "../models/Document.js";
import {
  processDocumentForRAG,
  rebuildVectorStoreForUser,
} from "../services/ragService.js";

// ---------------------------------------------------------------------------
// Document Controller — business logic for PDF upload pipeline
//
// WHY this file exists:
// Controllers contain the core business logic, separate from:
//   - Routes (URL mapping only)
//   - Middleware (cross-cutting concerns like auth, upload)
//   - Models (data shape only)
//
// This separation means you can unit-test each controller handler independently.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helper: Validate PDF magic bytes
// The first 5 bytes of any valid PDF file are "%PDF-"
// ---------------------------------------------------------------------------
const isPDFBuffer = (buffer) => {
  if (!buffer || buffer.length < 5) return false;
  const header = buffer.slice(0, 5).toString("ascii");
  return header === "%PDF-";
};

// ---------------------------------------------------------------------------
// @desc    Upload a PDF, extract its text, save to MongoDB
// @route   POST /api/documents
// @access  Private (JWT required)
//
// UPLOAD LIFECYCLE:
//   1. Multer saves the file to disk → req.file populated
//   2. We validate the file buffer (PDF magic bytes)
//   3. pdf-parse extracts text content
//   4. We save metadata + text to MongoDB (always succeeds if file is valid)
//   5. We trigger RAG indexing SEPARATELY — if it fails, we return HTTP 202
//      with aiReady:false and processingStatus:"failed" (NOT an error)
//   6. Frontend shows appropriate state: green for indexed, amber for pending/failed
// ---------------------------------------------------------------------------
export const uploadDocument = async (req, res) => {
  try {
    // --- Guard: Multer should have attached req.file ---
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select a PDF file.",
      });
    }

    // --- Read the uploaded file from disk ---
    const filePath = req.file.path;
    const fileBuffer = await fs.readFile(filePath);

    // --- Validate PDF magic bytes ---
    if (!isPDFBuffer(fileBuffer)) {
      // Clean up the invalid file
      try { await fs.unlink(filePath); } catch {}
      return res.status(400).json({
        success: false,
        message: "Invalid PDF file. The file appears to be corrupted or is not a valid PDF.",
      });
    }

    // --- Extract text using pdf-parse v2 ---
    let extractedText = "";
    let pageCount = 0;

    try {
      const parser = new PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      extractedText = result.text || "";
      pageCount = result.total || 0;
      await parser.destroy();
    } catch (parseError) {
      // PDF might be scanned/image-only or encrypted — still save the document
      console.warn("PDF text extraction warning:", parseError.message);
      extractedText = "[Could not extract text — PDF may be image-based or encrypted]";
    }

    // --- Save document metadata + text to MongoDB ---
    const document = await Document.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      fileSize: req.file.size,
      extractedText,
      pageCount,
      processingStatus: "pending",
      uploadedBy: req.user._id,
    });

    // --- Trigger RAG Ingestion Pipeline ---
    // This runs AFTER the document is safely saved. Even if indexing fails,
    // the document is preserved and can be re-indexed later.
    let aiReady = false;
    try {
      await processDocumentForRAG(document._id, req.user._id);
      document.processingStatus = "processed";
      document.processingError = "";
      await document.save();
      aiReady = true;
    } catch (ragError) {
      console.error("RAG processing failed, but document was saved:", ragError);
      document.processingStatus = "failed";
      document.processingError = ragError.message;
      await document.save();
    }

    // HTTP 201 = fully indexed, HTTP 202 = uploaded but indexing failed/pending
    res.status(aiReady ? 201 : 202).json({
      success: true,
      message: aiReady
        ? "Document uploaded and processed successfully."
        : "Document uploaded successfully, but AI indexing failed. You can retry indexing from the documents page.",
      document: {
        id: document._id,
        originalName: document.originalName,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        processingStatus: document.processingStatus,
        processingError: document.processingError,
        aiReady,
        textLength: extractedText.length,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    // If something fails after Multer saved the file, clean it up
    if (req.file?.path) {
      try { await fs.unlink(req.file.path); } catch {}
    }

    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process document. Please try again.",
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get all documents for the authenticated user
// @route   GET /api/documents
// @access  Private (JWT required)
// ---------------------------------------------------------------------------
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ uploadedBy: req.user._id })
      .select("-extractedText -filepath")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve documents.",
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Delete a document (from MongoDB AND from disk)
// @route   DELETE /api/documents/:id
// @access  Private (JWT required)
// ---------------------------------------------------------------------------
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Authorization: ensure the document belongs to this user
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this document",
      });
    }

    // Delete file from disk
    try {
      await fs.unlink(document.filepath);
    } catch (fileError) {
      console.warn("File deletion warning:", fileError.message);
    }

    // Delete record from MongoDB
    await Document.findByIdAndDelete(req.params.id);

    // Rebuild vector store (remove deleted doc's embeddings)
    try {
      await rebuildVectorStoreForUser(req.user._id);
    } catch (ragError) {
      console.warn("Vector store rebuild after delete failed:", ragError.message);
    }

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document.",
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Re-index a document that previously failed AI processing
// @route   POST /api/documents/:id/reindex
// @access  Private (JWT required)
// ---------------------------------------------------------------------------
export const reindexDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Authorization
    if (document.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reindex this document",
      });
    }

    if (!document.extractedText || document.extractedText.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Document has no extractable text. Re-indexing is not possible.",
      });
    }

    // Update status to pending
    document.processingStatus = "pending";
    document.processingError = "";
    await document.save();

    // Attempt RAG processing
    try {
      await processDocumentForRAG(document._id, req.user._id);
      document.processingStatus = "processed";
      document.processingError = "";
      await document.save();

      return res.status(200).json({
        success: true,
        message: "Document re-indexed successfully.",
        processingStatus: "processed",
      });
    } catch (ragError) {
      document.processingStatus = "failed";
      document.processingError = ragError.message;
      await document.save();

      return res.status(202).json({
        success: false,
        message: `Re-indexing failed: ${ragError.message}`,
        processingStatus: "failed",
      });
    }
  } catch (error) {
    console.error("Reindex error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to re-index document.",
    });
  }
};
