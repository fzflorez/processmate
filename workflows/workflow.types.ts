/**
 * Workflow Type Definitions
 * Provides type safety for workflow definitions and execution
 */

import type {
  PromptExecutionContext,
} from "../prompts/prompt.types";

/**
 * Workflow step types
 */
export enum WorkflowStepType {
  PROMPT = "prompt",
  CONDITION = "condition",
  PARALLEL = "parallel",
  DELAY = "delay",
  TRANSFORM = "transform",
  VALIDATE = "validate",
  API_CALL = "api_call",
  CUSTOM = "custom",
}

/**
 * Workflow execution status
 */
export enum WorkflowStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
}

/**
 * Base workflow step interface
 */
export interface BaseWorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  description?: string;
  timeout?: number;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Prompt workflow step
 */
export interface PromptWorkflowStep extends BaseWorkflowStep {
  type: WorkflowStepType.PROMPT;
  promptId: string;
  variables?: Record<string, unknown>;
  context?: Partial<PromptExecutionContext>;
}

/**
 * Condition workflow step
 */
export interface ConditionWorkflowStep extends BaseWorkflowStep {
  type: WorkflowStepType.CONDITION;
  condition: string; // JavaScript expression
  trueStep: string;
  falseStep: string;
}

/**
 * Parallel workflow step
 */
export interface ParallelWorkflowStep extends BaseWorkflowStep {
  type: WorkflowStepType.PARALLEL;
  steps: string[]; // Step IDs to execute in parallel
  waitForAll?: boolean; // true = wait for all, false = wait for first
}

/**
 * Delay workflow step
 */
export interface DelayWorkflowStep extends BaseWorkflowStep {
  type: WorkflowStepType.DELAY;
  duration: number; // milliseconds
}

/**
 * Transform workflow step
 */
export interface TransformWorkflowStep extends BaseWorkflowStep {
  type: WorkflowStepType.TRANSFORM;
  transform: string; // JavaScript transform function
  inputPath?: string; // Path to input data
  outputPath?: string; // Path to store output
}

/**
 * Validation workflow step
 */
export interface ValidateWorkflowStep extends BaseWorkflowStep {
  type: WorkflowStepType.VALIDATE;
  validation: string; // JavaScript validation function
  schema?: Record<string, unknown>; // Validation schema
}

/**
 * API call workflow step
 */
export interface APICallWorkflowStep extends BaseWorkflowStep {
  type: WorkflowStepType.API_CALL;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  responsePath?: string; // Path to extract response data
}

/**
 * Custom workflow step
 */
export interface CustomWorkflowStep extends BaseWorkflowStep {
  type: WorkflowStepType.CUSTOM;
  handler: string; // JavaScript handler function
  config?: Record<string, unknown>;
}

/**
 * Union type for all workflow steps
 */
export type WorkflowStep =
  | PromptWorkflowStep
  | ConditionWorkflowStep
  | ParallelWorkflowStep
  | DelayWorkflowStep
  | TransformWorkflowStep
  | ValidateWorkflowStep
  | APICallWorkflowStep
  | CustomWorkflowStep;

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
    maxDelay: number;
  };
}

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  startTime: number;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  variables: Record<string, unknown>;
  status: WorkflowStatus;
  currentStep?: string;
  stepHistory: WorkflowStepExecution[];
  metadata?: Record<string, unknown>;
  duration?: number;
}

/**
 * Workflow step execution result
 */
export interface WorkflowStepExecution {
  stepId: string;
  status: WorkflowStatus;
  startTime: number;
  endTime?: number;
  duration?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  success: boolean;
  status: WorkflowStatus;
  outputs: Record<string, unknown>;
  duration: number;
  stepExecutions: WorkflowStepExecution[];
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Workflow event types
 */
export enum WorkflowEventType {
  STARTED = "started",
  STEP_STARTED = "step_started",
  STEP_COMPLETED = "step_completed",
  STEP_FAILED = "step_failed",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PAUSED = "paused",
  RESUMED = "resumed",
}

/**
 * Workflow event
 */
export interface WorkflowEvent {
  type: WorkflowEventType;
  workflowId: string;
  executionId: string;
  stepId?: string;
  timestamp: number;
  data?: unknown;
  error?: string;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  enableLogging?: boolean;
  enableMetrics?: boolean;
  defaultTimeout?: number;
  maxConcurrentExecutions?: number;
  persistence?: {
    enabled: boolean;
    storage: "memory" | "database" | "file";
    retention: number; // hours
  };
}

/**
 * Workflow handler interface
 */
export interface WorkflowHandler {
  execute(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<unknown>;
  validate?(step: WorkflowStep, input: unknown): boolean;
  transform?(input: unknown, step: TransformWorkflowStep): unknown;
}

/**
 * Workflow registry interface
 */
export interface WorkflowRegistry {
  registerWorkflow(workflow: WorkflowDefinition): void;
  getWorkflow(id: string): WorkflowDefinition | null;
  listWorkflows(): WorkflowDefinition[];
  registerStepHandler(type: WorkflowStepType, handler: WorkflowHandler): void;
  getStepHandler(type: WorkflowStepType): WorkflowHandler | null;
}
