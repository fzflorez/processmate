/**
 * AI Services Module
 * Contains AI client, service, validation, and prompt management components
 */

// Import instances for use in aiServices object
import { aiService } from "./ai-service";
import { aiValidator } from "./ai-validator";
import { AIClientFactory } from "./ai-client";

// Export AI client and factory
export {
  AIClientFactory,
  OpenAIClient,
  AnthropicClient,
  LocalAIClient,
  type IAIClient,
} from "./ai-client";

// Export AI service
export { AIService, aiService } from "./ai-service";

// Export AI validator
export { AIValidator, CommonSchemas, aiValidator } from "./ai-validator";

// Export AI types
export * from "./ai.types";

/**
 * AI service configuration and utilities
 */
export const aiServices = {
  aiService,
  aiValidator,
  clientFactory: AIClientFactory,
};

/**
 * AI service types and interfaces
 */
export type AIServiceConfig = {
  client: {
    apiKey: string;
    baseURL?: string;
    organization?: string;
    timeout?: number;
    maxRetries?: number;
  };
  defaultModel: {
    provider: "openai" | "anthropic" | "local";
    model: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    timeout?: number;
  };
  enableCaching?: boolean;
  enableValidation?: boolean;
  maxConcurrency?: number;
};
