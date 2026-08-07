import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import type { AIProvider } from "@/types/settings";

/**
 * Get a language model instance based on provider and model ID.
 */
export function getModel(provider: AIProvider, modelId: string) {
  switch (provider) {
    case "groq":
      return groq(modelId);
    case "google":
      return google(modelId);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
