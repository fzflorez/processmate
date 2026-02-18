/**
 * AI Service Interface
 * Defines the contract for AI service implementations
 */

import type { MessageStreamChunk } from "../types";
import type { AIClientConfig } from "../../../services/ai/ai.types";

export interface AIService {
  /**
   * Send a message to the AI and get a streaming response
   * @param message - The user message to send
   * @param conversationId - The conversation ID
   * @returns Async iterable of message chunks
   */
  sendMessage(
    message: string,
    conversationId: string,
  ): Promise<AsyncIterable<MessageStreamChunk>>;

  /**
   * Regenerate a response for a given message
   * @param messageId - The message ID to regenerate response for
   * @param conversationId - The conversation ID
   * @returns Async iterable of message chunks
   */
  regenerateResponse(
    messageId: string,
    conversationId: string,
  ): Promise<AsyncIterable<MessageStreamChunk>>;

  /**
   * Cancel an ongoing request
   * @param conversationId - The conversation ID
   */
  cancelRequest(conversationId: string): Promise<void>;

  /**
   * Get available AI models
   * @returns Array of available model names
   */
  getAvailableModels(): Promise<string[]>;

  /**
   * Set the AI model to use
   * @param model - The model name
   */
  setModel(model: string): void;

  /**
   * Get current model configuration
   * @returns Current model settings
   */
  getModelConfig(): {
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

/**
 * OpenAI Service Implementation
 * Concrete implementation for OpenAI API
 */
export class OpenAIService implements AIService {
  private apiKey: string;
  private model: string = "gpt-4";
  private temperature: number = 0.7;
  private maxTokens: number = 2000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    message: string,
  ): Promise<AsyncIterable<MessageStreamChunk>> {
    // Implementation would go here
    // This is a placeholder that returns an empty iterable
    return this.createMockStream(message);
  }

  async regenerateResponse(): Promise<AsyncIterable<MessageStreamChunk>> {
    // Implementation would go here
    return this.createMockStream("Regenerated response");
  }

  async cancelRequest(): Promise<void> {
    // Implementation would cancel the request
  }

  async getAvailableModels(): Promise<string[]> {
    return ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"];
  }

  setModel(model: string): void {
    this.model = model;
  }

  getModelConfig() {
    return {
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };
  }

  private async *createMockStream(
    message: string,
  ): AsyncIterable<MessageStreamChunk> {
    const words = message.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];

      yield {
        id: `chunk-${i}`,
        content: currentText,
        isComplete: i === words.length - 1,
        timestamp: new Date(),
      };

      // Simulate streaming delay
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

/**
 * Factory function to create AI service instances
 */
export function createAIService(
  provider: "openai" | "anthropic" | "local",
  config: AIClientConfig,
): AIService {
  switch (provider) {
    case "openai":
      return new OpenAIService(config.apiKey);
    case "anthropic":
      // return new AnthropicService(config.apiKey);
      throw new Error("Anthropic service not implemented yet");
    case "local":
      // return new LocalAIService(config.endpoint);
      throw new Error("Local AI service not implemented yet");
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
