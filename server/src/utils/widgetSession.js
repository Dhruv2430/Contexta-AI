import jwt from "jsonwebtoken";
import config from "../config/env.js";

/**
 * Extract and normalize a bare domain from an Origin, Referer, or URL string.
 * Normalization:
 *  - Lowercase
 *  - Strip protocol (http://, https://)
 *  - Strip port number (:5173, :8080, etc.)
 *  - Strip path and query parameters
 *  - Strip leading "www."
 *
 * @param {string} rawHeader
 * @returns {string|null} Bare normalized domain or null if absent/invalid
 */
export const extractNormalizedDomain = (rawHeader) => {
  if (!rawHeader || typeof rawHeader !== "string") return null;
  let str = rawHeader.trim();
  if (!str) return null;

  try {
    if (str.includes("://")) {
      const parsed = new URL(str);
      str = parsed.hostname;
    } else {
      str = str.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
    }
  } catch {
    str = str.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
  }

  str = str.replace(/^https?:\/\//i, "");
  str = str.replace(/^www\./i, "");
  str = str.toLowerCase();

  return str || null;
};

/**
 * Sign a short-lived widget session token for a verified domain and company.
 *
 * @param {string|Object} companyId
 * @param {string} verifiedDomain
 * @returns {string} Signed JWT session token
 */
export const signWidgetSession = (companyId, verifiedDomain) => {
  const payload = {
    companyId: companyId.toString(),
    verifiedDomain,
  };

  return jwt.sign(payload, config.widgetSessionSecret, {
    expiresIn: `${config.widgetSessionTtlMin}m`,
  });
};

/**
 * Verify a widget session token.
 *
 * @param {string} token
 * @returns {Object} Decoded payload { companyId, verifiedDomain, iat, exp }
 * @throws {Error} If token is invalid or expired
 */
export const verifyWidgetSession = (token) => {
  if (!token) {
    throw new Error("Missing widget session token");
  }
  return jwt.verify(token, config.widgetSessionSecret);
};
