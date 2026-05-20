import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import config from "../config/env.js";

// ---------------------------------------------------------------------------
// Upload Middleware — Multer configuration for PDF file uploads
//
// WHY this file exists:
// Multer is Express middleware that handles multipart/form-data (file uploads).
// Keeping it separate from routes/controllers means:
//   1. Routes stay clean — just `router.post("/", protect, upload, handler)`
//   2. Easy to swap storage backends later (e.g., S3 in Phase 3+)
//   3. Validation logic (type, size) is in one place
//
// HOW IT WORKS:
// 1. Frontend sends a FormData POST with field name "document"
// 2. Multer intercepts the request BEFORE the controller runs
// 3. Validates file type (PDF only) and size (≤10MB)
// 4. Saves file to server/uploads/ with a unique filename
// 5. Attaches `req.file` object with { filename, path, size, ... }
// 6. Controller then reads the saved file for text extraction
// 7. Dynamic folder creation: ensures mounted disk directories exist on startup.
// ---------------------------------------------------------------------------

// Resolve the uploads directory relative to the persistent data path
const uploadsDir = path.join(config.dataDir, "uploads");

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Storage Configuration ---
// diskStorage gives us control over WHERE and HOW files are named
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Format: {userId}-{timestamp}-{originalname}
    // This prevents filename collisions when multiple users upload same-named files
    const uniqueName = `${req.user._id}-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// --- File Type Validation ---
// SECURITY: Only allow PDF files. Reject everything else.
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true); // Accept
  } else {
    cb(new Error("Only PDF files are allowed"), false); // Reject
  }
};

// --- Create Multer Instance ---
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Export the middleware configured for a single file upload
// The field name "document" must match what the frontend sends in FormData
export default upload.single("document");
