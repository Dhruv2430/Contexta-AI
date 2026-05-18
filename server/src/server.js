// ---------------------------------------------------------------------------
// Server Entry Point
//
// IMPORTANT: env.js MUST be imported first — it loads .env and validates
// all required variables before any other module tries to use them.
// ---------------------------------------------------------------------------
import config from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";

connectDB();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});