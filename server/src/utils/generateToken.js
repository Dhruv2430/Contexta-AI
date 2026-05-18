import jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Generate a signed JWT token for a given user ID
// Centralised here so both signup and login controllers share the same logic
// ---------------------------------------------------------------------------
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export default generateToken;
