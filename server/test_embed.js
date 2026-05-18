import "dotenv/config";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

async function test() {
  console.log("Starting embedding test...");
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API,
      model: "gemini-embedding-001",
    });
    console.log("Generating embeddings...");
    const res = await embeddings.embedQuery("Say hello");
    console.log("Response vector length:", res.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
