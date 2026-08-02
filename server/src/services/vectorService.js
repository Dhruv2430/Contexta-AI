import { MongoDBAtlasVectorSearch } from "@langchain/community/vectorstores/mongodb_atlas";
import mongoose from "mongoose";
import { getEmbeddingsModel } from "./embeddingService.js";

// ---------------------------------------------------------------------------
// Vector Service (MongoDB Atlas Vector Search)
//
// WHY this file exists:
// Handles all vector storage and semantic search operations using MongoDB
// Atlas Vector Search.
//
// MULTI-TENANCY:
// Enforced via MongoDB Atlas preFilter metadata matching (e.g. userId).
// ---------------------------------------------------------------------------

const COLLECTION_NAME = "documentchunks";
const INDEX_NAME = "vector_index";

/**
 * Gets the MongoDB Collection for storing vector documents.
 */
const getVectorCollection = () => {
  if (!mongoose.connection || !mongoose.connection.db) {
    throw new Error("MongoDB connection is not established.");
  }
  return mongoose.connection.db.collection(COLLECTION_NAME);
};

/**
 * Instantiates the MongoDBAtlasVectorSearch store wrapper.
 */
const getVectorStore = () => {
  const collection = getVectorCollection();
  const embeddings = getEmbeddingsModel();

  return new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection,
    indexName: INDEX_NAME,
    textKey: "text",
    embeddingKey: "embedding",
  });
};

export const hasUsableVectorStore = async (userId) => {
  const collection = getVectorCollection();
  const count = await collection.countDocuments({
    $or: [{ userId: userId.toString() }, { "metadata.userId": userId.toString() }],
  });
  return count > 0;
};

export const getUserVectorStoreStats = async (userId) => {
  try {
    const collection = getVectorCollection();
    const total = await collection.countDocuments({
      $or: [{ userId: userId.toString() }, { "metadata.userId": userId.toString() }],
    });

    return {
      exists: total > 0,
      usable: total > 0,
      dimension: 3072,
      total,
    };
  } catch (error) {
    console.warn("Unable to inspect MongoDB Atlas vector store:", error.message);
    return { exists: false, usable: false, dimension: 0, total: 0 };
  }
};

export const clearUserVectorStore = async (userId) => {
  const collection = getVectorCollection();
  const userIdStr = userId.toString();

  let userObjectId = null;
  try {
    userObjectId = new mongoose.Types.ObjectId(userIdStr);
  } catch {}

  const userConditions = [{ userId: userIdStr }, { "metadata.userId": userIdStr }];
  if (userObjectId) {
    userConditions.push({ userId: userObjectId }, { "metadata.userId": userObjectId });
  }

  const query = { $or: userConditions };

  console.log("[VectorService] clearUserVectorStore BEFORE deleteMany. Query:", JSON.stringify(query));
  const result = await collection.deleteMany(query);
  console.log(`[VectorService] clearUserVectorStore AFTER deleteMany. Result: deletedCount = ${result.deletedCount}`);
  return result;
};

/**
 * Adds chunks (documents) to MongoDB Atlas vector store.
 * @param {Array} docs - Array of Langchain Document objects (chunks) with metadata.
 * @param {String} userId - The ID of the user.
 */
export const addDocumentsToVectorStore = async (docs, userId) => {
  if (!docs || docs.length === 0) {
    return;
  }

  // Ensure metadata has userId for pre-filtering
  docs.forEach((doc) => {
    doc.metadata = {
      ...doc.metadata,
      userId: userId.toString(),
    };
  });

  const vectorStore = getVectorStore();
  await vectorStore.addDocuments(docs);
};

/**
 * Performs a semantic similarity search on MongoDB Atlas vector store.
 * @param {String} query - The user's question.
 * @param {String} userId - The ID of the user (for isolation).
 * @param {Number} topK - The number of top chunks to retrieve.
 * @returns {Array} - Array of top matching Langchain Document chunks.
 */
export const searchSimilarChunks = async (query, userId, topK = 4) => {
  const vectorStore = getVectorStore();
  const results = await vectorStore.similaritySearch(query, topK, {
    preFilter: {
      userId: {
        $eq: userId.toString(),
      },
    },
  });
  return results;
};

/**
 * Performs a semantic similarity search with similarity scores attached.
 */
export const searchSimilarChunksWithScore = async (query, userId, topK = 4) => {
  const vectorStore = getVectorStore();
  const resultsWithScore = await vectorStore.similaritySearchWithScore(query, topK, {
    preFilter: {
      userId: {
        $eq: userId.toString(),
      },
    },
  });

  return resultsWithScore.map(([doc, score]) => ({
    ...doc,
    score,
  }));
};

export const getAllIndexedChunks = async (userId) => {
  const collection = getVectorCollection();
  const userIdStr = userId.toString();
  const rawDocs = await collection
    .find({ $or: [{ userId: userIdStr }, { "metadata.userId": userIdStr }] })
    .toArray();

  return rawDocs.map((doc) => ({
    pageContent: doc.text || doc.pageContent,
    metadata: doc.metadata || {
      documentId: doc.documentId,
      filename: doc.filename,
      originalName: doc.originalName,
      userId: doc.userId,
    },
  }));
};

/**
 * Delete a document's chunks from MongoDB Atlas vector store.
 */
export const deleteDocumentFromVectorStore = async (documentId, userId) => {
  const collection = getVectorCollection();
  const docIdStr = documentId.toString();
  const userIdStr = userId.toString();

  let docObjectId = null;
  let userObjectId = null;
  try {
    docObjectId = new mongoose.Types.ObjectId(docIdStr);
  } catch {}
  try {
    userObjectId = new mongoose.Types.ObjectId(userIdStr);
  } catch {}

  const userConditions = [{ userId: userIdStr }, { "metadata.userId": userIdStr }];
  if (userObjectId) {
    userConditions.push({ userId: userObjectId }, { "metadata.userId": userObjectId });
  }

  const docConditions = [{ documentId: docIdStr }, { "metadata.documentId": docIdStr }];
  if (docObjectId) {
    docConditions.push({ documentId: docObjectId }, { "metadata.documentId": docObjectId });
  }

  const query = {
    $and: [
      { $or: userConditions },
      { $or: docConditions },
    ],
  };

  console.log("[VectorService] deleteDocumentFromVectorStore BEFORE deleteMany. Query:", JSON.stringify(query));
  const result = await collection.deleteMany(query);
  console.log(`[VectorService] deleteDocumentFromVectorStore AFTER deleteMany. Result: deletedCount = ${result.deletedCount}`);
  return result;
};
