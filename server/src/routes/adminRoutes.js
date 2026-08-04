import express from "express";
import { rotateWidgetKey } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin-only key rotation endpoints (requires valid JWT auth session)
router.post("/companies/:companyId/rotate-widget-key", protect, rotateWidgetKey);
router.post("/rotate-widget-key", protect, rotateWidgetKey);

export default router;
