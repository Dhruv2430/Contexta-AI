import express from "express";
import { uploadDocument, getDocuments, deleteDocument, reindexDocument } from "../controllers/documentController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

// ---------------------------------------------------------------------------
// Document Routes
//
// WHY this file exists:
// Routes are the URL → handler mapping layer. They should be thin:
//   - Define the HTTP method + path
//   - Chain middleware (auth → upload → controller)
//   - Nothing else
//
// ALL routes are protected by the `protect` middleware from Phase 1.
// The upload middleware (Multer) runs AFTER auth but BEFORE the controller,
// so we reject unauthenticated requests before wasting time processing files.
//
// MIDDLEWARE ORDER MATTERS:
//   protect → upload → controller
//   1. First verify JWT (reject 401 if invalid)
//   2. Then process the file upload (Multer saves to disk)
//   3. Then run business logic (extract text, save to DB)
// ---------------------------------------------------------------------------
const router = express.Router();

// POST   /api/documents     — Upload a new PDF document
// GET    /api/documents     — List all documents for the authenticated user
// DELETE /api/documents/:id — Delete a specific document
router.post("/", protect, upload, uploadDocument);
router.get("/", protect, getDocuments);
router.delete("/:id", protect, deleteDocument);
router.post("/:id/reindex", protect, reindexDocument);

export default router;
