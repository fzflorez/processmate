/**
 * Document Builder Schemas
 * Zod validation schemas for document generation and builder functionality
 */

import { z } from "zod";

// Base schemas
export const UUIDSchema = z.string().uuid();

export const DateSchema = z.date();

export const StringSchema = z.string().min(1, "This field is required");

// Question validation schemas
export const DocumentQuestionValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  custom: z.string().optional(),
});

export const DocumentQuestionConditionalSchema = z.object({
  questionId: UUIDSchema,
  operator: z.enum(["equals", "not_equals", "contains", "not_contains"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const DocumentQuestionSchema = z.object({
  id: UUIDSchema,
  type: z.enum([
    "text",
    "textarea",
    "select",
    "multiselect",
    "radio",
    "checkbox",
    "date",
    "number",
  ]),
  question: StringSchema,
  description: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  validation: DocumentQuestionValidationSchema.optional(),
  conditional: DocumentQuestionConditionalSchema.optional(),
});

// Answer validation schemas
export const DocumentAnswerSchema = z.object({
  questionId: UUIDSchema,
  value: z.union([
    z.string(),
    z.array(z.string()),
    z.number(),
    z.boolean(),
    z.date(),
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Template validation schemas
export const DocumentTemplateSchema = z.object({
  id: UUIDSchema,
  name: StringSchema,
  description: StringSchema,
  category: StringSchema,
  questions: z.array(DocumentQuestionSchema),
  promptTemplate: StringSchema,
  outputFormat: z.enum(["markdown", "html", "plain-text", "json"]),
  variables: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Section validation schemas
export const DocumentSectionSchema = z.object({
  id: UUIDSchema,
  title: StringSchema,
  content: StringSchema,
  order: z.number().min(0),
  type: z.enum(["header", "paragraph", "list", "table", "image", "code"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Document validation schemas
export const DocumentMetadataSchema = z.object({
  wordCount: z.number().min(0),
  readingTime: z.number().min(0),
  format: StringSchema,
  language: StringSchema,
});

export const DocumentSchema = z.object({
  id: UUIDSchema,
  title: StringSchema,
  description: z.string().optional(),
  content: StringSchema,
  sections: z.array(DocumentSectionSchema),
  templateId: UUIDSchema,
  answers: z.array(DocumentAnswerSchema),
  metadata: DocumentMetadataSchema,
  status: z.enum(["draft", "review", "completed", "archived"]),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: StringSchema,
  version: z.number().min(1),
});

// State and context schemas
export const DocumentBuilderStateSchema = z.object({
  currentStep: z.enum([
    "template-selection",
    "questionnaire",
    "generation",
    "editing",
    "export",
  ]),
  selectedTemplate: DocumentTemplateSchema.nullable(),
  answers: z.array(DocumentAnswerSchema),
  currentQuestionIndex: z.number().min(0),
  generatedDocument: DocumentSchema.nullable(),
  isGenerating: z.boolean(),
  error: z.string().nullable(),
  progress: z.number().min(0).max(100),
});

// Export options schema
export const DocumentExportOptionsSchema = z.object({
  format: z.enum(["pdf", "docx", "html", "markdown", "txt", "json"]),
  includeMetadata: z.boolean(),
  includeAnswers: z.boolean(),
  template: z.string().optional(),
  customOptions: z.record(z.string(), z.unknown()).optional(),
});

// Generation request schema
export const DocumentGenerationRequestSchema = z.object({
  templateId: UUIDSchema,
  answers: z.array(DocumentAnswerSchema),
  customPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional(),
});

// Generation response schema
export const DocumentUsageSchema = z.object({
  promptTokens: z.number().min(0),
  completionTokens: z.number().min(0),
  totalTokens: z.number().min(0),
});

export const DocumentGenerationResponseSchema = z.object({
  document: DocumentSchema,
  usage: DocumentUsageSchema,
  processingTime: z.number().min(0),
});

// Validation error schema
export const DocumentValidationErrorSchema = z.object({
  field: StringSchema,
  message: StringSchema,
  code: StringSchema,
});

// Type exports
export type DocumentQuestion = z.infer<typeof DocumentQuestionSchema>;
export type DocumentAnswer = z.infer<typeof DocumentAnswerSchema>;
export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;
export type DocumentSection = z.infer<typeof DocumentSectionSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentBuilderState = z.infer<typeof DocumentBuilderStateSchema>;
export type DocumentExportOptions = z.infer<typeof DocumentExportOptionsSchema>;
export type DocumentGenerationRequest = z.infer<
  typeof DocumentGenerationRequestSchema
>;
export type DocumentGenerationResponse = z.infer<
  typeof DocumentGenerationResponseSchema
>;
export type DocumentValidationError = z.infer<
  typeof DocumentValidationErrorSchema
>;

// Validation functions
export const validateDocumentQuestion = (data: unknown) => {
  return DocumentQuestionSchema.safeParse(data);
};

export const validateDocumentAnswer = (data: unknown) => {
  return DocumentAnswerSchema.safeParse(data);
};

export const validateDocumentTemplate = (data: unknown) => {
  return DocumentTemplateSchema.safeParse(data);
};

export const validateDocument = (data: unknown) => {
  return DocumentSchema.safeParse(data);
};

export const validateDocumentExportOptions = (data: unknown) => {
  return DocumentExportOptionsSchema.safeParse(data);
};

export const validateDocumentGenerationRequest = (data: unknown) => {
  return DocumentGenerationRequestSchema.safeParse(data);
};
