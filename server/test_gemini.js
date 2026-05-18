import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function test() {
  console.log("Starting test with new API key...");
  try {
    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API,
      model: "gemini-2.5-flash",
    });
    console.log("Invoking LLM with gemini-2.5-flash...");
    const res = await llm.invoke("Say hello");
    console.log("Response:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
