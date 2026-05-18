import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function test() {
  console.log("Starting model listing...");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
