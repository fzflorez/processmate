/**
 * AI Validator
 * Validates AI responses using Zod schemas
 */

import { z } from "zod";
import { AIProvider } from "./ai.types";
import type { AIValidationSchema, StructuredAIResponse } from "./ai.types";

/**
 * AI Validator class for validating structured AI responses
 */
export class AIValidator {
  private schemas = new Map<string, AIValidationSchema>();

  /**
   * Register a validation schema
   */
  registerSchema(key: string, schema: AIValidationSchema): void {
    this.schemas.set(key, schema);
  }

  /**
   * Get a validation schema by key
   */
  getSchema(key: string): AIValidationSchema | undefined {
    return this.schemas.get(key);
  }

  /**
   * Validate AI response against a schema
   */
  validateResponse<T>(
    response: string,
    schema: AIValidationSchema<T>,
  ): StructuredAIResponse<T> {
    try {
      // Try to parse the response as JSON first
      let parsedResponse: unknown;

      try {
        parsedResponse = JSON.parse(response);
      } catch {
        // If JSON parsing fails, treat the response as a string
        parsedResponse = response;
      }

      // Validate against Zod schema
      const result = schema.schema.safeParse(parsedResponse);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          metadata: {
            model: "unknown",
            provider: AIProvider.OPENAI,
          },
        };
      } else {
        return {
          success: false,
          error: this.formatValidationError(result.error),
          metadata: {
            model: "unknown",
            provider: AIProvider.OPENAI,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown validation error",
        metadata: {
          model: "unknown",
          provider: AIProvider.OPENAI,
        },
      };
    }
  }

  /**
   * Validate AI response using a registered schema key
   */
  validateResponseWithKey<T>(
    response: string,
    schemaKey: string,
  ): StructuredAIResponse<T> {
    const schema = this.getSchema(schemaKey);
    if (!schema) {
      return {
        success: false,
        error: `Schema not found: ${schemaKey}`,
        metadata: {
          model: "unknown",
          provider: AIProvider.OPENAI,
        },
      };
    }

    return this.validateResponse(response, schema as AIValidationSchema<T>);
  }

  /**
   * Extract JSON from AI response text
   */
  extractJSON(response: string): string | null {
    // Look for JSON blocks in the response
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
    const matches = Array.from(response.matchAll(jsonBlockRegex));

    if (matches.length > 0) {
      return matches[0][1].trim();
    }

    // Look for JSON objects without code blocks
    const jsonObjectRegex = /\{[\s\S]*\}/g;
    const objectMatches = response.match(jsonObjectRegex);

    if (objectMatches) {
      return objectMatches[0];
    }

    // Look for JSON arrays
    const jsonArrayRegex = /\[[\s\S]*\]/g;
    const arrayMatches = response.match(jsonArrayRegex);

    if (arrayMatches) {
      return arrayMatches[0];
    }

    return null;
  }

  /**
   * Validate and extract JSON from AI response
   */
  validateAndExtractJSON<T>(
    response: string,
    schema: AIValidationSchema<T>,
  ): StructuredAIResponse<T> {
    const extractedJson = this.extractJSON(response);

    if (!extractedJson) {
      return {
        success: false,
        error: "No JSON found in response",
        metadata: {
          model: "unknown",
          provider: AIProvider.OPENAI,
        },
      };
    }

    return this.validateResponse(extractedJson, schema);
  }

  /**
   * Format Zod validation error
   */
  private formatValidationError(error: z.ZodError): string {
    const errors = error.issues.map((err: z.ZodIssue) => {
      const path = Array.isArray(err.path)
        ? err.path.join(".")
        : String(err.path);
      return `${path}: ${err.message}`;
    });

    return `Validation failed: ${errors.join(", ")}`;
  }

  /**
   * Create a validation schema from a Zod schema
   */
  static createSchema<T>(
    zodSchema: z.ZodSchema<T>,
    description?: string,
    examples?: T[],
  ): AIValidationSchema<T> {
    return {
      schema: zodSchema,
      description,
      examples,
    };
  }

  /**
   * Get all registered schemas
   */
  getAllSchemas(): Map<string, AIValidationSchema> {
    return new Map(this.schemas);
  }

  /**
   * Remove a schema
   */
  removeSchema(key: string): boolean {
    return this.schemas.delete(key);
  }

  /**
   * Clear all schemas
   */
  clearSchemas(): void {
    this.schemas.clear();
  }
}

/**
 * Common validation schemas
 */
export class CommonSchemas {
  /**
   * String response schema
   */
  static stringSchema = AIValidator.createSchema(
    z.string(),
    "Simple string response",
  );

  /**
   * Boolean response schema
   */
  static booleanSchema = AIValidator.createSchema(
    z.boolean(),
    "Boolean response (true/false)",
  );

  /**
   * Number response schema
   */
  static numberSchema = AIValidator.createSchema(
    z.number(),
    "Numeric response",
  );

  /**
   * Array of strings schema
   */
  static stringArraySchema = AIValidator.createSchema(
    z.array(z.string()),
    "Array of strings",
  );

  /**
   * Object with key-value pairs schema
   */
  static keyValueSchema = AIValidator.createSchema(
    z.record(z.string(), z.string()),
    "Key-value object",
  );

  /**
   * Analysis result schema
   */
  static analysisSchema = AIValidator.createSchema(
    z.object({
      summary: z.string(),
      insights: z.array(z.string()),
      recommendations: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    }),
    "Analysis result with summary, insights, recommendations, and confidence score",
  );

  /**
   * Chat response schema
   */
  static chatResponseSchema = AIValidator.createSchema(
    z.object({
      message: z.string(),
      sentiment: z.enum(["positive", "negative", "neutral"]),
      topics: z.array(z.string()),
      followUpQuestions: z.array(z.string()).optional(),
      context: z.string().optional(),
    }),
    "Chat response with message, sentiment, topics, and optional follow-up questions and context",
  );

  /**
   * Process step schema
   */
  static processStepSchema = AIValidator.createSchema(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      estimatedTime: z.number(),
      dependencies: z.array(z.string()),
      outputs: z.array(z.string()),
    }),
    "Process step with ID, name, description, time, dependencies, and outputs",
  );

  /**
   * Validation result schema
   */
  static validationResultSchema = AIValidator.createSchema(
    z.object({
      isValid: z.boolean(),
      errors: z.array(z.string()),
      warnings: z.array(z.string()),
      score: z.number().min(0).max(100),
    }),
    "Validation result with validity status, errors, warnings, and score",
  );
}

/**
 * Default AI validator instance
 */
export const aiValidator = new AIValidator();

// Register common schemas
aiValidator.registerSchema("string", CommonSchemas.stringSchema);
aiValidator.registerSchema("boolean", CommonSchemas.booleanSchema);
aiValidator.registerSchema("number", CommonSchemas.numberSchema);
aiValidator.registerSchema("stringArray", CommonSchemas.stringArraySchema);
aiValidator.registerSchema("keyValue", CommonSchemas.keyValueSchema);
aiValidator.registerSchema("analysis", CommonSchemas.analysisSchema);
aiValidator.registerSchema("chatResponse", CommonSchemas.chatResponseSchema);
aiValidator.registerSchema("processStep", CommonSchemas.processStepSchema);
aiValidator.registerSchema(
  "validationResult",
  CommonSchemas.validationResultSchema,
);
