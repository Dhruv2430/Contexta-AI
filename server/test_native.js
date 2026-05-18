import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
  console.log("Starting native SDK test with new API key...");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("Generating content...");
    const result = await model.generateContent("Say hello");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Native SDK Error Details:", {
      name: err.name,
      message: err.message,
      status: err.status,
      statusText: err.statusText,
    });
  }
}

test();
