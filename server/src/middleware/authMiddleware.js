import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ---------------------------------------------------------------------------
// Protect routes — verify JWT token from Authorization header
//
// Expected header format: "Authorization: Bearer <token>"
//
// On success: attaches the user document to req.user and calls next()
// On failure: returns 401 Unauthorized
// ---------------------------------------------------------------------------
const protect = async (req, res, next) => {
  let token;

  // --- Extract token from Authorization header ---
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // --- No token found ---
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — no token provided",
    });
  }

  try {
    // --- Verify token ---
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- Attach user to request (without password) ---
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — user no longer exists",
      });
    }

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Not authorized — token has expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized — invalid token",
    });
  }
};

export default protect;
