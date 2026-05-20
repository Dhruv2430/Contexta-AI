import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";

// ESM doesn't have __dirname, so we derive it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------------------------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------------------------
// Helmet sets secure HTTP headers (X-Content-Type-Options, HSTS, etc.)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS: restrict origins in production, allow all in dev
const ALWAYS_ALLOWED = ["http://localhost:5173", "http://localhost:5174"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!config.isProduction) return callback(null, true);
    if (!origin) return callback(null, true);
    if (ALWAYS_ALLOWED.includes(origin)) return callback(null, true);
    if (config.corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------
// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", generalLimiter);

// Strict limit for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// AI/chat rate limit (quota protection)
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: "Too many AI requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/chat", chatLimiter);

// ---------------------------------------------------------------------------
// Core Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (optional — useful for future download feature)
app.use("/uploads", express.static(path.join(config.dataDir, "uploads")));

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Contexta-AI API Running" });
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/system", systemRoutes);

// ---------------------------------------------------------------------------
// Multer Error Handler
// Multer throws specific errors for file size/type violations.
// We catch them here to return clean error messages instead of 500s.
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 10MB.",
    });
  }

  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({
      success: false,
      message: "Invalid file type. Only PDF files are allowed.",
    });
  }

  // Fall through to generic error handler
  next(err);
});

// ---------------------------------------------------------------------------
// Global Error Handler (catch-all for unhandled errors)
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    success: false,
    message: config.isProduction ? "Internal server error" : err.message,
  });
});

export default app;
