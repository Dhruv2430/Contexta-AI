import express from "express";
import { getKnowledgeGaps } from "../controllers/gapController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getKnowledgeGaps);

export default router;
