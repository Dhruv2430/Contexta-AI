import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { getEmbeddingsModel } from "./embeddingService.js";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Vector Service
//
// WHY this file exists:
// Handles all interactions with the local FAISS vector database.
// FAISS (Facebook AI Similarity Search) stores vectors and allows fast
// nearest-neighbor searches (semantic search).
//
// MULTI-TENANCY:
// To ensure users only access their own documents, we either:
// 1. Maintain a single index and filter results by metadata (FAISS node has limited metadata filtering compared to Pinecone).
// 2. Maintain a separate FAISS index per user. (We will use this approach for complete isolation and safety).
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, "../..");
const VECTOR_STORE_DIR = path.join(SERVER_ROOT, "faiss_index");

// Ensure the directory exists
if (!fs.existsSync(VECTOR_STORE_DIR)) {
  fs.mkdirSync(VECTOR_STORE_DIR, { recursive: true });
}

/**
 * Gets the path for a user's specific FAISS index.
 */
const getUserIndexPath = (userId) => {
  return path.join(VECTOR_STORE_DIR, `user_${userId}`);
};

const removeDirectoryIfExists = (directory) => {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};

const getIndexStats = async (indexPath) => {
  if (
    !fs.existsSync(path.join(indexPath, "faiss.index")) ||
    !fs.existsSync(path.join(indexPath, "docstore.json"))
  ) {
    return { exists: false, usable: false, dimension: 0, total: 0 };
  }

  try {
    const { IndexFlatL2 } = await FaissStore.importFaiss();
    const index = IndexFlatL2.read(path.join(indexPath, "faiss.index"));
    const dimension = index.getDimension();
    const total = index.ntotal();

    return {
      exists: true,
      usable: dimension > 0 && total > 0,
      dimension,
      total,
    };
  } catch (error) {
    console.warn("Unable to inspect FAISS index:", error.message);
    return { exists: true, usable: false, dimension: 0, total: 0 };
  }
};

export const hasUsableVectorStore = async (userId) => {
  const stats = await getIndexStats(getUserIndexPath(userId));
  return stats.usable;
};

export const getUserVectorStoreStats = async (userId) => {
  return getIndexStats(getUserIndexPath(userId));
};

export const clearUserVectorStore = (userId) => {
  removeDirectoryIfExists(getUserIndexPath(userId));
};

/**
 * Adds chunks (documents) to a user's FAISS index.
 * @param {Array} docs - Array of Langchain Document objects (chunks) with metadata.
 * @param {String} userId - The ID of the user.
 */
export const addDocumentsToVectorStore = async (docs, userId) => {
  if (!docs || docs.length === 0) {
    return;
  }

  const embeddings = getEmbeddingsModel();
  const indexPath = getUserIndexPath(userId);

  let vectorStore;
  const existingIndex = await getIndexStats(indexPath);

  if (existingIndex.exists && !existingIndex.usable) {
    console.warn(`Removing unusable FAISS index for user ${userId}.`);
    removeDirectoryIfExists(indexPath);
  }

  if (existingIndex.usable) {
    // Load existing index
    vectorStore = await FaissStore.load(indexPath, embeddings);
    await vectorStore.addDocuments(docs);
  } else {
    // Create new index
    vectorStore = await FaissStore.fromDocuments(docs, embeddings);
  }

  // Save the updated index back to disk
  await vectorStore.save(indexPath);
};

/**
 * Performs a semantic similarity search on a user's FAISS index.
 * @param {String} query - The user's question.
 * @param {String} userId - The ID of the user (for isolation).
 * @param {Number} topK - The number of top chunks to retrieve.
 * @returns {Array} - Array of top matching Langchain Document chunks.
 */
export const searchSimilarChunks = async (query, userId, topK = 4) => {
  const embeddings = getEmbeddingsModel();
  const indexPath = getUserIndexPath(userId);

  const existingIndex = await getIndexStats(indexPath);

  if (!existingIndex.usable) {
    // If no index exists, they haven't uploaded any processed documents yet
    return [];
  }

  const vectorStore = await FaissStore.load(indexPath, embeddings);
  
  // Perform similarity search
  // similaritySearch returns an array of Documents sorted by relevance
  const results = await vectorStore.similaritySearch(query, topK);
  
  return results;
};

export const getAllIndexedChunks = async (userId) => {
  const indexPath = getUserIndexPath(userId);
  const docstorePath = path.join(indexPath, "docstore.json");

  if (!fs.existsSync(docstorePath)) {
    return [];
  }

  const rawDocstore = await fsPromises.readFile(docstorePath, "utf8");
  const [docstoreEntries] = JSON.parse(rawDocstore);

  return docstoreEntries
    .map(([, doc]) => doc)
    .filter((doc) => doc?.pageContent);
};

/**
 * (Optional) Delete a document's chunks from the vector store.
 * Note: FAISS node wrapper doesn't easily support deleting by metadata. 
 * Often, local FAISS stores are rebuilt if individual document deletion is needed.
 * But we'll leave a stub here.
 */
export const deleteDocumentFromVectorStore = async (documentId, userId) => {
    // In a production vector DB like Pinecone, you'd do vectorStore.delete({ filter: { documentId }})
    // For local FAISS, to fully implement deletion, we'd have to filter the internal docstore and rebuild the index.
    console.log(`Document deletion from vector store not fully supported in local FAISS. (Skipped for ${documentId})`);
};
