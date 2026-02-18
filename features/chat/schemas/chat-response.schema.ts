/**
 * Chat Response Validation Schemas
 * Zod schemas for validating AI responses and API responses
 */

import { z } from "zod";

// AI API Response Schema
export const AIResponseSchema = z.object({
  id: z.string().uuid(),
  object: z.literal("chat.completion"),
  created: z.number(),
  model: z.string().min(1),
  choices: z.array(
    z.object({
      index: z.number(),
      message: z.object({
        role: z.literal("assistant"),
        content: z.string().nullable(),
      }),
      finish_reason: z.enum([
        "stop",
        "length",
        "content_filter",
        "function_call",
      ]),
    }),
  ),
  usage: z.object({
    prompt_tokens: z.number().nonnegative(),
    completion_tokens: z.number().nonnegative(),
    total_tokens: z.number().nonnegative(),
  }),
});

// Streaming Response Chunk Schema
export const AIStreamChunkSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion.chunk"),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      delta: z.object({
        role: z.enum(["assistant"]).optional(),
        content: z.string().optional(),
      }),
      finish_reason: z
        .enum(["stop", "length", "content_filter", "function_call"])
        .nullable(),
    }),
  ),
});

// Error Response Schema
export const AIErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string(),
    code: z.string().optional(),
    param: z.string().optional(),
  }),
});

// Internal Response Processing Schema
export const ProcessedResponseSchema = z.object({
  messageId: z.string().uuid(),
  conversationId: z.string().uuid(),
  content: z.string(),
  metadata: z.object({
    model: z.string(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    promptTokens: z.number().nonnegative(),
    completionTokens: z.number().nonnegative(),
    totalTokens: z.number().nonnegative(),
    processingTime: z.number().nonnegative(),
    confidence: z.number().min(0).max(1).optional(),
    sources: z.array(z.string()).optional(),
    reasoning: z.string().optional(),
  }),
  status: z.enum(["success", "error", "filtered"]),
  error: z.string().optional(),
  timestamp: z.coerce.date(),
});

// Response Validation Schema
export const ResponseValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  sanitizedContent: z.string().optional(),
});

// Content Filter Schema
export const ContentFilterSchema = z.object({
  flagged: z.boolean(),
  categories: z.array(z.string()),
  severity: z.enum(["low", "medium", "high"]),
  filteredContent: z.string().optional(),
  reason: z.string().optional(),
});

// Response Quality Schema
export const ResponseQualitySchema = z.object({
  relevance: z.number().min(0).max(1),
  coherence: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  accuracy: z.number().min(0).max(1),
  overall: z.number().min(0).max(1),
  feedback: z.string().optional(),
});

// Validation functions
export const validateAIResponse = (data: unknown) => {
  return AIResponseSchema.safeParse(data);
};

export const validateAIStreamChunk = (data: unknown) => {
  return AIStreamChunkSchema.safeParse(data);
};

export const validateAIErrorResponse = (data: unknown) => {
  return AIErrorResponseSchema.safeParse(data);
};

export const validateProcessedResponse = (data: unknown) => {
  return ProcessedResponseSchema.safeParse(data);
};

export const validateContentFilter = (data: unknown) => {
  return ContentFilterSchema.safeParse(data);
};

export const validateResponseQuality = (data: unknown) => {
  return ResponseQualitySchema.safeParse(data);
};

// ProcessMate Structured Response Schema
export const ProcessMateResponseSchema = z.object({
  intent: z.enum(["document", "process", "reminder", "general"]),
  title: z.string().min(1).max(100),
  summary: z.string().min(1).max(200),
  content: z.union([
    // Document intent content
    z.object({
      documentType: z.enum(["formal letter", "email", "request", "other"]),
      sections: z.array(
        z.object({
          heading: z.string(),
          body: z.string(),
        }),
      ),
    }),
    // Process intent content
    z.object({
      steps: z.array(
        z.object({
          step: z.number().positive(),
          description: z.string(),
          status: z.enum(["pending", "in_progress", "completed"]),
        }),
      ),
      estimatedDuration: z.string(),
    }),
    // Reminder intent content
    z.object({
      eventTitle: z.string(),
      date: z.string().nullable(),
      notes: z.string(),
    }),
    // General intent content
    z.object({
      response: z.string(),
    }),
  ]),
  confidence: z.number().min(0).max(1),
});

// Validation function for ProcessMate responses
export const validateProcessMateResponse = (data: unknown) => {
  return ProcessMateResponseSchema.safeParse(data);
};

// Type exports for inference
export type AIResponseInput = z.infer<typeof AIResponseSchema>;
export type AIStreamChunkInput = z.infer<typeof AIStreamChunkSchema>;
export type AIErrorResponseInput = z.infer<typeof AIErrorResponseSchema>;
export type ProcessedResponseInput = z.infer<typeof ProcessedResponseSchema>;
export type ResponseValidationInput = z.infer<typeof ResponseValidationSchema>;
export type ContentFilterInput = z.infer<typeof ContentFilterSchema>;
export type ResponseQualityInput = z.infer<typeof ResponseQualitySchema>;
export type ProcessMateResponseInput = z.infer<
  typeof ProcessMateResponseSchema
>;
