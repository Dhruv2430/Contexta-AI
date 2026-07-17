import fs from "fs/promises";
import * as pdfjs from "pdf-parse";
import path from "path";
import config from "../config/env.js";
import Document from "../models/Document.js";
import {
  processDocumentForRAG,
  rebuildVectorStoreForUser,
} from "../services/ragService.js";

// ---------------------------------------------------------------------------
// Validate PDF file header
// ---------------------------------------------------------------------------
const isPDFBuffer = (buffer) => {
  if (!buffer || buffer.length < 5) return false;

  const header = buffer.slice(0, 5).toString("ascii");

  return header === "%PDF-";
};

// ---------------------------------------------------------------------------
// Upload Document
// ---------------------------------------------------------------------------
export const uploadDocument = async (req, res) => {
  try {
    // Check file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded",
      });
    }

    const filePath = req.file.path;

    // Read uploaded file
    const fileBuffer = await fs.readFile(filePath);

    // Validate PDF
    if (!isPDFBuffer(fileBuffer)) {
      try {
        await fs.unlink(filePath);
      } catch {}

      return res.status(400).json({
        success: false,
        message: "Invalid PDF file",
      });
    }

    // -------------------------------------------------
    // Extract PDF text
    // -------------------------------------------------
    let extractedText = "";
    let pageCount = 0;
    let extractError = null;

    try {
      const parser = new pdfjs.PDFParse({ data: fileBuffer });
      const result = await parser.getText();

      extractedText = result.text || "";
      pageCount = result.total || 0;

      if (!extractedText.trim()) {
        throw new Error("No extractable text found in this PDF");
      }
    } catch (parseError) {
      console.error("PDF parse error:", parseError.message);
      extractError = parseError.message;
    }

    // -------------------------------------------------
    // Save document in MongoDB
    // -------------------------------------------------
    const document = await Document.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      fileSize: req.file.size,
      extractedText: extractedText || "",
      pageCount,
      processingStatus: extractError ? "failed" : "pending",
      processingError: extractError || "",
      uploadedBy: req.user._id,
    });

    // -------------------------------------------------
    // Process RAG
    // -------------------------------------------------
    let aiReady = false;

    if (!extractError) {
      try {
        await processDocumentForRAG(
          document._id,
          req.user._id
        );

        document.processingStatus = "processed";
        document.processingError = "";

        await document.save();

        aiReady = true;
      } catch (ragError) {
        console.error(
          "RAG processing failed:",
          ragError.message
        );

        document.processingStatus = "failed";
        document.processingError = ragError.message;

        await document.save();
      }
    }

    // -------------------------------------------------
    // Response
    // -------------------------------------------------
    return res.status(aiReady ? 201 : 202).json({
      success: true,
      message: aiReady
        ? "Document uploaded successfully"
        : "Document uploaded but AI indexing failed",

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
    console.error("Upload error:", error);

    // Cleanup file if upload failed
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};

// ---------------------------------------------------------------------------
// Get All Documents
// ---------------------------------------------------------------------------
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      uploadedBy: req.user._id,
    })
      .select("-extractedText -filepath")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};

// ---------------------------------------------------------------------------
// Delete Document
// ---------------------------------------------------------------------------
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(
      req.params.id
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Authorization
    if (
      document.uploadedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Delete physical file
    try {
      await fs.unlink(document.filepath);
    } catch (fileError) {
      console.warn(
        "File delete warning:",
        fileError.message
      );
    }

    // Delete DB record
    await Document.findByIdAndDelete(req.params.id);

    // Rebuild vector store
    try {
      await rebuildVectorStoreForUser(req.user._id);
    } catch (ragError) {
      console.warn(
        "Vector rebuild failed:",
        ragError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};

// ---------------------------------------------------------------------------
// Reindex Document
// ---------------------------------------------------------------------------
export const reindexDocument = async (req, res) => {
  try {
    const document = await Document.findById(
      req.params.id
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Authorization
    if (
      document.uploadedBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Verify file and load it
    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(document.filepath);
    } catch (err) {
      // Check local uploads fallback (e.g. if filepath is pointing to a different environment like Render)
      const filename = path.basename(document.filepath);
      const localPath = path.join(config.uploadsDir, filename);
      try {
        fileBuffer = await fs.readFile(localPath);
        document.filepath = localPath;
      } catch (localErr) {
        return res.status(400).json({
          success: false,
          message: "Physical document file not found on this server. Please delete and re-upload.",
        });
      }
    }

    // Parse the file again
    let extractedText = "";
    let pageCount = 0;
    try {
      const parser = new pdfjs.PDFParse({ data: fileBuffer });
      const result = await parser.getText();
      extractedText = result.text || "";
      pageCount = result.total || 0;
      
      if (!extractedText.trim()) {
        throw new Error("No extractable text found in this PDF");
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: `Failed to extract text from PDF: ${parseError.message}`,
      });
    }

    document.extractedText = extractedText;
    document.pageCount = pageCount;
    document.processingStatus = "pending";
    document.processingError = "";

    await document.save();

    try {
      await processDocumentForRAG(
        document._id,
        req.user._id
      );

      document.processingStatus = "processed";
      document.processingError = "";

      await document.save();

      return res.status(200).json({
        success: true,
        message:
          "Document re-indexed successfully",
      });
    } catch (ragError) {
      document.processingStatus = "failed";
      document.processingError = ragError.message;

      await document.save();

      return res.status(202).json({
        success: false,
        message: ragError.message,
      });
    }
  } catch (error) {
    console.error("Reindex error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to re-index document",
    });
  }
};

