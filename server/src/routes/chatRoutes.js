import express from "express";
import { askQuestion, widgetChat, getChatHistory, clearChatHistory } from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js";

// ---------------------------------------------------------------------------
// Chat Routes
// ---------------------------------------------------------------------------

const router = express.Router();

// Protected routes: user must be logged in (For SaaS dashboard chat)
router.post("/", protect, askQuestion);
router.get("/history", protect, getChatHistory);
router.delete("/history", protect, clearChatHistory);

// Public route: used by the iframe widget
router.post("/widget/:companyId", widgetChat);

export default router;
