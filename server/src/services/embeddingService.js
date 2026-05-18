import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// ---------------------------------------------------------------------------
// Embedding Service
//
// WHY this file exists:
// This service abstracts the embedding model provider. Currently, we use Google Gemini.
// If we switch to OpenAI or a local model (like Ollama), we only change this file.
//
// WHAT are embeddings:
// Embeddings convert text into a dense array of numbers (vectors) that capture
// semantic meaning. Two pieces of text with similar meaning will have similar vectors.
// ---------------------------------------------------------------------------

const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

class ValidatedGoogleGenerativeAIEmbeddings extends GoogleGenerativeAIEmbeddings {
  validateVectors(vectors, label) {
    if (!Array.isArray(vectors) || vectors.length === 0) {
      throw new Error(`Gemini returned no ${label} embeddings.`);
    }

    const invalidIndex = vectors.findIndex(
      (vector) => !Array.isArray(vector) || vector.length === 0
    );

    if (invalidIndex !== -1) {
      throw new Error(
        `Gemini returned an empty embedding for ${label} item ${invalidIndex + 1}. Check the API key, model name, and quota.`
      );
    }

    return vectors;
  }

  async embedDocuments(documents) {
    const vectors = await super.embedDocuments(documents);
    return this.validateVectors(vectors, "document");
  }

  async embedQuery(document) {
    const vector = await super.embedQuery(document);
    return this.validateVectors([vector], "query")[0];
  }
}

let embeddingsInstance = null;

export const getEmbeddingsModel = () => {
  if (!embeddingsInstance) {
    if (!process.env.GEMINI_API) {
      throw new Error("GEMINI_API is not set in the environment variables");
    }

    embeddingsInstance = new ValidatedGoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API,
      model: process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
      maxRetries: 0,
    });
  }
  return embeddingsInstance;
};
