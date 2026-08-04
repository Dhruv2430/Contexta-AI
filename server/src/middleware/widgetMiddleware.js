import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import User from "../models/User.js";
import config from "../config/env.js";
import {
  extractNormalizedDomain,
  verifyWidgetSession,
} from "../utils/widgetSession.js";

/**
 * 1. CORS Middleware for Widget endpoints
 * Dynamic CORS preflight and header setup. For OPTIONS preflight, resolves company
 * via :companyId URL parameter (Fix 2).
 */
export const widgetCors = async (req, res, next) => {
  const origin = req.headers.origin;

  // Allow setting CORS headers if origin is present
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Widget-Key, X-Widget-Session"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }

  if (req.method === "OPTIONS") {
    // OPTIONS preflight resolves company via :companyId URL param if available
    const { companyId } = req.params;
    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      try {
        const company = await User.findById(companyId);
        if (company) {
          const normOrigin = extractNormalizedDomain(origin);
          const allowed = company.allowedDomains || [];
          const normalizedAllowed = allowed.map((d) => extractNormalizedDomain(d));

          // If allowedDomains is empty or origin matches, allow preflight response
          if (
            allowed.length === 0 ||
            !normOrigin ||
            normalizedAllowed.includes(normOrigin)
          ) {
            res.setHeader("Access-Control-Allow-Origin", origin || "*");
          }
        }
      } catch (err) {
        console.warn("[Widget CORS] Error looking up company during preflight:", err.message);
      }
    }
    return res.status(204).end();
  }

  next();
};

/**
 * 2. Widget Authentication Middleware
 * Expects key in X-Widget-Key header.
 * Resolves User (Company) by widgetApiKey.
 * Cross-checks req.params.companyId matches req.widgetCompany._id.
 */
export const widgetAuth = async (req, res, next) => {
  try {
    const key = req.header("X-Widget-Key");

    if (!key || typeof key !== "string" || !key.trim()) {
      return res.status(401).json({ error: "Invalid widget key" });
    }

    const company = await User.findOne({ widgetApiKey: key.trim() });
    if (!company) {
      return res.status(401).json({ error: "Invalid widget key" });
    }

    // Cross-check URL companyId parameter if present
    const { companyId } = req.params;
    if (companyId && company._id.toString() !== companyId) {
      return res.status(403).json({ error: "Forbidden: Company ID mismatch" });
    }

    req.widgetCompany = company;
    next();
  } catch (error) {
    console.error("[Widget Auth Error]:", error);
    return res.status(401).json({ error: "Invalid widget key" });
  }
};

/**
 * 3. Domain Verification Middleware (Session Token Verification - Fix 1)
 * Expects X-Widget-Session token header.
 * Verifies JWT signature & expiration.
 * Confirms decoded companyId matches req.params.companyId & req.widgetCompany._id.
 */
export const widgetDomainVerify = (req, res, next) => {
  try {
    const sessionToken = req.header("X-Widget-Session");

    if (!sessionToken) {
      return res.status(401).json({ error: "Invalid or expired widget session" });
    }

    let decoded;
    try {
      decoded = verifyWidgetSession(sessionToken);
    } catch {
      return res.status(401).json({ error: "Invalid or expired widget session" });
    }

    const targetCompanyId = req.params.companyId || req.widgetCompany?._id?.toString();

    if (!decoded.companyId || decoded.companyId !== targetCompanyId) {
      return res.status(403).json({ error: "Forbidden: Company ID mismatch" });
    }

    req.widgetSession = decoded;
    next();
  } catch (error) {
    console.error("[Widget Domain Verify Error]:", error);
    return res.status(401).json({ error: "Invalid or expired widget session" });
  }
};

/**
 * 4. Rate Limiting Middleware
 * Keyed on combination of Widget Key + Client IP address.
 */
export const widgetRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: () =>
    process.env.WIDGET_RATE_LIMIT_PER_MIN
      ? parseInt(process.env.WIDGET_RATE_LIMIT_PER_MIN, 10)
      : config.widgetRateLimitPerMin || 20,
  keyGenerator: (req) => {
    const key =
      req.widgetCompany?.widgetApiKey ||
      req.header("X-Widget-Key") ||
      "nokey";
    return `${key}_${req.ip}`;
  },
  handler: (req, res) => {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  },
  validate: false,
  standardHeaders: true,
  legacyHeaders: false,
});
