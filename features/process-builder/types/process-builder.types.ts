/**
 * Process Builder Types
 * TypeScript definitions for process building and management
 */

import type { WorkflowStatus } from "../../../workflows/workflow.types";

/**
 * Process step types for user-friendly interface
 */
export enum ProcessStepType {
  INPUT = "input",
  TASK = "task",
  DECISION = "decision",
  APPROVAL = "approval",
  NOTIFICATION = "notification",
  DELAY = "delay",
  INTEGRATION = "integration",
  VALIDATION = "validation",
}

/**
 * Process step status
 */
export enum ProcessStepStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SKIPPED = "skipped",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * Process step priority
 */
export enum ProcessStepPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Process builder step interface
 */
export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  type: ProcessStepType;
  status: ProcessStepStatus;
  priority: ProcessStepPriority;
  estimatedDuration?: number; // in minutes
  assignee?: string;
  dependencies: string[]; // Step IDs that must complete first
  inputs: ProcessStepInput[];
  outputs: ProcessStepOutput[];
  metadata: {
    category?: string;
    tags?: string[];
    color?: string;
    icon?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Process step input definition
 */
export interface ProcessStepInput {
  id: string;
  name: string;
  type:
    | "text"
    | "number"
    | "date"
    | "select"
    | "multiselect"
    | "file"
    | "boolean";
  required: boolean;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  defaultValue?: unknown;
}

/**
 * Process step output definition
 */
export interface ProcessStepOutput {
  id: string;
  name: string;
  type: string;
  description?: string;
}

/**
 * Process definition
 */
export interface ProcessDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: ProcessStep[];
  startStepId: string;
  metadata: {
    version: string;
    author: string;
    tags: string[];
    estimatedTotalDuration?: number; // in minutes
    complexity: "simple" | "medium" | "complex";
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Process execution context
 */
export interface ProcessExecutionContext {
  processId: string;
  executionId: string;
  processDefinition: ProcessDefinition;
  currentStepId?: string;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  variables: Record<string, unknown>;
  stepExecutions: ProcessStepExecution[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  metadata: Record<string, unknown>;
}

/**
 * Process step execution
 */
export interface ProcessStepExecution {
  stepId: string;
  status: ProcessStepStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  assignee?: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  notes?: string;
  error?: string;
  retryCount: number;
}

/**
 * Process builder state
 */
export interface ProcessBuilderState {
  currentStep: "definition" | "steps" | "connections" | "review" | "execution";
  processDefinition: ProcessDefinition | null;
  selectedStepId: string | null;
  isExecuting: boolean;
  executionContext: ProcessExecutionContext | null;
  error: string | null;
  progress: number;
}

/**
 * Process builder actions
 */
export interface ProcessBuilderActions {
  setProcessDefinition: (definition: ProcessDefinition) => void;
  addStep: (step: Omit<ProcessStep, "id" | "createdAt" | "updatedAt">) => void;
  updateStep: (stepId: string, updates: Partial<ProcessStep>) => void;
  deleteStep: (stepId: string) => void;
  connectSteps: (fromStepId: string, toStepId: string) => void;
  disconnectSteps: (fromStepId: string, toStepId: string) => void;
  executeProcess: (inputs: Record<string, unknown>) => Promise<void>;
  pauseExecution: () => void;
  resumeExecution: () => void;
  cancelExecution: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Process builder context
 */
export interface ProcessBuilderContext {
  state: ProcessBuilderState;
  actions: ProcessBuilderActions;
}

/**
 * Process form data
 */
export interface ProcessFormData {
  name: string;
  description: string;
  category: string;
  estimatedDuration?: number;
  complexity: "simple" | "medium" | "complex";
  tags: string[];
}

/**
 * Process checklist item
 */
export interface ProcessChecklistItem {
  id: string;
  stepId: string;
  stepName: string;
  description: string;
  completed: boolean;
  required: boolean;
  notes?: string;
  dueDate?: Date;
  assignee?: string;
  priority: ProcessStepPriority;
}

/**
 * Process progress data
 */
export interface ProcessProgressData {
  processId: string;
  processName: string;
  totalSteps: number;
  completedSteps: number;
  currentStepName?: string;
  status: WorkflowStatus;
  startTime: Date;
  estimatedCompletion?: Date;
  progressPercentage: number;
  milestones: {
    name: string;
    completed: boolean;
    completedAt?: Date;
  }[];
}

/**
 * Process template
 */
export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<ProcessStep, "id" | "createdAt" | "updatedAt">[];
  metadata: {
    author: string;
    version: string;
    tags: string[];
    industry?: string;
    department?: string;
  };
  isPublic: boolean;
  usageCount: number;
  rating: number;
  createdAt: Date;
}

/**
 * Process validation error
 */
export interface ProcessValidationError {
  field: string;
  message: string;
  code: string;
  stepId?: string;
}

/**
 * Process export options
 */
export interface ProcessExportOptions {
  format: "json" | "yaml" | "bpmn" | "markdown" | "pdf";
  includeMetadata: boolean;
  includeExecutionHistory: boolean;
  template?: string;
}

// Utility types
export type ProcessStepTypeString = keyof typeof ProcessStepType;
export type ProcessStepStatusString = keyof typeof ProcessStepStatus;
export type ProcessStepPriorityString = keyof typeof ProcessStepPriority;
