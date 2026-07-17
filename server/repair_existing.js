import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdf-parse";
import dotenv from "dotenv";

import Document from "./src/models/Document.js";
import { rebuildVectorStoreForUser } from "./src/services/ragService.js";
import config from "./src/config/env.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set!");
  process.exit(1);
}

async function repair() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Find all documents with the parser failure placeholder
    const docs = await Document.find({
      $or: [
        { extractedText: "[Could not extract text from PDF]" },
        { extractedText: "" },
        { extractedText: { $exists: false } }
      ]
    });

    console.log(`Found ${docs.length} documents that need repair.\n`);

    const affectedUserIds = new Set();

    for (const doc of docs) {
      console.log(`Processing document: "${doc.originalName}" (ID: ${doc._id})`);
      affectedUserIds.add(doc.uploadedBy.toString());

      let fileBuffer;
      let targetPath = doc.filepath;

      try {
        fileBuffer = await fs.readFile(targetPath);
        console.log(`- Read file directly from path: ${targetPath}`);
      } catch (err) {
        // Fallback to local uploads directory
        const filename = path.basename(doc.filepath);
        const localPath = path.join(config.uploadsDir, filename);
        try {
          fileBuffer = await fs.readFile(localPath);
          targetPath = localPath;
          console.log(`- Read file from fallback uploads path: ${localPath}`);
        } catch (localErr) {
          console.warn(`- Physical file not found for "${doc.originalName}" (checked original and uploads fallback).`);
          doc.processingStatus = "failed";
          doc.processingError = "Physical PDF file not found on the local server. Please delete and re-upload this document.";
          await doc.save();
          continue;
        }
      }

      // Parse the PDF
      try {
        console.log("- Extracting text using PDFParse...");
        const parser = new pdfjs.PDFParse({ data: fileBuffer });
        const result = await parser.getText();
        
        const extractedText = result.text || "";
        const pageCount = result.total || 0;

        if (!extractedText.trim()) {
          throw new Error("No extractable text found in this PDF");
        }

        doc.extractedText = extractedText;
        doc.pageCount = pageCount;
        doc.filepath = targetPath;
        doc.processingStatus = "processed";
        doc.processingError = "";
        await doc.save();

        console.log(`- SUCCESS: Reparsed ${pageCount} pages (${extractedText.length} chars).`);
      } catch (parseError) {
        console.error(`- ERROR parsing PDF:`, parseError.message);
        doc.processingStatus = "failed";
        doc.processingError = parseError.message;
        await doc.save();
      }
      console.log();
    }

    // Now, rebuild the vector store for all affected users
    console.log("Rebuilding vector stores for affected users...");
    for (const userId of affectedUserIds) {
      console.log(`Rebuilding FAISS index for user: ${userId}`);
      const result = await rebuildVectorStoreForUser(userId);
      console.log(`- Rebuild complete. Usable index: ${result.rebuilt}, total chunks: ${result.chunks}`);
    }

    console.log("\nRepair process finished successfully!");

  } catch (err) {
    console.error("Critical error in repair script:", err);
  } finally {
    await mongoose.disconnect();
  }
}

repair();
