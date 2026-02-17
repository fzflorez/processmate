/**
 * AI Prompt Type Definitions
 * Provides type safety for AI prompt templates and configurations
 */

/**
 * Base prompt interface
 */
export interface BasePrompt {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  version: string;
}

/**
 * Prompt categories for organization
 */
export enum PromptCategory {
  CHAT = 'chat',
  PROCESSING = 'processing',
  GENERATION = 'generation',
  ANALYSIS = 'analysis',
  VALIDATION = 'validation',
  TRANSFORMATION = 'transformation',
}

/**
 * Template variable interface
 */
export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: unknown;
}

/**
 * Prompt template interface
 */
export interface PromptTemplate extends BasePrompt {
  template: string;
  variables: PromptVariable[];
  examples?: PromptExample[];
  metadata?: Record<string, unknown>;
}

/**
 * Prompt example for documentation
 */
export interface PromptExample {
  input: Record<string, unknown>;
  output: string;
  description?: string;
}

/**
 * Compiled prompt with resolved variables
 */
export interface CompiledPrompt {
  id: string;
  content: string;
  variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
  compiledAt: string;
}

/**
 * Prompt validation result
 */
export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Prompt loader configuration
 */
export interface PromptLoaderConfig {
  templatesPath?: string;
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableValidation?: boolean;
}

/**
 * AI model configuration
 */
export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Prompt execution context
 */
export interface PromptExecutionContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  model: AIModelConfig;
}

/**
 * Prompt execution result
 */
export interface PromptExecutionResult {
  success: boolean;
  content?: string;
  tokens?: number;
  cost?: number;
  latency?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}
