import express from "express";
import {
  askQuestion,
  widgetChat,
  getWidgetSession,
  getChatHistory,
  clearChatHistory,
} from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";
import {
  widgetCors,
  widgetAuth,
  widgetDomainVerify,
  widgetRateLimiter,
} from "../middleware/widgetMiddleware.js";

// ---------------------------------------------------------------------------
// Chat Routes
// ---------------------------------------------------------------------------

const router = express.Router();

// Protected routes: user must be logged in (For SaaS dashboard chat)
router.post("/", protect, askQuestion);
router.get("/history", protect, getChatHistory);
router.delete("/history", protect, clearChatHistory);

// Public widget routes (iframe session init & widget chat)
// CORS handler handles OPTIONS preflight and sets Access-Control headers
router.options("/widget/:companyId", widgetCors);
router.get("/widget/:companyId", widgetCors, getWidgetSession);
router.post(
  "/widget/:companyId",
  widgetCors,
  widgetAuth,
  widgetDomainVerify,
  widgetRateLimiter,
  widgetChat
);

export default router;
