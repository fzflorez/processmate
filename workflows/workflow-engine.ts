/**
 * Workflow Engine
 * Provides workflow execution, management, and orchestration capabilities
 */

import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowStepExecution,
  WorkflowEvent,
  WorkflowConfig,
  WorkflowHandler,
  PromptWorkflowStep,
  ConditionWorkflowStep,
  ParallelWorkflowStep,
  DelayWorkflowStep,
  TransformWorkflowStep,
  ValidateWorkflowStep,
  APICallWorkflowStep,
} from "./workflow.types";
import {
  WorkflowStepType,
  WorkflowStatus,
  WorkflowEventType,
} from "./workflow.types";
import { promptLoader } from "../prompts/prompt-loader";

/**
 * Workflow Engine class
 */
export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private stepHandlers: Map<WorkflowStepType, WorkflowHandler> = new Map();
  private executions: Map<string, WorkflowExecutionContext> = new Map();
  private config: WorkflowConfig;
  private eventListeners: Map<
    WorkflowEventType,
    Array<(event: WorkflowEvent) => void>
  > = new Map();
  private executionQueue: Array<{
    workflowId: string;
    inputs: Record<string, unknown>;
    options: { executionId?: string; timeout?: number };
    priority: number;
    resolve: (result: WorkflowExecutionResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessingQueue = false;

  constructor(config: WorkflowConfig = {}) {
    this.config = {
      enableLogging: true,
      enableMetrics: true,
      defaultTimeout: 300000, // 5 minutes
      maxConcurrentExecutions: 10,
      persistence: {
        enabled: false,
        storage: "memory",
        retention: 24,
      },
      ...config,
    };
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
    this.log("info", `Registered workflow: ${workflow.name} (${workflow.id})`);
  }

  /**
   * Get workflow definition
   */
  getWorkflow(id: string): WorkflowDefinition | null {
    return this.workflows.get(id) || null;
  }

  /**
   * List all registered workflows
   */
  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Register a step handler
   */
  registerStepHandler(type: WorkflowStepType, handler: WorkflowHandler): void {
    this.stepHandlers.set(type, handler);
    this.log("info", `Registered handler for step type: ${type}`);
  }

  /**
   * Get step handler
   */
  getStepHandler(type: WorkflowStepType): WorkflowHandler | null {
    return this.stepHandlers.get(type) || null;
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    timeout: number,
  ): Promise<WorkflowStepExecution> {
    const startTime = Date.now();

    this.emitEvent(WorkflowEventType.STEP_STARTED, {
      workflowId: context.workflowId,
      executionId: context.executionId,
      stepId: step.id,
    });

    try {
      const handler = this.stepHandlers.get(step.type);
      if (!handler) {
        throw new Error(`No handler registered for step type: ${step.type}`);
      }

      // Validate step input if handler provides validation
      if (handler.validate) {
        const isValid = handler.validate(step, context.variables[step.id]);
        if (!isValid) {
          throw new Error(`Step validation failed: ${step.id}`);
        }
      }

      const output = await this.executeStepWithTimeout(
        () => handler.execute(step, context),
        step.timeout || timeout,
      );

      const endTime = Date.now();

      this.emitEvent(WorkflowEventType.STEP_COMPLETED, {
        workflowId: context.workflowId,
        executionId: context.executionId,
        stepId: step.id,
        data: { output },
      });

      return {
        stepId: step.id,
        status: WorkflowStatus.COMPLETED,
        startTime,
        endTime,
        duration: endTime - startTime,
        input: context.variables[step.id],
        output,
        retryCount: 0,
        metadata: step.metadata,
      };
    } catch (error) {
      const endTime = Date.now();

      this.emitEvent(WorkflowEventType.STEP_FAILED, {
        workflowId: context.workflowId,
        executionId: context.executionId,
        stepId: step.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        stepId: step.id,
        status: WorkflowStatus.FAILED,
        startTime,
        endTime,
        duration: endTime - startTime,
        input: context.variables[step.id],
        error: error instanceof Error ? error.message : "Unknown error",
        retryCount: 0,
        metadata: step.metadata,
      };
    }
  }

  /**
   * Execute step with timeout
   */
  private async executeStepWithTimeout<T>(
    executor: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      executor(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Step execution timeout")), timeout);
      }),
    ]);
  }

  /**
   * Cancel workflow execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = WorkflowStatus.CANCELLED;
    this.emitEvent(WorkflowEventType.CANCELLED, {
      workflowId: execution.workflowId,
      executionId,
    });

    this.executions.delete(executionId);
    return true;
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecutionContext | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * List active executions
   */
  getActiveExecutions(): WorkflowExecutionContext[] {
    return Array.from(this.executions.values());
  }

  /**
   * Add event listener
   */
  addEventListener(
    type: WorkflowEventType,
    listener: (event: WorkflowEvent) => void,
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    type: WorkflowEventType,
    listener: (event: WorkflowEvent) => void,
  ): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit workflow event
   */
  private emitEvent(
    type: WorkflowEventType,
    data: Omit<WorkflowEvent, "type" | "timestamp">,
  ): void {
    const event: WorkflowEvent = {
      type,
      workflowId: data.workflowId,
      executionId: data.executionId,
      stepId: data.stepId,
      timestamp: Date.now(),
      data: data.data,
      error: data.error,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          this.log("error", "Event listener error:", error);
        }
      });
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log message
   */
  private log(
    level: "info" | "warn" | "error",
    message: string,
    data?: unknown,
  ): void {
    if (this.config.enableLogging) {
      const timestamp = new Date().toISOString();
      console[level](`[WorkflowEngine] ${timestamp} - ${message}`, data);
    }
  }

  /**
   * Get engine metrics
   */
  getMetrics(): {
    registeredWorkflows: number;
    registeredHandlers: number;
    activeExecutions: number;
    eventListeners: number;
  } {
    return {
      registeredWorkflows: this.workflows.size,
      registeredHandlers: this.stepHandlers.size,
      activeExecutions: this.executions.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce(
        (sum, listeners) => sum + listeners.length,
        0,
      ),
    };
  }

  /**
   * Execute a workflow with priority queuing
   */
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, unknown> = {},
    options: { executionId?: string; timeout?: number; priority?: number } = {},
  ): Promise<WorkflowExecutionResult> {
    const priority = options.priority || 0;

    // Add to execution queue
    return new Promise((resolve, reject) => {
      this.executionQueue.push({
        workflowId,
        inputs,
        options,
        priority,
        resolve,
        reject,
      });

      // Sort queue by priority (higher priority first)
      this.executionQueue.sort((a, b) => b.priority - a.priority);

      // Start processing queue if not already running
      if (!this.isProcessingQueue) {
        this.processExecutionQueue();
      }
    });
  }

  /**
   * Process execution queue with concurrency control
   */
  private async processExecutionQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    while (this.executionQueue.length > 0) {
      const availableSlots =
        this.config.maxConcurrentExecutions! - this.executions.size;

      if (availableSlots <= 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const batch = this.executionQueue.splice(0, availableSlots);

      // Execute batch in parallel
      await Promise.allSettled(
        batch.map(({ workflowId, inputs, options, resolve, reject }) =>
          this.executeWorkflowInternal(workflowId, inputs, options)
            .then(resolve)
            .catch(reject),
        ),
      );
    }

    this.isProcessingQueue = false;
  }

  /**
   * Internal workflow execution method
   */
  private async executeWorkflowInternal(
    workflowId: string,
    inputs: Record<string, unknown> = {},
    options: { executionId?: string; timeout?: number } = {},
  ): Promise<WorkflowExecutionResult> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      return {
        success: false,
        status: WorkflowStatus.FAILED,
        outputs: {},
        duration: 0,
        stepExecutions: [],
        error: `Workflow not found: ${workflowId}`,
      };
    }

    const executionId = options.executionId || this.generateExecutionId();
    const timeout =
      options.timeout || workflow.timeout || this.config.defaultTimeout!;

    // Check concurrent execution limit
    if (this.executions.size >= this.config.maxConcurrentExecutions!) {
      return {
        success: false,
        status: WorkflowStatus.FAILED,
        outputs: {},
        duration: 0,
        stepExecutions: [],
        error: `Maximum concurrent executions (${this.config.maxConcurrentExecutions}) reached`,
      };
    }

    const startTime = Date.now();

    const context: WorkflowExecutionContext = {
      workflowId,
      executionId,
      startTime,
      inputs,
      outputs: {},
      variables: { ...inputs },
      status: WorkflowStatus.RUNNING,
      stepHistory: [],
      metadata: {},
    };

    this.executions.set(executionId, context);
    this.emitEvent(WorkflowEventType.STARTED, { workflowId, executionId });

    try {
      const result = await this.executeSteps(workflow.steps, context, timeout);

      context.status = result.success
        ? WorkflowStatus.COMPLETED
        : WorkflowStatus.FAILED;
      context.outputs = result.outputs;
      context.duration = Date.now() - startTime;

      this.emitEvent(
        result.success ? WorkflowEventType.COMPLETED : WorkflowEventType.FAILED,
        { workflowId, executionId, data: result },
      );

      return result;
    } catch (error) {
      context.status = WorkflowStatus.FAILED;
      context.duration = Date.now() - startTime;

      this.emitEvent(WorkflowEventType.FAILED, {
        workflowId,
        executionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        status: WorkflowStatus.FAILED,
        outputs: context.outputs,
        duration: context.duration,
        stepExecutions: context.stepHistory,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      this.executions.delete(executionId);
    }
  }

  /**
   * Execute workflow steps with enhanced orchestration
   */
  private async executeSteps(
    steps: WorkflowStep[],
    context: WorkflowExecutionContext,
    timeout: number,
  ): Promise<WorkflowExecutionResult> {
    const stepResults: WorkflowStepExecution[] = [];

    for (const step of steps) {
      context.currentStep = step.id;

      // Check if step should be skipped based on conditions
      if (await this.shouldSkipStep(step, context)) {
        this.log("info", `Skipping step: ${step.id} (condition not met)`);
        continue;
      }

      const stepResult = await this.executeStep(step, context, timeout);
      stepResults.push(stepResult);

      if (stepResult.status === WorkflowStatus.FAILED) {
        // Check if step has retry policy
        if (await this.shouldRetryStep(step, stepResult)) {
          this.log("info", `Retrying step: ${step.id}`);
          const retryResult = await this.retryStep(
            step,
            context,
            timeout,
            stepResult.retryCount + 1,
          );
          stepResults[stepResults.length - 1] = retryResult;
          context.stepHistory[context.stepHistory.length - 1] = retryResult;

          if (retryResult.status === WorkflowStatus.FAILED) {
            return this.createFailedResult(
              context,
              stepResults,
              retryResult.error,
            );
          }
        } else {
          return this.createFailedResult(
            context,
            stepResults,
            stepResult.error,
          );
        }
      }

      // Update context with step outputs
      if (stepResult.output !== undefined) {
        context.outputs[step.id] = stepResult.output;
        context.variables = {
          ...context.variables,
          [step.id]: stepResult.output,
        };
      }
    }

    return {
      success: true,
      status: WorkflowStatus.COMPLETED,
      outputs: context.outputs,
      duration: Date.now() - context.startTime,
      stepExecutions: stepResults,
    };
  }

  /**
   * Check if step should be skipped
   */
  private async shouldSkipStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<boolean> {
    if (!step.metadata?.skipCondition) return false;

    try {
      const skipFunction = new Function(
        "context",
        `return ${step.metadata.skipCondition}`,
      );
      return Boolean(skipFunction(context));
    } catch (error) {
      this.log(
        "warn",
        `Error evaluating skip condition for step ${step.id}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Check if step should be retried
   */
  private async shouldRetryStep(
    step: WorkflowStep,
    stepResult: WorkflowStepExecution,
  ): Promise<boolean> {
    const maxRetries = step.retryCount || 0;
    return stepResult.retryCount < maxRetries;
  }

  /**
   * Retry a failed step
   */
  private async retryStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    timeout: number,
    retryCount: number,
  ): Promise<WorkflowStepExecution> {
    const startTime = Date.now();

    this.emitEvent(WorkflowEventType.STEP_STARTED, {
      workflowId: context.workflowId,
      executionId: context.executionId,
      stepId: step.id,
    });

    try {
      const handler = this.stepHandlers.get(step.type);
      if (!handler) {
        throw new Error(`No handler registered for step type: ${step.type}`);
      }

      const output = await this.executeStepWithTimeout(
        () => handler.execute(step, context),
        step.timeout || timeout,
      );

      const endTime = Date.now();

      this.emitEvent(WorkflowEventType.STEP_COMPLETED, {
        workflowId: context.workflowId,
        executionId: context.executionId,
        stepId: step.id,
        data: { output },
      });

      return {
        stepId: step.id,
        status: WorkflowStatus.COMPLETED,
        startTime,
        endTime,
        duration: endTime - startTime,
        input: context.variables[step.id],
        output,
        retryCount,
        metadata: step.metadata,
      };
    } catch (error) {
      const endTime = Date.now();

      this.emitEvent(WorkflowEventType.STEP_FAILED, {
        workflowId: context.workflowId,
        executionId: context.executionId,
        stepId: step.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        stepId: step.id,
        status: WorkflowStatus.FAILED,
        startTime,
        endTime,
        duration: endTime - startTime,
        input: context.variables[step.id],
        error: error instanceof Error ? error.message : "Unknown error",
        retryCount,
        metadata: step.metadata,
      };
    }
  }

  /**
   * Create failed result
   */
  private createFailedResult(
    context: WorkflowExecutionContext,
    stepResults: WorkflowStepExecution[],
    error: string | undefined,
  ): WorkflowExecutionResult {
    return {
      success: false,
      status: WorkflowStatus.FAILED,
      outputs: context.outputs,
      duration: Date.now() - context.startTime,
      stepExecutions: stepResults,
      error,
    };
  }
}

/**
 * Default step handlers
 */
class DefaultStepHandlers implements WorkflowHandler {
  async execute(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<unknown> {
    switch (step.type) {
      case WorkflowStepType.PROMPT:
        return this.handlePromptStep(step as PromptWorkflowStep, context);
      case WorkflowStepType.CONDITION:
        return this.handleConditionStep(step as ConditionWorkflowStep, context);
      case WorkflowStepType.PARALLEL:
        return this.handleParallelStep(step as ParallelWorkflowStep);
      case WorkflowStepType.DELAY:
        return this.handleDelayStep(step as DelayWorkflowStep);
      case WorkflowStepType.TRANSFORM:
        return this.handleTransformStep(step as TransformWorkflowStep, context);
      case WorkflowStepType.VALIDATE:
        return this.handleValidateStep(step as ValidateWorkflowStep, context);
      case WorkflowStepType.API_CALL:
        return this.handleAPICallStep(step as APICallWorkflowStep);
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  validate?(step: WorkflowStep, input: unknown): boolean {
    if (!step.metadata?.validation) return true;
    try {
      const validationFunction = new Function(
        "input",
        `return ${step.metadata.validation}`,
      );
      return Boolean(validationFunction(input));
    } catch {
      return false;
    }
  }

  private async handleConditionStep(
    step: ConditionWorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<unknown> {
    const condition = new Function("context", `return ${step.condition}`);
    return condition(context);
  }

  private async handleDelayStep(step: DelayWorkflowStep): Promise<unknown> {
    await new Promise((resolve) => setTimeout(resolve, step.duration));
    return `Delayed for ${step.duration}ms`;
  }

  private async handleTransformStep(
    step: TransformWorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<unknown> {
    const transformFunction = new Function("input", `return ${step.transform}`);
    const input = step.inputPath
      ? this.getNestedValue(context.variables, step.inputPath)
      : context.variables;
    return transformFunction(input);
  }

  private async handleValidateStep(
    step: ValidateWorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<unknown> {
    const input = context.variables;
    const validationFunction = new Function(
      "input",
      `return ${step.validation}`,
    );
    const isValid = validationFunction(input);
    if (!isValid) {
      throw new Error(`Validation failed for step ${step.id}`);
    }
    return input;
  }

  private async handlePromptStep(
    step: PromptWorkflowStep,
    context: WorkflowExecutionContext,
  ): Promise<string | undefined> {
    const variables = { ...context.variables, ...step.variables };
    const result = await promptLoader.loadAndExecute(step.promptId, variables, {
      userId: context.metadata?.userId,
      sessionId: context.executionId,
      requestId: `${context.executionId}_${step.id}`,
      model: (context.metadata?.model as {
        provider: "openai" | "anthropic" | "local";
        model: string;
      }) || { provider: "openai" as const, model: "gpt-4" },
    });

    return result.success ? result.content : undefined;
  }

  private async handleParallelStep(
    step: ParallelWorkflowStep,
  ): Promise<unknown> {
    // For parallel execution, we need to execute the steps by their IDs
    // This is a simplified implementation - in practice, you'd need to resolve step IDs to actual steps
    const promises = step.steps.map(async (stepId) => {
      // This would need to be implemented to get the actual step and execute it
      // For now, return a placeholder
      return { stepId, result: `Parallel result for ${stepId}` };
    });

    if (step.waitForAll) {
      const results = await Promise.all(promises);
      return results;
    } else {
      return await Promise.race(promises);
    }
  }

  private async handleAPICallStep(step: APICallWorkflowStep): Promise<unknown> {
    const response = await fetch(step.endpoint, {
      method: step.method,
      headers: step.headers,
      body: JSON.stringify(step.body || {}),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return step.responsePath
      ? this.getNestedValue(data, step.responsePath)
      : data;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce((current: unknown, key: string) => {
      if (current && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}
export const workflowEngine = new WorkflowEngine();

// Register default handlers
workflowEngine.registerStepHandler(
  WorkflowStepType.PROMPT,
  new DefaultStepHandlers(),
);
workflowEngine.registerStepHandler(
  WorkflowStepType.CONDITION,
  new DefaultStepHandlers(),
);
workflowEngine.registerStepHandler(
  WorkflowStepType.PARALLEL,
  new DefaultStepHandlers(),
);
workflowEngine.registerStepHandler(
  WorkflowStepType.DELAY,
  new DefaultStepHandlers(),
);
workflowEngine.registerStepHandler(
  WorkflowStepType.TRANSFORM,
  new DefaultStepHandlers(),
);
workflowEngine.registerStepHandler(
  WorkflowStepType.VALIDATE,
  new DefaultStepHandlers(),
);
workflowEngine.registerStepHandler(
  WorkflowStepType.API_CALL,
  new DefaultStepHandlers(),
);
