import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document as LangchainDocument } from "@langchain/core/documents";
import {
  addDocumentsToVectorStore,
  clearUserVectorStore,
  hasUsableVectorStore,
} from "./vectorService.js";
import Document from "../models/Document.js";

// ---------------------------------------------------------------------------
// RAG Service (Ingestion Pipeline)
//
// WHY this file exists:
// Handles the data ingestion phase of RAG. Once a PDF is parsed and saved
// in MongoDB, this service takes the extracted text, chunks it, and saves
// the embeddings to the vector database.
//
// WHAT is chunking:
// LLMs have a context limit (max tokens they can read at once). We can't
// feed an entire 100-page PDF into a prompt. We split the text into chunks
// (e.g., 1000 characters). The "overlap" ensures that if a sentence is
// split, the next chunk has a little bit of the previous chunk so context
// is not lost.
// ---------------------------------------------------------------------------

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 300,
});

const createChunksFromDocuments = async (docs, userId) => {
  const rawLangchainDocs = docs
    .filter((doc) => doc.extractedText && doc.extractedText.trim() !== "")
    .map(
      (doc) =>
        new LangchainDocument({
          pageContent: doc.extractedText,
          metadata: {
            documentId: doc._id.toString(),
            filename: doc.filename,
            originalName: doc.originalName,
            userId: userId.toString(),
          },
        })
    );

  if (rawLangchainDocs.length === 0) {
    return [];
  }

  return splitter.splitDocuments(rawLangchainDocs);
};

export const rebuildVectorStoreForUser = async (userId) => {
  const docs = await Document.find({ uploadedBy: userId, processingStatus: "processed" });
  const chunks = await createChunksFromDocuments(docs, userId);

  clearUserVectorStore(userId.toString());

  if (chunks.length === 0) {
    return { rebuilt: false, chunks: 0 };
  }

  await addDocumentsToVectorStore(chunks, userId.toString());
  return { rebuilt: true, chunks: chunks.length };
};

export const ensureVectorStoreForUser = async (userId) => {
  if (await hasUsableVectorStore(userId.toString())) {
    return { rebuilt: false };
  }

  return rebuildVectorStoreForUser(userId);
};

/**
 * Processes a saved document by chunking its text and storing embeddings.
 * @param {String} documentId - The MongoDB ID of the Document.
 * @param {String} userId - The ID of the user uploading the document.
 */
export const processDocumentForRAG = async (documentId, userId) => {
  try {
    // 1. Fetch the document from MongoDB
    const doc = await Document.findOne({ _id: documentId, uploadedBy: userId });
    
    if (!doc) {
      throw new Error("Document not found or access denied.");
    }

    if (!doc.extractedText || doc.extractedText.trim() === "") {
      console.warn(`Document ${documentId} has no extracted text to process.`);
      return;
    }

    // 2. Split the text into chunks
    const chunks = await createChunksFromDocuments([doc], userId);

    console.log(`Split document ${doc.filename} into ${chunks.length} chunks.`);

    // 3. Filter out empty or whitespace-only chunks
    const validChunks = chunks.filter(c => c.pageContent && c.pageContent.trim().length > 0);
    
    if (validChunks.length === 0) {
      throw new Error("No extractable text found in this document.");
    }

    // 4. Deduplicate exact matches
    const uniqueChunks = Array.from(new Set(validChunks.map(c => c.pageContent)))
      .map(content => validChunks.find(c => c.pageContent === content));

    // 5. Generate embeddings and store in FAISS
    await addDocumentsToVectorStore(uniqueChunks, userId.toString());

    console.log(`Successfully ingested document ${doc.filename} into vector store.`);
    return true;

  } catch (error) {
    console.error(`Error in processDocumentForRAG:`, error);
    throw error; // Let the controller handle the error response
  }
};
