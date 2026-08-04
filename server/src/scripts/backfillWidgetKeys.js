/**
 * =============================================================================
 * Backfill Script: Widget API Keys (backfillWidgetKeys.js)
 * =============================================================================
 * Purpose: Generates and populates a unique `widgetApiKey` for any existing User
 * documents in MongoDB that lack one.
 *
 * Usage Instructions:
 *  1. Staging Run (Dry-Run mode first):
 *     MONGODB_URI="mongodb+srv://<user>:<pass>@staging-cluster..." node src/scripts/backfillWidgetKeys.js --dry-run
 *
 *  2. Staging Run (Apply changes):
 *     MONGODB_URI="mongodb+srv://<user>:<pass>@staging-cluster..." node src/scripts/backfillWidgetKeys.js
 *
 *  3. Production Run (Dry-Run mode first):
 *     MONGODB_URI="mongodb+srv://<user>:<pass>@prod-cluster..." node src/scripts/backfillWidgetKeys.js --dry-run
 *
 *  4. Production Run (Apply changes):
 *     MONGODB_URI="mongodb+srv://<user>:<pass>@prod-cluster..." node src/scripts/backfillWidgetKeys.js
 *
 * Environment Variables Expected:
 *  - MONGODB_URI: Valid MongoDB connection string targeting destination database.
 * =============================================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User, { generateWidgetApiKey } from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const backfillWidgetKeys = async (isDryRun = false) => {
  const usersToUpdate = await User.find({
    $or: [{ widgetApiKey: { $exists: false } }, { widgetApiKey: null }, { widgetApiKey: "" }],
  });

  const modeText = isDryRun ? "[Dry Run]" : "[Backfill]";
  console.log(`${modeText} Found ${usersToUpdate.length} user(s) missing a widgetApiKey.`);

  let updatedCount = 0;
  for (const user of usersToUpdate) {
    const generatedKey = generateWidgetApiKey();
    if (isDryRun) {
      console.log(`${modeText} WOULD update user ID: ${user._id} (${user.email} - ${user.name}) -> ${generatedKey}`);
    } else {
      user.widgetApiKey = generatedKey;
      await user.save();
      console.log(`${modeText} Updated user ID: ${user._id} (${user.email}) -> ${user.widgetApiKey}`);
    }
    updatedCount++;
  }

  if (isDryRun) {
    console.log(`${modeText} Complete: ${updatedCount} user(s) would be backfilled. (0 database writes executed)`);
  } else {
    console.log(`${modeText} Complete: ${updatedCount} user(s) backfilled.`);
  }

  return updatedCount;
};

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith("backfillWidgetKeys.js")) {
  const isDryRun = process.argv.includes("--dry-run");
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("[Backfill Error] MONGODB_URI is not set.");
    process.exit(1);
  }

  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log(`[Backfill] Connected to MongoDB. (Dry Run Mode: ${isDryRun ? "ENABLED" : "DISABLED"})`);
      await backfillWidgetKeys(isDryRun);
      await mongoose.disconnect();
      console.log("[Backfill] Disconnected from MongoDB.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Backfill Error]", err);
      process.exit(1);
    });
}
