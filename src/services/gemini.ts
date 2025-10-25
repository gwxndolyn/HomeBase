import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('VITE_GEMINI_API_KEY environment variable not set');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function generateContent(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    return text;
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    throw error;
  }
}

export async function generateContentWithContext(prompt: string, context: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `Context: ${context}\n\nPrompt: ${prompt}`;
    const response = await model.generateContent(fullPrompt);
    const text = response.response.text();

    return text;
  } catch (error) {
    console.error('Error generating content with context:', error);
    throw error;
  }
}
