/**
 * Process Builder Schemas
 * Zod validation schemas for process building and management
 */

import { z } from "zod";

// Base schemas
export const UUIDSchema = z.string().uuid();
export const DateSchema = z.date();
export const StringSchema = z.string().min(1, "This field is required");

// Process step validation schemas
export const ProcessStepInputSchema = z.object({
  id: z.string(),
  name: StringSchema,
  type: z.enum([
    "text",
    "number",
    "date",
    "select",
    "multiselect",
    "file",
    "boolean",
  ]),
  required: z.boolean(),
  description: z.string().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      options: z.array(z.string()).optional(),
    })
    .optional(),
  defaultValue: z.unknown().optional(),
});

export const ProcessStepOutputSchema = z.object({
  id: z.string(),
  name: StringSchema,
  type: StringSchema,
  description: z.string().optional(),
});

export const ProcessStepMetadataSchema = z
  .object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
  })
  .passthrough();

export const ProcessStepSchema = z.object({
  id: UUIDSchema,
  name: StringSchema,
  description: StringSchema,
  type: z.enum([
    "input",
    "task",
    "decision",
    "approval",
    "notification",
    "delay",
    "integration",
    "validation",
  ]),
  status: z.enum([
    "pending",
    "in_progress",
    "completed",
    "skipped",
    "failed",
    "cancelled",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  estimatedDuration: z.number().min(0).optional(),
  assignee: z.string().optional(),
  dependencies: z.array(z.string()),
  inputs: z.array(ProcessStepInputSchema),
  outputs: z.array(ProcessStepOutputSchema),
  metadata: ProcessStepMetadataSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Process definition validation schema
export const ProcessDefinitionMetadataSchema = z
  .object({
    version: StringSchema,
    author: StringSchema,
    tags: z.array(z.string()),
    estimatedTotalDuration: z.number().min(0).optional(),
    complexity: z.enum(["simple", "medium", "complex"]),
  })
  .passthrough();

export const ProcessDefinitionSchema = z.object({
  id: UUIDSchema,
  name: StringSchema,
  description: StringSchema,
  category: StringSchema,
  steps: z.array(ProcessStepSchema),
  startStepId: StringSchema,
  metadata: ProcessDefinitionMetadataSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// Process execution context validation schema
export const ProcessStepExecutionSchema = z.object({
  stepId: UUIDSchema,
  status: z.enum([
    "pending",
    "in_progress",
    "completed",
    "skipped",
    "failed",
    "cancelled",
  ]),
  startTime: DateSchema,
  endTime: DateSchema.optional(),
  duration: z.number().min(0).optional(),
  assignee: z.string().optional(),
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.record(z.string(), z.unknown()),
  notes: z.string().optional(),
  error: z.string().optional(),
  retryCount: z.number().min(0).default(0),
});

export const ProcessProgressSchema = z.object({
  completed: z.number().min(0),
  total: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

export const ProcessExecutionContextSchema = z.object({
  processId: UUIDSchema,
  executionId: UUIDSchema,
  processDefinition: ProcessDefinitionSchema,
  currentStepId: z.string().optional(),
  status: z.enum([
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled",
    "paused",
  ]),
  startTime: DateSchema,
  endTime: DateSchema.optional(),
  variables: z.record(z.string(), z.unknown()),
  stepExecutions: z.array(ProcessStepExecutionSchema),
  progress: ProcessProgressSchema,
  metadata: z.record(z.string(), z.unknown()),
});

// Process builder state validation schema
export const ProcessBuilderStateSchema = z.object({
  currentStep: z.enum([
    "definition",
    "steps",
    "connections",
    "review",
    "execution",
  ]),
  processDefinition: ProcessDefinitionSchema.nullable(),
  selectedStepId: z.string().nullable(),
  isExecuting: z.boolean(),
  executionContext: ProcessExecutionContextSchema.nullable(),
  error: z.string().nullable(),
  progress: z.number().min(0).max(100),
});

// Process form data validation schema
export const ProcessFormDataSchema = z.object({
  name: StringSchema,
  description: StringSchema,
  category: StringSchema,
  estimatedDuration: z.number().min(0).optional(),
  complexity: z.enum(["simple", "medium", "complex"]),
  tags: z.array(z.string()),
});

// Process checklist item validation schema
export const ProcessChecklistItemSchema = z.object({
  id: UUIDSchema,
  stepId: UUIDSchema,
  stepName: StringSchema,
  description: StringSchema,
  completed: z.boolean(),
  required: z.boolean(),
  notes: z.string().optional(),
  dueDate: DateSchema.optional(),
  assignee: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

// Process progress data validation schema
export const ProcessMilestoneSchema = z.object({
  name: StringSchema,
  completed: z.boolean(),
  completedAt: DateSchema.optional(),
});

export const ProcessProgressDataSchema = z.object({
  processId: UUIDSchema,
  processName: StringSchema,
  totalSteps: z.number().min(0),
  completedSteps: z.number().min(0),
  currentStepName: z.string().optional(),
  status: z.enum([
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled",
    "paused",
  ]),
  startTime: DateSchema,
  estimatedCompletion: DateSchema.optional(),
  progressPercentage: z.number().min(0).max(100),
  milestones: z.array(ProcessMilestoneSchema),
});

// Process template validation schema
export const ProcessTemplateMetadataSchema = z.object({
  author: StringSchema,
  version: StringSchema,
  tags: z.array(z.string()),
  industry: z.string().optional(),
  department: z.string().optional(),
});

export const ProcessTemplateSchema = z.object({
  id: UUIDSchema,
  name: StringSchema,
  description: StringSchema,
  category: StringSchema,
  steps: z.array(
    ProcessStepSchema.omit({ id: true, createdAt: true, updatedAt: true }),
  ),
  metadata: ProcessTemplateMetadataSchema,
  isPublic: z.boolean(),
  usageCount: z.number().min(0),
  rating: z.number().min(0).max(5),
  createdAt: DateSchema,
});

// Process validation error validation schema
export const ProcessValidationErrorSchema = z.object({
  field: StringSchema,
  message: StringSchema,
  code: StringSchema,
  stepId: z.string().optional(),
});

// Process export options validation schema
export const ProcessExportOptionsSchema = z.object({
  format: z.enum(["json", "yaml", "bpmn", "markdown", "pdf"]),
  includeMetadata: z.boolean(),
  includeExecutionHistory: z.boolean(),
  template: z.string().optional(),
});

// Type exports (only for types that don't exist in types/)
export type ProcessStepInput = z.infer<typeof ProcessStepInputSchema>;
export type ProcessStepOutput = z.infer<typeof ProcessStepOutputSchema>;
export type ProcessStep = z.infer<typeof ProcessStepSchema>;
// ProcessDefinition is defined in types/, not re-exported here to avoid conflicts
export type ProcessExecutionContext = z.infer<
  typeof ProcessExecutionContextSchema
>;
// ProcessBuilderState is defined in types/, not re-exported here to avoid conflicts
export type ProcessFormData = z.infer<typeof ProcessFormDataSchema>;
// ProcessChecklistItem is defined in types/, not re-exported here to avoid conflicts
export type ProcessProgressData = z.infer<typeof ProcessProgressDataSchema>;
export type ProcessTemplate = z.infer<typeof ProcessTemplateSchema>;
export type ProcessValidationError = z.infer<
  typeof ProcessValidationErrorSchema
>;
export type ProcessExportOptions = z.infer<typeof ProcessExportOptionsSchema>;

// Validation functions
export const validateProcessStep = (data: unknown) => {
  return ProcessStepSchema.safeParse(data);
};

export const validateProcessDefinition = (data: unknown) => {
  return ProcessDefinitionSchema.safeParse(data);
};

export const validateProcessExecutionContext = (data: unknown) => {
  return ProcessExecutionContextSchema.safeParse(data);
};

export const validateProcessFormData = (data: unknown) => {
  return ProcessFormDataSchema.safeParse(data);
};

export const validateProcessChecklistItem = (data: unknown) => {
  return ProcessChecklistItemSchema.safeParse(data);
};

export const validateProcessProgressData = (data: unknown) => {
  return ProcessProgressDataSchema.safeParse(data);
};

export const validateProcessTemplate = (data: unknown) => {
  return ProcessTemplateSchema.safeParse(data);
};

export const validateProcessExportOptions = (data: unknown) => {
  return ProcessExportOptionsSchema.safeParse(data);
};
