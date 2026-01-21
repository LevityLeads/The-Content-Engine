/**
 * Singleton Anthropic client for consistent API access across routes
 * Provides centralized error handling, logging, and configuration
 */

import Anthropic from "@anthropic-ai/sdk";
import { logAnthropicUsage } from "@/lib/api/usage-logger";

// Singleton instance
let anthropicClient: Anthropic | null = null;

// Default model - Claude Opus 4.5 for highest quality
export const DEFAULT_MODEL = "claude-opus-4-5-20251101";

// Model options for different use cases
export const MODELS = {
  OPUS: "claude-opus-4-5-20251101",      // Highest quality, most capable
  SONNET: "claude-sonnet-4-20250514",    // Fast, good quality
} as const;

export type ModelId = typeof MODELS[keyof typeof MODELS];

/**
 * Get or create the singleton Anthropic client
 * Validates API key on first initialization
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is not set. " +
        "Please add it to your .env file."
      );
    }
    
    anthropicClient = new Anthropic({
      apiKey,
    });
  }
  
  return anthropicClient;
}

/**
 * Generate a message using Claude with consistent error handling
 */
export async function generateMessage(options: {
  model?: ModelId;
  maxTokens?: number;
  messages: Anthropic.MessageParam[];
  system?: string;
}): Promise<Anthropic.Message> {
  const client = getAnthropicClient();
  
  const { 
    model = DEFAULT_MODEL, 
    maxTokens = 4096, 
    messages,
    system 
  } = options;
  
  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages,
      ...(system && { system }),
    });
    
    // Log usage for cost tracking
    logAnthropicUsage(
      model,
      "message",
      response.usage.input_tokens,
      response.usage.output_tokens
    );
    
    return response;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Anthropic.APIError) {
      console.error(`[Anthropic API Error] Status: ${error.status}, Message: ${error.message}`);
      throw new Error(`Claude API error (${error.status}): ${error.message}`);
    }
    throw error;
  }
}

/**
 * Extract text content from Claude response
 */
export function extractTextContent(response: Anthropic.Message): string {
  const textBlock = response.content.find(block => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

/**
 * Extract JSON from Claude response with validation
 */
export function extractJsonContent<T>(response: Anthropic.Message): T | null {
  const text = extractTextContent(response);
  
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn("[Anthropic] No JSON found in response");
    return null;
  }
  
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch (error) {
    console.error("[Anthropic] Failed to parse JSON:", error);
    return null;
  }
}
