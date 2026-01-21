/**
 * Google Generative AI client wrapper
 * Uses official SDK instead of raw HTTP for better security and reliability
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Singleton instance
let genAI: GoogleGenerativeAI | null = null;

// Image generation models
export const IMAGE_MODELS = {
  FLASH: "gemini-2.0-flash-exp",           // Fast generation
  PRO: "gemini-1.5-pro",                   // Higher quality
  IMAGEN: "imagen-3.0-generate-001",       // Dedicated image model
} as const;

/**
 * Get or create the singleton Google AI client
 */
export function getGoogleAIClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set. " +
        "Please add it to your .env file."
      );
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
  }
  
  return genAI;
}

/**
 * Get a generative model instance
 */
export function getModel(modelId: string) {
  const client = getGoogleAIClient();
  return client.getGenerativeModel({ 
    model: modelId,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });
}

/**
 * Generate content with automatic retry on transient failures
 */
export async function generateWithRetry(
  modelId: string,
  prompt: string,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    generationConfig?: {
      temperature?: number;
      topK?: number;
      topP?: number;
      maxOutputTokens?: number;
    };
  } = {}
): Promise<string> {
  const { maxRetries = 3, retryDelay = 1000, generationConfig } = options;
  const model = getModel(modelId);
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      const response = result.response;
      const text = response.text();
      
      console.log("[Google AI] Model: " + modelId + ", Attempt: " + (attempt + 1) + ", Success");
      return text;
    } catch (error) {
      lastError = error as Error;
      console.warn("[Google AI] Attempt " + (attempt + 1) + " failed:", error);
      
      // Don't retry on non-transient errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes("invalid") || message.includes("not found") || message.includes("permission")) {
          throw error;
        }
      }
      
      // Wait before retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Generation failed after retries");
}

/**
 * Generate image using Gemini's image generation capability
 * Note: This is a wrapper - actual image generation may need specific model endpoints
 */
export async function generateImage(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    modelId?: string;
  } = {}
): Promise<{ base64: string; mimeType: string } | null> {
  const { modelId = "gemini-2.0-flash-exp" } = options;
  
  // For now, this is a placeholder that maintains the existing interface
  // The actual image generation still uses the direct API endpoint
  // because the SDK doesn't fully support image generation yet
  
  console.log("[Google AI] Image generation requested: " + modelId);
  
  // Return null to indicate SDK doesn't support this yet
  // Caller should fall back to direct API
  return null;
}

/**
 * Parse response safely
 */
export function parseJsonResponse<T>(text: string): T | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch {
    console.warn("[Google AI] Failed to parse JSON response");
    return null;
  }
}
