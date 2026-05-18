import express from "express";
import {
  getAnalytics,
  getApiKeyStatus,
  getLogs,
  getRagStatus,
  testApiKey,
} from "../controllers/systemController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/analytics", protect, getAnalytics);
router.get("/logs", protect, getLogs);
router.get("/rag", protect, getRagStatus);
router.get("/api-keys", protect, getApiKeyStatus);
router.post("/api-keys/test", protect, testApiKey);

export default router;
