import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getAllIndexedChunks, searchSimilarChunks, searchSimilarChunksWithScore, hasUsableVectorStore } from "./vectorService.js";
import { PromptTemplate } from "@langchain/core/prompts";
import Document from "../models/Document.js";
import KnowledgeGap from "../models/KnowledgeGap.js";
import config from "../config/env.js";

// ---------------------------------------------------------------------------
// Chat Service (Retrieval Pipeline)
// ---------------------------------------------------------------------------

let llmInstance = null;
const DEFAULT_CHAT_MODEL = "gemini-2.0-flash";
const LLM_TIMEOUT_MS = 30000; // 30 seconds

const getLLM = () => {
  if (!llmInstance) {
    const apiKey = process.env.GEMINI_API || config.geminiApi;
    if (!apiKey) {
      throw new Error("GEMINI_API is not set in the environment variables");
    }

    llmInstance = new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_CHAT_MODEL || config.geminiChatModel || DEFAULT_CHAT_MODEL,
      temperature: 0.2,
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

// Clean duplicate or stacked file extensions (e.g. "file.docx.pdf.pdf" -> "file.pdf")
const cleanFilename = (name) => {
  if (!name) return "Uploaded document";
  let base = name.trim();
  base = base.replace(/(\.(pdf|docx|doc|txt|png|jpg|jpeg))+$/i, "");
  return `${base}.pdf`;
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
  "explain", "explains", "describe", "describes", "list", "lists", "summarize",
  "summarises", "summarise", "show", "shows", "find", "finds", "give", "gives",
  "get", "gets", "write", "writes", "define", "defines", "answer", "answers"
]);

const dedupeSources = (chunks) => {
  const sources = chunks.map((chunk) => ({
    filename: cleanFilename(chunk.metadata?.originalName || chunk.metadata?.filename),
    documentId: chunk.metadata?.documentId,
  }));

  return Array.from(new Set(sources.map((source) => source.filename))).map(
    (filename) => sources.find((source) => source.filename === filename)
  );
};

const isEmailQuestion = (question) => {
  return /\b(e-?mail|mail id|email id|contact email)\b/i.test(question);
};

const isGreetingOrConversational = (text) => {
  const normalized = (text || "").trim().toLowerCase();
  if (!normalized) return true;

  if (/^(h+[ie1]+y*|h+[ie1]+|hello+|he+y+|yo+|greetings|namaste|hola|howdy|wass?up|sup)\b/i.test(normalized)) {
    return true;
  }

  const patterns = [
    /^good\s+(morning|afternoon|evening|day|night)\b/i,
    /^(how\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name|what\s+can\s+you\s+do|what\s+do\s+you\s+do)\b/i,
    /^(tell\s+me\s+about\s+yourself|who\s+made\s+you|are\s+you\s+an?\s+ai|help(\s+me)?|greet|start|welcome)\b/i,
  ];

  return patterns.some((p) => p.test(normalized));
};

const isIncompleteQuery = (text) => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= 3 && !isGreetingOrConversational(text)) {
    const lower = (text || "").trim().toLowerCase();
    if (/^(i'm|i am|i want|i will|going to|and|so|or|because|the|a|an)\b/i.test(lower)) {
      return true;
    }
  }
  return false;
};

const formatExtractiveText = (rawText) => {
  if (!rawText) return "";
  return rawText
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/[●•]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  const docs = await Document.find({ uploadedBy: userId, processingStatus: "processed" })
    .select("_id filename originalName extractedText")
    .lean();

  return docs.flatMap((doc) =>
    chunkText(doc.extractedText).map((pageContent, index) => ({
      pageContent,
      metadata: {
        documentId: doc._id.toString(),
        filename: cleanFilename(doc.filename),
        originalName: cleanFilename(doc.originalName || doc.filename),
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
    return null;
  }

  const queryTerms = tokenize(question);
  if (queryTerms.length === 0) {
    return null;
  }

  const sentences = chunks
    .flatMap((chunk) =>
      chunk.pageContent
        .split(/(?<=[.!?])\s+|\n+/)
        .map((sentence) => formatExtractiveText(sentence))
        .filter((sentence) => sentence.length > 20)
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

  if (sentences.length === 0) {
    return null;
  }

  return trimToWordBoundary(sentences.join(" "));
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

// Cosine similarity threshold (scores below 0.65 indicate low confidence)
const DISTANCE_THRESHOLD = 0.65;

const logKnowledgeGap = async (userId, question, score) => {
  try {
    await KnowledgeGap.create({
      userId,
      question: question.trim(),
      confidenceScore: typeof score === "number" ? score : null,
    });
    console.log(`[RAG] Logged knowledge gap for user ${userId}: "${question}" (score: ${score})`);
  } catch (err) {
    console.error("[RAG] Failed to log knowledge gap:", err.message);
  }
};

export const generateAnswer = async (question, userId, chatHistory = []) => {
  console.log(`[RAG] Starting answer generation for user ${userId}. Query: "${question}"`);

  // 1. Fetch document metadata for this user from MongoDB & clean names
  let docCount = 0;
  let docNames = "None";
  try {
    const docs = await Document.find({ uploadedBy: userId, processingStatus: "processed" })
      .select("originalName filename")
      .lean();
    docCount = docs.length;
    const names = docs.map(d => cleanFilename(d.originalName || d.filename));
    docNames = Array.from(new Set(names)).join(", ") || "None";
  } catch (error) {
    console.error("[RAG] Failed to fetch document metadata:", error.message);
  }

  // 2. Immediate check for Greetings & Conversational Queries (e.g. "hi", "hii", "hello", "good morning")
  if (isGreetingOrConversational(question)) {
    if (docCount > 0) {
      return {
        answer: `Hello! 👋 How can I help you today? I'm ready to answer any questions you have based on your uploaded document(s): ${docNames}.`,
        sources: [],
      };
    } else {
      return {
        answer: `Hello! 👋 I am your AI support assistant. I noticed you haven't uploaded any documents yet. Please upload your knowledge base documents (PDFs) in the dashboard so I can help answer your questions!`,
        sources: [],
      };
    }
  }

  // 3. Immediate check for incomplete / fragment input (e.g. "I'm going to")
  if (isIncompleteQuery(question)) {
    return {
      answer: docCount > 0
        ? `It looks like your message was incomplete! How can I assist you with your uploaded document(s): ${docNames}?`
        : "It looks like your message was incomplete! Please upload your documents or ask a full question.",
      sources: [],
    };
  }

  // 4. Format chat history into readable turn transcript
  let historyFormatted = "No previous conversation.";
  let lastUserQuestion = "";

  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    historyFormatted = chatHistory
      .slice(-6)
      .map((msg) => {
        const isUser = msg.sender === "user" || msg.role === "user";
        const role = isUser ? "Customer" : "Support Specialist";
        const text = msg.text || msg.question || msg.answer || "";
        if (isUser && text) {
          lastUserQuestion = text;
        }
        return `${role}: ${text}`;
      })
      .join("\n");
  } else if (typeof chatHistory === "string" && chatHistory.trim()) {
    historyFormatted = chatHistory.trim();
  }

  // Construct contextual search query for FAISS if current question is a follow-up or short
  let searchQuery = question;
  const isShortFollowUp = question.trim().split(/\s+/).length <= 7;
  if (
    lastUserQuestion &&
    (isShortFollowUp ||
      /^(hr|technical|round|what about|how about|tell me more|details|more|which|when|where|why|how)\b/i.test(
        question.trim()
      ))
  ) {
    searchQuery = `${lastUserQuestion} ${question}`;
    console.log(`[RAG Memory] Contextualized FAISS search query: "${searchQuery}"`);
  }

  const promptTemplate = PromptTemplate.fromTemplate(`
You are a warm, knowledgeable, and empathetic human support assistant answering questions using ONLY the provided document context.

--- UPLOADED DOCUMENTS INFO ---
Total Documents Uploaded: {docCount}
Document Names: {docNames}
-------------------------------

--- RECENT CONVERSATION HISTORY ---
{chatHistory}
-----------------------------------

Context from uploaded documents:
{context}

Current Question: {question}

Strict Response Instructions:
1. **Strict Accuracy & Grounding**: Answer using ONLY the provided document context. If the context doesn't contain the answer, say so directly and naturally in plain text (referencing {docNames} if helpful).
2. **No Internal Meta-Commentary**: Never mention retrieval mode, fallback mode, basic mode, debug status, FAISS, embeddings, or internal system state.
3. **Clean Natural Prose**: Never include raw formatting artifacts from source documents (bullets like ●, •, page markers like "-- 1 of 2 --", etc.). Write purely in clean, smooth, natural sentences.
4. **Natural Human Voice**: Write as a friendly support representative. DO NOT use generic robotic AI openers like "Hello there! I can certainly help you with that" or "Based on the documents provided...".
5. **Conversational Memory**: Use RECENT CONVERSATION HISTORY to resolve follow-up questions and short references from previous turns.
  `);

  const localFallback = async (reason) => {
    if (reason) {
      console.warn(`[RAG] Using local document fallback: ${reason}`);
    }

    const localChunks = await searchLocalDocumentChunks(searchQuery, userId, 6);
    let uniqueSources = dedupeSources(localChunks);

    let emailContextLocal = "";
    let emailSourcesLocal = [];
    if (isEmailQuestion(question)) {
      const { emails, matchedChunks } = await findEmailMatches(userId);
      if (emails.length > 0) {
        emailContextLocal = `Direct email search found these emails in the files: ${emails.join(", ")}`;
        emailSourcesLocal = dedupeSources(matchedChunks);
      }
    }

    if (localChunks.length === 0 && !emailContextLocal) {
      const isMetaQuery = question.toLowerCase().includes("document") || question.toLowerCase().includes("file");

      if (isMetaQuery) {
        if (docCount > 0) {
          return {
            answer: `I currently have access to ${docCount} uploaded document(s): ${docNames}. Feel free to ask any questions about them!`,
            sources: []
          };
        }
      }

      if (docCount > 0) {
        return {
          answer: `I'm sorry, but I couldn't find any information about that in the uploaded documents (${docNames}). Please let me know if you have questions related to these files!`,
          sources: []
        };
      } else {
        return {
          answer: "It looks like there are no documents uploaded yet. Please upload some knowledge base documents (PDFs) in the dashboard so I can help answer your questions.",
          sources: [],
        };
      }
    }

    // Format context using local text chunks
    let context = localChunks.map(chunk => chunk.pageContent).join("\n\n---\n\n");
    if (emailContextLocal) {
      context = `${emailContextLocal}\n\n---\n\n${context}`;
    }
    if (emailSourcesLocal.length > 0) {
      const allSources = [...uniqueSources, ...emailSourcesLocal];
      uniqueSources = Array.from(new Set(allSources.map(s => s.filename)))
        .map(filename => allSources.find(s => s.filename === filename));
    }
    
    try {
      const prompt = await promptTemplate.format({
        docCount,
        docNames,
        chatHistory: historyFormatted,
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
        answer: getResponseText(response.content) || `I'm sorry, but I couldn't find any information about that in the uploaded documents (${docNames}). Please let me know if you have questions related to these files!`,
        sources: uniqueSources,
      };
    } catch (error) {
      console.error("[RAG Fallback] Gemini LLM generation failed. Using extractive fallback:", error.message);
      const extractive = buildExtractiveAnswer(question, localChunks);
      if (extractive) {
        return {
          answer: formatExtractiveText(extractive),
          sources: uniqueSources,
        };
      } else {
        return {
          answer: `I'm sorry, but I couldn't find any information about that in the uploaded documents (${docNames}). Please let me know if you have questions related to these files!`,
          sources: []
        };
      }
    }
  };

  // 1. Ensure a usable local FAISS index exists.
  console.log(`[RAG] Step 1: Checking vector store...`);
  const isUsable = await hasUsableVectorStore(userId);
  if (!isUsable) {
    return localFallback(`vector store not found or unusable for user ${userId}`);
  }

  let emailContext = "";
  let emailSources = [];
  if (isEmailQuestion(question)) {
    console.log(`[RAG] Detected email-specific question.`);
    const { emails, matchedChunks } = await findEmailMatches(userId);

    if (emails.length > 0) {
      console.log(`[RAG] Found ${emails.length} emails in index.`);
      emailContext = `Direct email search found these emails in the files: ${emails.join(", ")}`;
      emailSources = dedupeSources(matchedChunks);
    }
  }

  // 2. Perform Similarity Search with Scores using contextualized searchQuery
  console.log(`[RAG] Step 2: Performing vector similarity search with score for query: "${searchQuery}"...`);
  let relevantChunks = [];
  try {
    relevantChunks = await searchSimilarChunksWithScore(searchQuery, userId, 6);
    if ((!relevantChunks.length || (relevantChunks[0]?.score !== undefined && relevantChunks[0].score < DISTANCE_THRESHOLD)) && searchQuery !== question) {
      console.log(`[RAG Memory] Query "${searchQuery}" yielded low confidence. Retrying with raw question "${question}"...`);
      const fallbackChunks = await searchSimilarChunksWithScore(question, userId, 6);
      if (fallbackChunks.length && (fallbackChunks[0]?.score || 0) > (relevantChunks[0]?.score || 0)) {
        relevantChunks = fallbackChunks;
      }
    }
    console.log(`[RAG] Found ${relevantChunks.length} relevant chunks. Top score: ${relevantChunks[0]?.score}`);
  } catch (error) {
    console.error("[RAG] Vector search failed:", error.message);
    return localFallback(error.message);
  }

  // Confidence Gate Check:
  const topScore = relevantChunks[0]?.score;
  const isLowConfidence =
    !relevantChunks.length || (topScore !== undefined && topScore < DISTANCE_THRESHOLD);

  if (isLowConfidence && !emailContext) {
    console.log(
      `[RAG] Low confidence query (top score: ${topScore}, threshold: ${DISTANCE_THRESHOLD}). Checking local fallback.`
    );
    await logKnowledgeGap(userId, question, topScore);
    return localFallback("Low vector confidence score");
  }

  // 3. Format Context
  console.log(`[RAG] Step 3: Formatting context for prompt...`);
  let context = relevantChunks.map(chunk => chunk.pageContent).join("\n\n---\n\n");
  if (emailContext) {
    context = `${emailContext}\n\n---\n\n${context}`;
  }
  let uniqueSources = dedupeSources(relevantChunks);
  if (emailSources.length > 0) {
    const allSources = [...uniqueSources, ...emailSources];
    uniqueSources = Array.from(new Set(allSources.map(s => s.filename)))
      .map(filename => allSources.find(s => s.filename === filename));
  }

  // 4. Create Strict Prompt Template
  console.log(`[RAG] Step 4: Constructing prompt...`);
  const prompt = await promptTemplate.format({
    docCount,
    docNames,
    chatHistory: historyFormatted,
    context,
    question
  });

  // 5. Generate Answer with timeout and retry
  console.log(`[RAG] Step 5: Invoking Gemini LLM (Timeout: ${LLM_TIMEOUT_MS}ms)...`);

  let answer = "";
  try {
    const llm = getLLM();
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
    answer: answer || `I'm sorry, but I couldn't find any information about that in the uploaded documents (${docNames}). Please let me know if you have questions related to these files!`,
    sources: uniqueSources,
  };
};
