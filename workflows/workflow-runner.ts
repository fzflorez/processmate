/**
 * Workflow Runner
 * Provides dynamic workflow execution capabilities with runtime workflow creation
 */

import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecutionResult,
  WorkflowExecutionContext,
  WorkflowConfig,
  PromptWorkflowStep,
  ConditionWorkflowStep,
  ParallelWorkflowStep,
  DelayWorkflowStep,
  TransformWorkflowStep,
  ValidateWorkflowStep,
  APICallWorkflowStep,
  CustomWorkflowStep,
} from './workflow.types';
import {
  WorkflowStepType,
  WorkflowStatus,
  WorkflowEventType,
} from './workflow.types';
import { workflowEngine } from './workflow-engine';

/**
 * Workflow runtime configuration
 */
export interface WorkflowRuntimeConfig {
  timeout?: number;
  priority?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
    maxDelay: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Dynamic workflow builder
 */
export class WorkflowBuilder {
  private workflow: Partial<WorkflowDefinition> = {
    id: '',
    name: '',
    description: '',
    version: '1.0.0',
    steps: [],
    inputs: {},
    outputs: {},
    metadata: {},
  };

  constructor(id: string, name: string, description?: string) {
    this.workflow.id = id;
    this.workflow.name = name;
    if (description) {
      this.workflow.description = description;
    }
  }

  /**
   * Set workflow version
   */
  version(version: string): WorkflowBuilder {
    this.workflow.version = version;
    return this;
  }

  /**
   * Add inputs to workflow
   */
  inputs(inputs: Record<string, unknown>): WorkflowBuilder {
    this.workflow.inputs = { ...this.workflow.inputs, ...inputs };
    return this;
  }

  /**
   * Add expected outputs
   */
  outputs(outputs: Record<string, unknown>): WorkflowBuilder {
    this.workflow.outputs = { ...this.workflow.outputs, ...outputs };
    return this;
  }

  /**
   * Add metadata
   */
  metadata(metadata: Record<string, unknown>): WorkflowBuilder {
    this.workflow.metadata = { ...this.workflow.metadata, ...metadata };
    return this;
  }

  /**
   * Add a prompt step
   */
  addPromptStep(
    id: string,
    name: string,
    promptId: string,
    options: {
      description?: string;
      variables?: Record<string, unknown>;
      timeout?: number;
      retryCount?: number;
      validationSchema?: string;
      skipCondition?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): WorkflowBuilder {
    const step: PromptWorkflowStep = {
      id,
      name,
      type: WorkflowStepType.PROMPT,
      description: options.description,
      promptId,
      variables: options.variables,
      timeout: options.timeout,
      retryCount: options.retryCount,
      metadata: {
        ...options.metadata,
        validationSchema: options.validationSchema,
        skipCondition: options.skipCondition,
      },
    };

    this.workflow.steps!.push(step);
    return this;
  }

  /**
   * Add a condition step
   */
  addConditionStep(
    id: string,
    name: string,
    condition: string,
    trueStep: string,
    falseStep: string,
    options: {
      description?: string;
      timeout?: number;
      retryCount?: number;
      skipCondition?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): WorkflowBuilder {
    const step: ConditionWorkflowStep = {
      id,
      name,
      type: WorkflowStepType.CONDITION,
      description: options.description,
      condition,
      trueStep,
      falseStep,
      timeout: options.timeout,
      retryCount: options.retryCount,
      metadata: {
        ...options.metadata,
        skipCondition: options.skipCondition,
      },
    };

    this.workflow.steps!.push(step);
    return this;
  }

  /**
   * Add a parallel step
   */
  addParallelStep(
    id: string,
    name: string,
    steps: string[],
    options: {
      description?: string;
      waitForAll?: boolean;
      timeout?: number;
      retryCount?: number;
      skipCondition?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): WorkflowBuilder {
    const step: ParallelWorkflowStep = {
      id,
      name,
      type: WorkflowStepType.PARALLEL,
      description: options.description,
      steps,
      waitForAll: options.waitForAll ?? true,
      timeout: options.timeout,
      retryCount: options.retryCount,
      metadata: {
        ...options.metadata,
        skipCondition: options.skipCondition,
      },
    };

    this.workflow.steps!.push(step);
    return this;
  }

  /**
   * Add a delay step
   */
  addDelayStep(
    id: string,
    name: string,
    duration: number,
    options: {
      description?: string;
      timeout?: number;
      retryCount?: number;
      skipCondition?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): WorkflowBuilder {
    const step: DelayWorkflowStep = {
      id,
      name,
      type: WorkflowStepType.DELAY,
      description: options.description,
      duration,
      timeout: options.timeout,
      retryCount: options.retryCount,
      metadata: {
        ...options.metadata,
        skipCondition: options.skipCondition,
      },
    };

    this.workflow.steps!.push(step);
    return this;
  }

  /**
   * Add a transform step
   */
  addTransformStep(
    id: string,
    name: string,
    transform: string,
    options: {
      description?: string;
      inputPath?: string;
      outputPath?: string;
      timeout?: number;
      retryCount?: number;
      skipCondition?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): WorkflowBuilder {
    const step: TransformWorkflowStep = {
      id,
      name,
      type: WorkflowStepType.TRANSFORM,
      description: options.description,
      transform,
      inputPath: options.inputPath,
      outputPath: options.outputPath,
      timeout: options.timeout,
      retryCount: options.retryCount,
      metadata: {
        ...options.metadata,
        skipCondition: options.skipCondition,
      },
    };

    this.workflow.steps!.push(step);
    return this;
  }

  /**
   * Add a validation step
   */
  addValidationStep(
    id: string,
    name: string,
    validation: string,
    options: {
      description?: string;
      schema?: Record<string, unknown>;
      timeout?: number;
      retryCount?: number;
      skipCondition?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): WorkflowBuilder {
    const step: ValidateWorkflowStep = {
      id,
      name,
      type: WorkflowStepType.VALIDATE,
      description: options.description,
      validation,
      schema: options.schema,
      timeout: options.timeout,
      retryCount: options.retryCount,
      metadata: {
        ...options.metadata,
        skipCondition: options.skipCondition,
      },
    };

    this.workflow.steps!.push(step);
    return this;
  }

  /**
   * Add an API call step
   */
  addAPICallStep(
    id: string,
    name: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    options: {
      description?: string;
      headers?: Record<string, string>;
      body?: Record<string, unknown>;
      responsePath?: string;
      timeout?: number;
      retryCount?: number;
      skipCondition?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): WorkflowBuilder {
    const step: APICallWorkflowStep = {
      id,
      name,
      type: WorkflowStepType.API_CALL,
      description: options.description,
      endpoint,
      method,
      headers: options.headers,
      body: options.body,
      responsePath: options.responsePath,
      timeout: options.timeout,
      retryCount: options.retryCount,
      metadata: {
        ...options.metadata,
        skipCondition: options.skipCondition,
      },
    };

    this.workflow.steps!.push(step);
    return this;
  }

  /**
   * Add a custom step
   */
  addCustomStep(
    id: string,
    name: string,
    handler: string,
    options: {
      description?: string;
      config?: Record<string, unknown>;
      timeout?: number;
      retryCount?: number;
      skipCondition?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): WorkflowBuilder {
    const step: CustomWorkflowStep = {
      id,
      name,
      type: WorkflowStepType.CUSTOM,
      description: options.description,
      handler,
      config: options.config,
      timeout: options.timeout,
      retryCount: options.retryCount,
      metadata: {
        ...options.metadata,
        skipCondition: options.skipCondition,
      },
    };

    this.workflow.steps!.push(step);
    return this;
  }

  /**
   * Build the workflow definition
   */
  build(): WorkflowDefinition {
    if (!this.workflow.id || !this.workflow.name) {
      throw new Error('Workflow ID and name are required');
    }

    return this.workflow as WorkflowDefinition;
  }
}

/**
 * Workflow Runner class
 */
export class WorkflowRunner {
  private engine = workflowEngine;
  private dynamicWorkflows: Map<string, WorkflowDefinition> = new Map();

  /**
   * Create a new workflow builder
   */
  createBuilder(id: string, name: string, description?: string): WorkflowBuilder {
    return new WorkflowBuilder(id, name, description);
  }

  /**
   * Register a dynamic workflow
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.dynamicWorkflows.set(workflow.id, workflow);
    this.engine.registerWorkflow(workflow);
  }

  /**
   * Create and register a workflow from builder
   */
  createWorkflow(builder: WorkflowBuilder): WorkflowDefinition {
    const workflow = builder.build();
    this.registerWorkflow(workflow);
    return workflow;
  }

  /**
   * Execute a workflow dynamically
   */
  async executeWorkflow(
    workflowOrId: WorkflowDefinition | string,
    inputs: Record<string, unknown> = {},
    config: WorkflowRuntimeConfig = {}
  ): Promise<WorkflowExecutionResult> {
    let workflow: WorkflowDefinition;

    if (typeof workflowOrId === 'string') {
      workflow = this.dynamicWorkflows.get(workflowOrId) || this.engine.getWorkflow(workflowOrId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowOrId}`);
      }
    } else {
      workflow = workflowOrId;
      // Register temporary workflow if not already registered
      if (!this.dynamicWorkflows.has(workflow.id) && !this.engine.getWorkflow(workflow.id)) {
        this.engine.registerWorkflow(workflow);
      }
    }

    // Apply runtime configuration
    if (config.timeout) {
      workflow.timeout = config.timeout;
    }

    if (config.metadata) {
      workflow.metadata = { ...workflow.metadata, ...config.metadata };
    }

    return this.engine.executeWorkflow(workflow.id, inputs, {
      timeout: config.timeout,
      priority: config.priority,
    });
  }

  /**
   * Execute a workflow with retry policy
   */
  async executeWorkflowWithRetry(
    workflowOrId: WorkflowDefinition | string,
    inputs: Record<string, unknown> = {},
    config: WorkflowRuntimeConfig = {}
  ): Promise<WorkflowExecutionResult> {
    const maxAttempts = config.retryPolicy?.maxAttempts || 1;
    const backoffMultiplier = config.retryPolicy?.backoffMultiplier || 2;
    const maxDelay = config.retryPolicy?.maxDelay || 30000;

    let lastResult: WorkflowExecutionResult | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.executeWorkflow(workflowOrId, inputs, config);
        
        if (result.success) {
          return result;
        }

        lastResult = result;

        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastResult = {
          success: false,
          status: WorkflowStatus.FAILED,
          outputs: {},
          duration: 0,
          stepExecutions: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return lastResult!;
  }

  /**
   * Execute multiple workflows in parallel
   */
  async executeWorkflowsParallel(
    executions: Array<{
      workflowOrId: WorkflowDefinition | string;
      inputs?: Record<string, unknown>;
      config?: WorkflowRuntimeConfig;
    }>
  ): Promise<WorkflowExecutionResult[]> {
    const promises = executions.map(({ workflowOrId, inputs = {}, config = {} }) =>
      this.executeWorkflow(workflowOrId, inputs, config)
    );

    return Promise.all(promises);
  }

  /**
   * Execute workflows with race condition (first to complete wins)
   */
  async executeWorkflowsRace(
    executions: Array<{
      workflowOrId: WorkflowDefinition | string;
      inputs?: Record<string, unknown>;
      config?: WorkflowRuntimeConfig;
    }>
  ): Promise<WorkflowExecutionResult> {
    const promises = executions.map(({ workflowOrId, inputs = {}, config = {} }) =>
      this.executeWorkflow(workflowOrId, inputs, config)
    );

    return Promise.race(promises);
  }

  /**
   * Create a workflow from template
   */
  createFromTemplate(
    templateId: string,
    parameters: Record<string, unknown>,
    customId?: string
  ): WorkflowDefinition {
    // This would integrate with a template system
    // For now, return a basic template
    const baseTemplate = {
      'simple-prompt': {
        id: customId || `template-${templateId}-${Date.now()}`,
        name: `Simple Prompt Workflow (${templateId})`,
        description: 'A simple workflow that executes a single prompt',
        version: '1.0.0',
        steps: [
          {
            id: 'prompt-step',
            name: 'Execute Prompt',
            type: WorkflowStepType.PROMPT,
            promptId: parameters.promptId as string || 'default',
            variables: parameters.variables as Record<string, unknown> || {},
          },
        ],
      },
      'api-chain': {
        id: customId || `template-${templateId}-${Date.now()}`,
        name: `API Chain Workflow (${templateId})`,
        description: 'A workflow that chains multiple API calls',
        version: '1.0.0',
        steps: [
          {
            id: 'first-api',
            name: 'First API Call',
            type: WorkflowStepType.API_CALL,
            endpoint: parameters.firstEndpoint as string || '',
            method: 'GET' as const,
          },
          {
            id: 'second-api',
            name: 'Second API Call',
            type: WorkflowStepType.API_CALL,
            endpoint: parameters.secondEndpoint as string || '',
            method: 'POST' as const,
            body: parameters.body as Record<string, unknown> || {},
          },
        ],
      },
    };

    const template = baseTemplate[templateId as keyof typeof baseTemplate];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return template as WorkflowDefinition;
  }

  /**
   * Get dynamic workflow
   */
  getWorkflow(id: string): WorkflowDefinition | null {
    return this.dynamicWorkflows.get(id) || null;
  }

  /**
   * List all dynamic workflows
   */
  listDynamicWorkflows(): WorkflowDefinition[] {
    return Array.from(this.dynamicWorkflows.values());
  }

  /**
   * Remove dynamic workflow
   */
  removeWorkflow(id: string): boolean {
    return this.dynamicWorkflows.delete(id);
  }

  /**
   * Clear all dynamic workflows
   */
  clearDynamicWorkflows(): void {
    this.dynamicWorkflows.clear();
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecutionContext | null {
    return this.engine.getExecutionStatus(executionId);
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): boolean {
    return this.engine.cancelExecution(executionId);
  }

  /**
   * Get engine metrics
   */
  getMetrics() {
    return this.engine.getMetrics();
  }
}

/**
 * Default workflow runner instance
 */
export const workflowRunner = new WorkflowRunner();
