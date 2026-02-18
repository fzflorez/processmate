/**
 * AI Service Type Definitions
 * Provides type safety for AI client, service, and validation operations
 */

import { z } from "zod";

/**
 * AI Provider types
 */
export enum AIProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  LOCAL = "local",
}

/**
 * AI Model configuration
 */
export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
}

/**
 * AI Client configuration
 */
export interface AIClientConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * AI Request payload
 */
export interface AIRequest {
  prompt: string;
  model: AIModelConfig;
  systemPrompt?: string;
  context?: Record<string, unknown>;
  stream?: boolean;
}

/**
 * AI Response structure
 */
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
  finishReason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Structured AI response with validation
 */
export interface StructuredAIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    model: string;
    provider: AIProvider;
    tokens?: number;
    cost?: number;
    latency?: number;
  };
}

/**
 * AI Service configuration
 */
export interface AIServiceConfig {
  client: AIClientConfig;
  defaultModel: AIModelConfig;
  enableCaching?: boolean;
  enableValidation?: boolean;
  maxConcurrency?: number;
}

/**
 * Validation schema for AI responses
 */
export interface AIValidationSchema<T = unknown> {
  schema: z.ZodSchema<T>;
  description?: string;
  examples?: T[];
}

/**
 * AI Service error types
 */
export enum AIServiceError {
  INVALID_API_KEY = "INVALID_API_KEY",
  MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INVALID_REQUEST = "INVALID_REQUEST",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * AI Service error details
 */
export interface AIServiceErrorDetails {
  code: AIServiceError;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

/**
 * Prompt template for AI service
 */
export interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "array" | "object";
      required: boolean;
      description?: string;
      defaultValue?: unknown;
    }
  >;
  validationSchema?: AIValidationSchema;
  metadata?: Record<string, unknown>;
}

/**
 * AI Service execution context
 */
export interface AIServiceContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI Service metrics
 */
export interface AIServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalTokens: number;
  totalCost: number;
  errorRates: Record<AIServiceError, number>;
}

/**
 * Cache entry for AI responses
 */
export interface AICacheEntry {
  response: AIResponse;
  timestamp: number;
  ttl: number;
  key: string;
}

/**
 * Streaming AI response
 */
export interface AIStreamingResponse {
  id: string;
  content: string;
  isComplete: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * AI Service event types
 */
export enum AIServiceEvent {
  REQUEST_START = "REQUEST_START",
  REQUEST_SUCCESS = "REQUEST_SUCCESS",
  REQUEST_ERROR = "REQUEST_ERROR",
  STREAM_START = "STREAM_START",
  STREAM_CHUNK = "STREAM_CHUNK",
  STREAM_END = "STREAM_END",
  CACHE_HIT = "CACHE_HIT",
  CACHE_MISS = "CACHE_MISS",
}

/**
 * AI Service event payload
 */
export interface AIServiceEventPayload {
  type: AIServiceEvent;
  requestId: string;
  timestamp: number;
  data?: Record<string, unknown>;
  error?: AIServiceErrorDetails;
}
