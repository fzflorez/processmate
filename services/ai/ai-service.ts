/**
 * AI Service
 * Main service for AI operations with prompt templates and validation
 */

import { createSuccessResult, createErrorResult } from "../service-result";
import { ServiceError } from "../service-error";
import type { ServiceResult } from "../service-result";
import { AIClientFactory, type IAIClient } from "./ai-client";
import { aiValidator, type AIValidator } from "./ai-validator";
import { promptLoader } from "../../prompts/prompt-loader";
import {
  AIServiceError,
  type AIProvider,
  type AIServiceConfig,
  type AIRequest,
  type AIResponse,
  type StructuredAIResponse,
  type AIServiceContext,
  type AIServiceMetrics,
  type AICacheEntry,
  type AIServiceErrorDetails,
  type AIValidationSchema,
} from "./ai.types";

/**
 * Main AI Service class
 */
export class AIService {
  private client: IAIClient | null = null;
  private config: AIServiceConfig | null = null;
  private validator: AIValidator;
  private cache = new Map<string, AICacheEntry>();
  private metrics: AIServiceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    totalTokens: 0,
    totalCost: 0,
    errorRates: Object.fromEntries(
      Object.values(AIServiceError).map((error) => [error, 0]),
    ) as Record<AIServiceError, number>,
  };

  constructor(validator: AIValidator = aiValidator) {
    this.validator = validator;
  }

  /**
   * Initialize the AI service with configuration
   */
  async initialize(config: AIServiceConfig): Promise<void> {
    this.config = config;

    try {
      this.client = AIClientFactory.createClient(
        config.client,
        config.defaultModel.provider,
      );
      await this.client.initialize(config.client);
    } catch (error) {
      throw new Error(
        `Failed to initialize AI service: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Send a prompt to AI and get structured response
   */
  async sendPrompt<T>(
    templateId: string,
    variables: Record<string, unknown> = {},
    schemaKey?: string,
    context?: Partial<AIServiceContext>,
  ): Promise<ServiceResult<StructuredAIResponse<T>>> {
    if (!this.client || !this.config) {
      return createErrorResult(
        ServiceError.internal(
          "AI service not initialized",
          "AI_SERVICE_NOT_INITIALIZED",
        ),
      );
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const fullContext: AIServiceContext = {
      ...context,
      requestId,
      metadata: {
        ...context?.metadata,
        templateId,
        variables,
      },
    };

    try {
      // Load and compile prompt template
      const compiledPrompt = promptLoader.compilePrompt(templateId, variables);

      if (!compiledPrompt) {
        return createErrorResult(
          ServiceError.internal(
            `Failed to compile prompt template: ${templateId}`,
            "PROMPT_COMPILATION_FAILED",
          ),
        );
      }

      // Create AI request
      const request: AIRequest = {
        prompt: compiledPrompt.content,
        model: this.config.defaultModel,
        systemPrompt: this.getSystemPrompt(templateId),
        context: fullContext as Record<string, unknown>,
      };

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      if (this.config.enableCaching) {
        const cached = this.getCachedResponse(cacheKey);
        if (cached) {
          this.updateMetrics(
            true,
            Date.now() - startTime,
            cached.response.usage?.totalTokens,
          );
          return this.createStructuredResponse<T>(
            cached.response.content,
            schemaKey,
            cached.response,
          );
        }
      }

      // Send request to AI
      const response = await this.client.sendRequest(request);

      // Cache response
      if (this.config.enableCaching) {
        this.setCachedResponse(cacheKey, response);
      }

      // Update metrics
      this.updateMetrics(
        true,
        Date.now() - startTime,
        response.usage?.totalTokens,
      );

      // Create structured response
      return this.createStructuredResponse<T>(
        response.content,
        schemaKey,
        response,
      );
    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      return createErrorResult(
        this.handleAIError(error as AIServiceErrorDetails),
      );
    }
  }

  /**
   * Send raw prompt to AI
   */
  async sendRawPrompt(
    prompt: string,
    options: {
      systemPrompt?: string;
      model?: Partial<AIServiceConfig["defaultModel"]>;
      context?: Partial<AIServiceContext>;
    } = {},
  ): Promise<ServiceResult<AIResponse>> {
    if (!this.client || !this.config) {
      return createErrorResult(
        ServiceError.internal(
          "AI service not initialized",
          "AI_SERVICE_NOT_INITIALIZED",
        ),
      );
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const request: AIRequest = {
        prompt,
        model: { ...this.config.defaultModel, ...options.model },
        systemPrompt: options.systemPrompt,
        context: {
          ...options.context,
          requestId,
        },
      };

      const response = await this.client.sendRequest(request);
      this.updateMetrics(
        true,
        Date.now() - startTime,
        response.usage?.totalTokens,
      );

      return createSuccessResult(response);
    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      return createErrorResult(
        this.handleAIError(error as AIServiceErrorDetails),
      );
    }
  }

  /**
   * Validate AI response against a schema
   */
  validateResponse<T>(
    response: string,
    schema: AIValidationSchema<T>,
  ): StructuredAIResponse<T> {
    return this.validator.validateResponse(response, schema);
  }

  /**
   * Register a validation schema
   */
  registerValidationSchema(key: string, schema: AIValidationSchema): void {
    this.validator.registerSchema(key, schema);
  }

  /**
   * Get service metrics
   */
  getMetrics(): AIServiceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      totalTokens: 0,
      totalCost: 0,
      errorRates: Object.fromEntries(
        Object.values(AIServiceError).map((error) => [error, 0]),
      ) as Record<AIServiceError, number>,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This would require tracking cache hits/misses
    return {
      size: this.cache.size,
      hitRate: 0, // Placeholder
    };
  }

  /**
   * Create structured response from AI response
   */
  private createStructuredResponse<T>(
    content: string,
    schemaKey?: string,
    originalResponse?: AIResponse,
  ): ServiceResult<StructuredAIResponse<T>> {
    try {
      let result: StructuredAIResponse<T>;

      if (schemaKey) {
        result = this.validator.validateResponseWithKey<T>(content, schemaKey);
      } else {
        // Return raw content as string
        result = {
          success: true,
          data: content as T,
          metadata: {
            model: originalResponse?.model || "unknown",
            provider: originalResponse?.provider || ("unknown" as AIProvider),
            tokens: originalResponse?.usage?.totalTokens,
            latency: undefined,
          },
        };
      }

      if (result.success && originalResponse) {
        result.metadata = {
          ...result.metadata,
          model: originalResponse.model,
          provider: originalResponse.provider,
          tokens: originalResponse.usage?.totalTokens,
        };
      }

      return createSuccessResult(result);
    } catch (error) {
      return createErrorResult(
        ServiceError.internal(
          `Failed to create structured response: ${error instanceof Error ? error.message : "Unknown error"}`,
          "STRUCTURED_RESPONSE_ERROR",
        ),
      );
    }
  }

  /**
   * Get system prompt for template
   */
  private getSystemPrompt(templateId: string): string {
    console.log(`Using system prompt for template: ${templateId}`);
    return "You are a helpful AI assistant. Please provide accurate and structured responses.";
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: AIRequest): string {
    const key = {
      prompt: request.prompt,
      model: request.model.model,
      systemPrompt: request.systemPrompt,
    };
    return Buffer.from(JSON.stringify(key)).toString("base64");
  }

  /**
   * Get cached response
   */
  private getCachedResponse(key: string): AICacheEntry | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Set cached response
   */
  private setCachedResponse(key: string, response: AIResponse): void {
    const entry: AICacheEntry = {
      response,
      timestamp: Date.now(),
      ttl: 300000, // 5 minutes
      key,
    };
    this.cache.set(key, entry);
  }

  /**
   * Update service metrics
   */
  private updateMetrics(
    success: boolean,
    latency: number,
    tokens?: number,
  ): void {
    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average latency
    const totalLatency =
      this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency;
    this.metrics.averageLatency = totalLatency / this.metrics.totalRequests;

    // Update tokens
    if (tokens) {
      this.metrics.totalTokens += tokens;
    }
  }

  /**
   * Handle AI service errors
   */
  private handleAIError(error: AIServiceErrorDetails): ServiceError {
    // Update error rates
    if (this.metrics.errorRates[error.code] !== undefined) {
      this.metrics.errorRates[error.code]++;
    }

    return ServiceError.externalService(error.message, error.code, undefined, {
      details: error.details,
    });
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Default AI service instance
 */
export const aiService = new AIService();
