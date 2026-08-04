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
import gapRoutes from "./routes/gapRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// ESM __dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------------------------------------------------------------------------
// 1. Trust Proxy (Required for Render & express-rate-limit reverse proxies)
// ---------------------------------------------------------------------------
app.set("trust proxy", 1);

// ---------------------------------------------------------------------------
// 2. Helmet Security Headers
// ---------------------------------------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ---------------------------------------------------------------------------
// 3. CORS Configuration
// ---------------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  "https://contextaai.me",
  "https://www.contextaai.me",
  "https://contexta-ai-nine.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  ...config.corsOrigins,
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, cURL, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use((req, res, next) => {
  if (req.path.startsWith("/api/chat/widget")) {
    return next(); // Handled dynamically per-company in widgetCors middleware
  }
  cors(corsOptions)(req, res, next);
});

// ---------------------------------------------------------------------------
// 4. Core Body Parsing Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(config.uploadsDir));

// ---------------------------------------------------------------------------
// 5. Rate Limiting Middleware (using trust proxy)
// ---------------------------------------------------------------------------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: "Too many AI requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/chat", (req, res, next) => {
  if (req.path.startsWith("/widget")) {
    return next();
  }
  chatLimiter(req, res, next);
});

// ---------------------------------------------------------------------------
// Health Check Endpoint
// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Contexta-AI API Running" });
});

// ---------------------------------------------------------------------------
// 6. API Routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/gaps", gapRoutes);

// ---------------------------------------------------------------------------
// 7. Error Handlers
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

  next(err);
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message?.startsWith("CORS:") ? err.message : config.isProduction ? "Internal server error" : err.message,
  });
});

export default app;
