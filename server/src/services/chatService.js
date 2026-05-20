import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getAllIndexedChunks, searchSimilarChunks } from "./vectorService.js";
import { hasUsableVectorStore } from "./vectorService.js";
import { PromptTemplate } from "@langchain/core/prompts";
import Document from "../models/Document.js";

// ---------------------------------------------------------------------------
// Chat Service (Retrieval Pipeline)
//
// WHY this file exists:
// Handles the "QA" phase of RAG. When a user asks a question:
// 1. Convert question to embedding & search FAISS for similar chunks.
// 2. Format those chunks into a prompt context.
// 3. Send the strict prompt + context + question to the LLM to get an answer.
// ---------------------------------------------------------------------------

let llmInstance = null;
const DEFAULT_CHAT_MODEL = "gemini-2.5-flash";
const LLM_TIMEOUT_MS = 30000; // 30 seconds

const getLLM = () => {
  if (!llmInstance) {
    if (!process.env.GEMINI_API) {
      throw new Error("GEMINI_API is not set in the environment variables");
    }
    
    llmInstance = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API,
      model: process.env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL,
      temperature: 0,
      maxRetries: 0,
    });
  }
  return llmInstance;
};

const getResponseText = (content) => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();
  }

  return "";
};

// ---------------------------------------------------------------------------
// Timeout wrapper for async operations
// ---------------------------------------------------------------------------
const withTimeout = (promise, ms, label = "Operation") => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
};

// ---------------------------------------------------------------------------
// Retry wrapper with exponential backoff
// ---------------------------------------------------------------------------
const withRetry = async (fn, { retries = 1, baseDelay = 1000, label = "Operation" } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`${label} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LOCAL_CHUNK_SIZE = 2000;
const LOCAL_CHUNK_OVERLAP = 300;
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "for", "from",
  "how", "i", "in", "is", "it", "of", "on", "or", "please", "tell", "that",
  "the", "this", "to", "what", "when", "where", "which", "who", "why", "with",
  "you", "your",
]);

const dedupeSources = (chunks) => {
  const sources = chunks.map((chunk) => ({
    filename: chunk.metadata?.originalName || chunk.metadata?.filename || "Uploaded document",
    documentId: chunk.metadata?.documentId,
  }));

  return Array.from(new Set(sources.map((source) => source.filename))).map(
    (filename) => sources.find((source) => source.filename === filename)
  );
};

const isEmailQuestion = (question) => {
  return /\b(e-?mail|mail id|email id|contact email)\b/i.test(question);
};

const tokenize = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
};

const chunkText = (text) => {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks = [];
  for (let start = 0; start < normalized.length; start += LOCAL_CHUNK_SIZE - LOCAL_CHUNK_OVERLAP) {
    let end = Math.min(start + LOCAL_CHUNK_SIZE, normalized.length);
    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf(" ", end);
      if (boundary > start + LOCAL_CHUNK_SIZE * 0.75) {
        end = boundary;
      }
    }

    chunks.push(normalized.slice(start, end).trim());
    if (start + LOCAL_CHUNK_SIZE >= normalized.length) break;
  }
  return chunks;
};

const trimToWordBoundary = (text, maxLength = 700) => {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const boundary = Math.max(truncated.lastIndexOf("."), truncated.lastIndexOf(" "), 0);
  return `${truncated.slice(0, boundary).trim()}.`;
};

const getLocalDocumentChunks = async (userId) => {
  const docs = await Document.find({ uploadedBy: userId })
    .select("_id filename originalName extractedText")
    .lean();

  return docs.flatMap((doc) =>
    chunkText(doc.extractedText).map((pageContent, index) => ({
      pageContent,
      metadata: {
        documentId: doc._id.toString(),
        filename: doc.filename,
        originalName: doc.originalName,
        localChunkIndex: index,
      },
    }))
  );
};

const searchLocalDocumentChunks = async (question, userId, topK = 6) => {
  const queryTerms = tokenize(question);
  const chunks = await getLocalDocumentChunks(userId);

  if (chunks.length === 0) return [];

  const scored = chunks.map((chunk) => {
    const text = chunk.pageContent.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      if (text.includes(term)) {
        const matches = text.match(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"));
        score += 3 + (matches?.length || 0);
      }
    }

    if (question.length > 6 && text.includes(question.toLowerCase())) {
      score += 10;
    }

    return { chunk, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
};

const buildExtractiveAnswer = (question, chunks) => {
  if (!chunks || chunks.length === 0) {
    return "I could not find that information in the uploaded documents.";
  }

  const queryTerms = tokenize(question);
  const sentences = chunks
    .flatMap((chunk) =>
      chunk.pageContent
        .split(/(?<=[.!?])\s+|\n+/)
        .map((sentence) => sentence.replace(/\s+/g, " ").trim())
        .filter((sentence) => sentence.length > 25)
    )
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      const score = queryTerms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0);
      return { sentence, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.sentence);

  const answerText = sentences.length > 0
    ? trimToWordBoundary(sentences.join(" "))
    : trimToWordBoundary(chunks[0].pageContent.trim());

  return `From the uploaded documents: ${answerText}`;
};

const findEmailMatches = async (userId) => {
  let allChunks = [];

  try {
    allChunks = await getAllIndexedChunks(userId);
  } catch (error) {
    console.warn("[RAG] Could not read indexed chunks for email lookup:", error.message);
  }

  if (allChunks.length === 0) {
    allChunks = await getLocalDocumentChunks(userId);
  }

  const matchedChunks = allChunks.filter((chunk) => EMAIL_REGEX.test(chunk.pageContent));
  EMAIL_REGEX.lastIndex = 0;

  const emails = Array.from(
    new Set(
      matchedChunks.flatMap((chunk) => {
        EMAIL_REGEX.lastIndex = 0;
        return chunk.pageContent.match(EMAIL_REGEX) || [];
      })
    )
  );

  return { emails, matchedChunks };
};

export const generateAnswer = async (question, userId) => {
  console.log(`[RAG] Starting answer generation for user ${userId}. Query: "${question}"`);

  const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful customer support AI assistant. You have access to context extracted from uploaded knowledge base documents.

Context from uploaded documents:
{context}

Question: {question}

Instructions:
- FIRST, check if the user's question is a simple greeting or general conversation (like "hi", "hello", "hey", "how are you", "who are you", "what is this chat"). If so, respond in a warm, friendly, professional manner, explaining that you are a helpful support agent ready to assist with their uploaded documents, and invite them to ask a question.
- For all other questions, read the provided context carefully and answer the question based on it.
- If the question requests specific facts or document data that are NOT present in the provided context, respond politely with: "I could not find that information in the uploaded documents."
- Do not invent facts or use outside knowledge for document-specific queries. Answer concisely, professionally, and clearly. Format your output with markdown if appropriate.
  `);

  const localFallback = async (reason) => {
    if (reason) {
      console.warn(`[RAG] Using local document fallback: ${reason}`);
    }

    const localChunks = await searchLocalDocumentChunks(question, userId, 6);
    const uniqueSources = dedupeSources(localChunks);

    if (localChunks.length === 0) {
      // If we literally have 0 documents uploaded, check if query is greeting/general chat
      const isGreeting = /^(hi|hello|hey|yo|greetings|how are you|who are you|what is this)\b/i.test(question.trim().toLowerCase());
      if (isGreeting) {
        try {
          const llm = getLLM();
          const prompt = await promptTemplate.format({
            context: "[No documents uploaded yet]",
            question
          });
          const response = await withRetry(
            () => withTimeout(llm.invoke(prompt), LLM_TIMEOUT_MS, "Gemini LLM Greeting Call"),
            { retries: 0, baseDelay: 0, label: "LLM generation" }
          );
          return {
            answer: getResponseText(response.content),
            sources: []
          };
        } catch (err) {
          return {
            answer: "Hello! I am your AI support assistant. Please upload some knowledge base documents (PDFs) in the dashboard so I can help answer specific questions!",
            sources: []
          };
        }
      }
      return {
        answer: "Please upload some knowledge base documents (PDFs) in the dashboard so I can help answer your questions.",
        sources: [],
      };
    }

    // Format context using local text chunks
    const context = localChunks.map(chunk => chunk.pageContent).join("\n\n---\n\n");
    
    try {
      const prompt = await promptTemplate.format({
        context,
        question
      });
      const llm = getLLM();
      console.log(`[RAG Fallback] Invoking Gemini LLM for local chunks fallback...`);
      const response = await withRetry(
        () => withTimeout(llm.invoke(prompt), LLM_TIMEOUT_MS, "Gemini LLM Fallback call"),
        { retries: 0, baseDelay: 0, label: "LLM generation" }
      );
      return {
        answer: getResponseText(response.content) || "I could not find that information in the uploaded documents.",
        sources: uniqueSources,
      };
    } catch (error) {
      console.error("[RAG Fallback] Gemini LLM generation failed. Using extractive fallback:", error.message);
      return {
        answer: buildExtractiveAnswer(question, localChunks),
        sources: uniqueSources,
      };
    }
  };

  // 1. Ensure a usable local FAISS index exists.
  console.log(`[RAG] Step 1: Checking vector store...`);
  const isUsable = await hasUsableVectorStore(userId);
  if (!isUsable) {
    return localFallback(`vector store not found or unusable for user ${userId}`);
  }

  if (isEmailQuestion(question)) {
    console.log(`[RAG] Detected email-specific question.`);
    const { emails, matchedChunks } = await findEmailMatches(userId);

    if (emails.length > 0) {
      console.log(`[RAG] Found ${emails.length} emails in index.`);
      return {
        answer: emails.length === 1
          ? `The email is ${emails[0]}.`
          : `The emails are: ${emails.join(", ")}.`,
        sources: dedupeSources(matchedChunks),
      };
    }
  }

  // 2. Perform Similarity Search (top 6 for better recall)
  console.log(`[RAG] Step 2: Performing vector similarity search...`);
  let relevantChunks = [];
  try {
    relevantChunks = await searchSimilarChunks(question, userId, 6);
    console.log(`[RAG] Found ${relevantChunks.length} relevant chunks.`);
  } catch (error) {
    console.error("[RAG] Vector search failed:", error.message);
    return localFallback(error.message);
  }

  // If no chunks were found
  if (!relevantChunks || relevantChunks.length === 0) {
    console.log(`[RAG] No chunks found. Aborting generation.`);
    return localFallback("vector search returned no chunks");
  }

  // 3. Format Context
  console.log(`[RAG] Step 3: Formatting context for prompt...`);
  const context = relevantChunks.map(chunk => chunk.pageContent).join("\n\n---\n\n");
  let uniqueSources = dedupeSources(relevantChunks);

  // 4. Create Strict Prompt Template
  console.log(`[RAG] Step 4: Constructing prompt...`);
  const prompt = await promptTemplate.format({
    context,
    question
  });

  // 5. Generate Answer with timeout and retry
  console.log(`[RAG] Step 5: Invoking Gemini LLM (Timeout: ${LLM_TIMEOUT_MS}ms)...`);
  const llm = getLLM();

  let answer = "";
  try {
    const response = await withRetry(
      () => withTimeout(llm.invoke(prompt), LLM_TIMEOUT_MS, "Gemini LLM call"),
      { retries: 0, baseDelay: 0, label: "LLM generation" }
    );

    console.log(`[RAG] Success: Received response from Gemini.`);
    answer = getResponseText(response.content);
  } catch (error) {
    console.warn("[RAG] Gemini generation failed. Returning local fallback:", error.message);
    return localFallback(error.message);
  }

  return {
    answer: answer || "I could not find that information in the uploaded documents.",
    sources: uniqueSources,
  };
};
