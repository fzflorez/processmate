/**
 * AI Client
 * Handles initialization and communication with AI providers
 */

import {
  AIProvider,
  AIServiceError,
  type AIClientConfig,
  type AIRequest,
  type AIResponse,
  type AIServiceErrorDetails,
} from "./ai.types";

/**
 * Base AI Client interface
 */
export interface IAIClient {
  initialize(config: AIClientConfig): Promise<void>;
  sendRequest(request: AIRequest): Promise<AIResponse>;
  validateConfig(config: AIClientConfig): boolean;
  getProvider(): AIProvider;
}

/**
 * OpenAI Client implementation
 */
export class OpenAIClient implements IAIClient {
  private config: AIClientConfig | null = null;
  private client: unknown = null; // Will be OpenAI client when installed

  getProvider(): AIProvider {
    return AIProvider.OPENAI;
  }

  validateConfig(config: AIClientConfig): boolean {
    return !!(config.apiKey && config.apiKey.trim());
  }

  async initialize(config: AIClientConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error("Invalid OpenAI configuration: API key is required");
    }

    this.config = config;

    try {
      // Initialize OpenAI client
      // Note: This will work after OpenAI SDK is installed
      const { OpenAI } = await import("openai");
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        organization: config.organization,
        timeout: config.timeout || 30000,
        maxRetries: config.maxRetries || 3,
      });
    } catch {
      // Fallback for when OpenAI SDK is not installed
      console.warn("OpenAI SDK not installed, using mock implementation");
      this.client = this.createMockClient();
    }
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new Error("OpenAI client not initialized");
    }

    try {
      // Try to use real OpenAI client
      if (
        this.client &&
        typeof (this.client as { chat?: unknown }).chat !== "undefined"
      ) {
        return await this.sendRealRequest(request);
      } else {
        // Fallback to mock implementation
        return await this.sendMockRequest(request);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async sendRealRequest(request: AIRequest): Promise<AIResponse> {
    const client = this.client as {
      chat: { completions: { create: (options: unknown) => Promise<unknown> } };
    };
    const messages: { role: string; content: string }[] = [];

    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }

    messages.push({ role: "user", content: request.prompt });

    const completion = await client.chat.completions.create({
      model: request.model.model,
      messages,
      max_tokens: request.model.maxTokens,
      temperature: request.model.temperature,
      top_p: request.model.topP,
      frequency_penalty: request.model.frequencyPenalty,
      presence_penalty: request.model.presencePenalty,
      stream: request.stream || false,
    });

    if (request.stream) {
      // Handle streaming response
      throw new Error("Streaming not yet implemented");
    }

    const result = completion as {
      choices: { message: { content: string }; finish_reason: string }[];
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
      id: string;
      created: number;
    };

    const choice = result.choices[0];

    return {
      content: choice.message.content || "",
      usage: result.usage
        ? {
            promptTokens: result.usage.prompt_tokens,
            completionTokens: result.usage.completion_tokens,
            totalTokens: result.usage.total_tokens,
          }
        : undefined,
      model: request.model.model,
      provider: AIProvider.OPENAI,
      finishReason: choice.finish_reason || undefined,
      metadata: {
        requestId: result.id,
        created: result.created,
      },
    };
  }

  private async sendMockRequest(request: AIRequest): Promise<AIResponse> {
    // Mock implementation for when OpenAI SDK is not installed
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );

    const mockTokens = Math.floor(Math.random() * 500) + 100;

    return {
      content: `Mock AI response for: "${request.prompt.substring(0, 100)}..." (OpenAI provider)`,
      usage: {
        promptTokens: Math.floor(mockTokens * 0.3),
        completionTokens: Math.floor(mockTokens * 0.7),
        totalTokens: mockTokens,
      },
      model: request.model.model,
      provider: AIProvider.OPENAI,
      finishReason: "stop",
      metadata: {
        mock: true,
        timestamp: Date.now(),
      },
    };
  }

  private createMockClient(): {
    chat: { completions: { create: () => Promise<unknown> } };
  } {
    return {
      chat: {
        completions: {
          create: async () => {
            return {
              choices: [
                {
                  message: { content: "Mock response" },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30,
              },
              id: "mock-id",
              created: Date.now(),
            };
          },
        },
      },
    };
  }

  private handleError(error: unknown): AIServiceErrorDetails {
    const timestamp = new Date().toISOString();

    if (error instanceof Error) {
      if (error.message.includes("401")) {
        return {
          code: AIServiceError.INVALID_API_KEY,
          message: "Invalid API key provided",
          details: { originalError: error.message },
          timestamp,
        };
      }

      if (error.message.includes("429")) {
        return {
          code: AIServiceError.RATE_LIMIT_EXCEEDED,
          message: "Rate limit exceeded",
          details: { originalError: error.message },
          timestamp,
        };
      }

      if (error.message.includes("timeout")) {
        return {
          code: AIServiceError.TIMEOUT_ERROR,
          message: "Request timeout",
          details: { originalError: error.message },
          timestamp,
        };
      }
    }

    return {
      code: AIServiceError.UNKNOWN_ERROR,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      details: { error },
      timestamp,
    };
  }
}

/**
 * Anthropic Client implementation (placeholder)
 */
export class AnthropicClient implements IAIClient {
  private config: AIClientConfig | null = null;

  getProvider(): AIProvider {
    return AIProvider.ANTHROPIC;
  }

  validateConfig(config: AIClientConfig): boolean {
    return !!(config.apiKey && config.apiKey.trim());
  }

  async initialize(config: AIClientConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error("Invalid Anthropic configuration: API key is required");
    }
    this.config = config;
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    // Mock implementation for Anthropic
    await new Promise((resolve) =>
      setTimeout(resolve, 150 + Math.random() * 250),
    );

    const mockTokens = Math.floor(Math.random() * 600) + 150;

    return {
      content: `Mock AI response for: "${request.prompt.substring(0, 100)}..." (Anthropic provider)`,
      usage: {
        promptTokens: Math.floor(mockTokens * 0.4),
        completionTokens: Math.floor(mockTokens * 0.6),
        totalTokens: mockTokens,
      },
      model: request.model.model,
      provider: AIProvider.ANTHROPIC,
      finishReason: "stop",
      metadata: {
        mock: true,
        timestamp: Date.now(),
      },
    };
  }
}

/**
 * Local AI Client implementation (placeholder)
 */
export class LocalAIClient implements IAIClient {
  private config: AIClientConfig | null = null;

  getProvider(): AIProvider {
    return AIProvider.LOCAL;
  }

  validateConfig(config: AIClientConfig): boolean {
    return !!(config.baseURL && config.baseURL.trim());
  }

  async initialize(config: AIClientConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error("Invalid Local AI configuration: baseURL is required");
    }
    this.config = config;
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    // Mock implementation for Local AI
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 300),
    );

    const mockTokens = Math.floor(Math.random() * 800) + 200;

    return {
      content: `Mock AI response for: "${request.prompt.substring(0, 100)}..." (Local provider)`,
      usage: {
        promptTokens: Math.floor(mockTokens * 0.5),
        completionTokens: Math.floor(mockTokens * 0.5),
        totalTokens: mockTokens,
      },
      model: request.model.model,
      provider: AIProvider.LOCAL,
      finishReason: "stop",
      metadata: {
        mock: true,
        timestamp: Date.now(),
      },
    };
  }
}

/**
 * AI Client Factory
 */
export class AIClientFactory {
  private static clients = new Map<AIProvider, IAIClient>();

  static getClient(provider: AIProvider): IAIClient {
    if (this.clients.has(provider)) {
      return this.clients.get(provider)!;
    }

    let client: IAIClient;

    switch (provider) {
      case AIProvider.OPENAI:
        client = new OpenAIClient();
        break;
      case AIProvider.ANTHROPIC:
        client = new AnthropicClient();
        break;
      case AIProvider.LOCAL:
        client = new LocalAIClient();
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    this.clients.set(provider, client);
    return client;
  }

  static createClient(config: AIClientConfig, provider: AIProvider): IAIClient {
    const client = this.getClient(provider);
    client.initialize(config);
    return client;
  }
}
