import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Centralized Environment Configuration
//
// WHY: Single source of truth for all env vars. Validates at startup so
// missing config fails fast with a clear message instead of causing
// cryptic errors deep in the request lifecycle.
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root (two levels up from src/config/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- Required variables ---
const REQUIRED = ["MONGODB_URI", "GEMINI_API", "JWT_SECRET"];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `\n❌ Missing required environment variables:\n${missing.map((k) => `   • ${k}`).join("\n")}\n\nCreate a server/.env file using .env.example as a template.\n`
  );
  process.exit(1);
}

// --- Exported config object ---
const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  mongoUri: process.env.MONGODB_URI,
  geminiApi: process.env.GEMINI_API,
  geminiChatModel: process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash",
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
    : ["http://localhost:5173"],
  isProduction: process.env.NODE_ENV === "production",
  dataDir: process.env.PERSISTENT_DATA_PATH || path.resolve(__dirname, "../.."),
};

export default config;
