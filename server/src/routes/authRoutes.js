import express from "express";
import {
  signup,
  login,
  getMe,
  rotateWidgetKey,
  updateAllowedDomains,
  updateWidgetSettings,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected routes (require valid JWT)
router.get("/me", protect, getMe);
router.post("/rotate-widget-key", protect, rotateWidgetKey);
router.post("/companies/:companyId/rotate-widget-key", protect, rotateWidgetKey);
router.put("/allowed-domains", protect, updateAllowedDomains);
router.put("/widget-settings", protect, updateWidgetSettings);

export default router;
