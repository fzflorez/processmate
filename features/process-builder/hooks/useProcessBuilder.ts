/**
 * Process Builder Hook
 * Manages process building, execution, and progress tracking
 */

import { useState, useCallback, useRef } from 'react';
import type {
  ProcessBuilderState,
  ProcessBuilderActions,
  ProcessDefinition,
  ProcessStep,
  ProcessExecutionContext,
  ProcessStepExecution,
  ProcessFormData,
  ProcessChecklistItem,
  ProcessProgressData,
} from '../types';
import {
  validateProcessDefinition,
  validateProcessFormData,
  validateProcessChecklistItem,
  validateProcessProgressData,
} from '../schemas';

// Simple UUID generator
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// AI Service for converting user descriptions to process steps
class ProcessAIService {
  async convertDescriptionToSteps(description: string): Promise<Omit<ProcessStep, 'id' | 'createdAt' | 'updatedAt'>[]> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple keyword-based step extraction (in real implementation, use AI)
    const keywords = description.toLowerCase().split(' ');
    const steps: Omit<ProcessStep, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    if (keywords.includes('input') || keywords.includes('start') || keywords.includes('begin')) {
      steps.push({
        name: 'Data Input',
        description: 'Collect initial data and requirements',
        type: 'input',
        status: 'pending',
        priority: 'high',
        dependencies: [],
        inputs: [
          {
            id: 'data_input',
            name: 'Initial Data',
            type: 'text',
            required: true,
            description: 'Enter the initial data or requirements',
          },
        ],
        outputs: [
          {
            id: 'validated_data',
            name: 'Validated Data',
            type: 'object',
            description: 'Processed and validated input data',
          },
        ],
        metadata: {
          category: 'setup',
          tags: ['input', 'validation'],
          color: '#3B82F6',
          icon: 'input',
        },
      });
    }

    if (keywords.includes('process') || keywords.includes('task') || keywords.includes('work')) {
      steps.push({
        name: 'Main Processing',
        description: 'Execute the main process logic',
        type: 'task',
        status: 'pending',
        priority: 'high',
        dependencies: steps.length > 0 ? [steps[steps.length - 1].name as string] : [],
        inputs: [
          {
            id: 'process_input',
            name: 'Process Data',
            type: 'text',
            required: true,
            description: 'Data to be processed',
          },
        ],
        outputs: [
          {
            id: 'process_result',
            name: 'Process Result',
            type: 'object',
            description: 'Result of the main processing',
          },
        ],
        metadata: {
          category: 'core',
          tags: ['processing', 'main'],
          color: '#10B981',
          icon: 'cog',
        },
      });
    }

    if (keywords.includes('review') || keywords.includes('check') || keywords.includes('validate')) {
      steps.push({
        name: 'Quality Review',
        description: 'Review and validate the results',
        type: 'validation',
        status: 'pending',
        priority: 'medium',
        dependencies: steps.length > 0 ? [steps[steps.length - 1].name as string] : [],
        inputs: [
          {
            id: 'review_input',
            name: 'Results for Review',
            type: 'object',
            required: true,
            description: 'Results to be reviewed and validated',
          },
        ],
        outputs: [
          {
            id: 'review_result',
            name: 'Review Outcome',
            type: 'object',
            description: 'Outcome of the quality review',
          },
        ],
        metadata: {
          category: 'quality',
          tags: ['review', 'validation', 'quality'],
          color: '#F59E0B',
          icon: 'check',
        },
      });
    }

    if (keywords.includes('approve') || keywords.includes('sign') || keywords.includes('authorize')) {
      steps.push({
        name: 'Approval',
        description: 'Get approval for the process results',
        type: 'approval',
        status: 'pending',
        priority: 'medium',
        dependencies: steps.length > 0 ? [steps[steps.length - 1].name as string] : [],
        inputs: [
          {
            id: 'approval_input',
            name: 'Items for Approval',
            type: 'object',
            required: true,
            description: 'Items requiring approval',
          },
        ],
        outputs: [
          {
            id: 'approval_result',
            name: 'Approval Decision',
            type: 'boolean',
            description: 'Final approval decision',
          },
        ],
        metadata: {
          category: 'approval',
          tags: ['approval', 'decision'],
          color: '#8B5CF6',
          icon: 'check-circle',
        },
      });
    }

    if (steps.length === 0) {
      // Default step if no keywords matched
      steps.push({
        name: 'General Task',
        description: 'Execute the described process',
        type: 'task',
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        inputs: [
          {
            id: 'task_input',
            name: 'Task Input',
            type: 'text',
            required: true,
            description: 'Input required for the task',
          },
        ],
        outputs: [
          {
            id: 'task_output',
            name: 'Task Result',
            type: 'object',
            description: 'Result of the task execution',
          },
        ],
        metadata: {
          category: 'general',
          tags: ['task', 'general'],
          color: '#6B7280',
          icon: 'play',
        },
      });
    }

    return steps;
  }

  async optimizeProcessSteps(steps: ProcessStep[]): Promise<ProcessStep[]> {
    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 1000));

    return steps.map(step => ({
      ...step,
      estimatedDuration: step.estimatedDuration || Math.floor(Math.random() * 60) + 15, // 15-75 minutes
    }));
  }
}

// Persistence service for process data
class ProcessPersistenceService {
  private storageKey = 'processmate_processes';

  async saveProcess(process: ProcessDefinition): Promise<void> {
    try {
      const existing = await this.getProcesses();
      existing[process.id] = process;
      localStorage.setItem(this.storageKey, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to save process:', error);
    }
  }

  async getProcess(id: string): Promise<ProcessDefinition | null> {
    try {
      const processes = await this.getProcesses();
      return processes[id] || null;
    } catch (error) {
      console.error('Failed to get process:', error);
      return null;
    }
  }

  async getProcesses(): Promise<Record<string, ProcessDefinition>> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get processes:', error);
      return {};
    }
  }

  async deleteProcess(id: string): Promise<void> {
    try {
      const processes = await this.getProcesses();
      delete processes[id];
      localStorage.setItem(this.storageKey, JSON.stringify(processes));
    } catch (error) {
      console.error('Failed to delete process:', error);
    }
  }

  async saveExecution(context: ProcessExecutionContext): Promise<void> {
    try {
      const executions = await this.getExecutions();
      executions[context.executionId] = context;
      localStorage.setItem(`${this.storageKey}_executions`, JSON.stringify(executions));
    } catch (error) {
      console.error('Failed to save execution:', error);
    }
  }

  async getExecutions(): Promise<Record<string, ProcessExecutionContext>> {
    try {
      const stored = localStorage.getItem(`${this.storageKey}_executions`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get executions:', error);
      return {};
    }
  }
}

interface UseProcessBuilderOptions {
  userId: string;
  aiService?: ProcessAIService;
  persistenceService?: ProcessPersistenceService;
}

export function useProcessBuilder({
  userId,
  aiService = new ProcessAIService(),
  persistenceService = new ProcessPersistenceService(),
}: UseProcessBuilderOptions) {
  // State management
  const [state, setState] = useState<ProcessBuilderState>({
    currentStep: 'definition',
    processDefinition: null,
    selectedStepId: null,
    isExecuting: false,
    executionContext: null,
    error: null,
    progress: 0,
  });

  // Refs for managing async operations
  const abortControllerRef = useRef<AbortController | null>(null);

  // Process definition management
  const setProcessDefinition = useCallback(async (definition: ProcessDefinition) => {
    const validation = validateProcessDefinition(definition);
    if (!validation.success) {
      setState(prev => ({
        ...prev,
        error: `Invalid process definition: ${validation.error.message}`,
      }));
      return;
    }

    try {
      await persistenceService.saveProcess(definition);
      setState(prev => ({
        ...prev,
        processDefinition: definition,
        currentStep: 'steps',
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save process',
      }));
    }
  }, [persistenceService]);

  // Step management
  const addStep = useCallback(async (stepData: Omit<ProcessStep, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!state.processDefinition) return;

    const newStep: ProcessStep = {
      ...stepData,
      id: generateUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedDefinition: ProcessDefinition = {
      ...state.processDefinition,
      steps: [...state.processDefinition.steps, newStep],
      updatedAt: new Date(),
    };

    await setProcessDefinition(updatedDefinition);
  }, [state.processDefinition, setProcessDefinition]);

  const updateStep = useCallback(async (stepId: string, updates: Partial<ProcessStep>) => {
    if (!state.processDefinition) return;

    const updatedSteps = state.processDefinition.steps.map(step =>
      step.id === stepId ? { ...step, ...updates, updatedAt: new Date() } : step
    );

    const updatedDefinition: ProcessDefinition = {
      ...state.processDefinition,
      steps: updatedSteps,
      updatedAt: new Date(),
    };

    await setProcessDefinition(updatedDefinition);
  }, [state.processDefinition, setProcessDefinition]);

  const deleteStep = useCallback(async (stepId: string) => {
    if (!state.processDefinition) return;

    const updatedSteps = state.processDefinition.steps.filter(step => step.id !== stepId);

    const updatedDefinition: ProcessDefinition = {
      ...state.processDefinition,
      steps: updatedSteps,
      updatedAt: new Date(),
    };

    await setProcessDefinition(updatedDefinition);
  }, [state.processDefinition, setProcessDefinition]);

  // Connection management
  const connectSteps = useCallback(async (fromStepId: string, toStepId: string) => {
    if (!state.processDefinition) return;

    const updatedSteps = state.processDefinition.steps.map(step => {
      if (step.id === toStepId) {
        return {
          ...step,
          dependencies: [...new Set([...step.dependencies, fromStepId])],
          updatedAt: new Date(),
        };
      }
      return step;
    });

    const updatedDefinition: ProcessDefinition = {
      ...state.processDefinition,
      steps: updatedSteps,
      updatedAt: new Date(),
    };

    await setProcessDefinition(updatedDefinition);
  }, [state.processDefinition, setProcessDefinition]);

  const disconnectSteps = useCallback(async (fromStepId: string, toStepId: string) => {
    if (!state.processDefinition) return;

    const updatedSteps = state.processDefinition.steps.map(step => {
      if (step.id === toStepId) {
        return {
          ...step,
          dependencies: step.dependencies.filter(dep => dep !== fromStepId),
          updatedAt: new Date(),
        };
      }
      return step;
    });

    const updatedDefinition: ProcessDefinition = {
      ...state.processDefinition,
      steps: updatedSteps,
      updatedAt: new Date(),
    };

    await setProcessDefinition(updatedDefinition);
  }, [state.processDefinition, setProcessDefinition]);

  // Process execution
  const executeProcess = useCallback(async (inputs: Record<string, unknown>) => {
    if (!state.processDefinition) return;

    try {
      setState(prev => ({
        ...prev,
        isExecuting: true,
        currentStep: 'execution',
        error: null,
        progress: 0,
      }));

      const executionId = generateUUID();
      const executionContext: ProcessExecutionContext = {
        processId: state.processDefinition.id,
        executionId,
        processDefinition: state.processDefinition,
        status: 'running',
        startTime: new Date(),
        variables: inputs,
        stepExecutions: [],
        progress: {
          completed: 0,
          total: state.processDefinition.steps.length,
          percentage: 0,
        },
        metadata: {},
      };

      await persistenceService.saveExecution(executionContext);

      setState(prev => ({
        ...prev,
        executionContext,
      }));

      // Simulate process execution
      for (let i = 0; i < state.processDefinition.steps.length; i++) {
        const step = state.processDefinition.steps[i];
        const stepExecution: ProcessStepExecution = {
          stepId: step.id,
          status: 'in_progress',
          startTime: new Date(),
          inputs: {},
          outputs: {},
          retryCount: 0,
        };

        // Update progress
        const progressPercentage = ((i + 1) / state.processDefinition.steps.length) * 100;
        setState(prev => ({
          ...prev,
          progress: progressPercentage,
          executionContext: prev.executionContext ? {
            ...prev.executionContext,
            stepExecutions: [...prev.executionContext.stepExecutions, stepExecution],
            progress: {
              completed: i + 1,
              total: state.processDefinition.steps.length,
              percentage: progressPercentage,
            },
          } : null,
        }));

        // Simulate step execution time
        await new Promise(resolve => setTimeout(resolve, 2000));

        stepExecution.endTime = new Date();
        stepExecution.duration = 2; // 2 seconds
        stepExecution.status = 'completed';
        stepExecution.outputs = { result: `Step ${i + 1} completed` };
      }

      // Complete execution
      const completedContext = executionContext;
      completedContext.status = 'completed';
      completedContext.endTime = new Date();
      completedContext.progress.percentage = 100;

      await persistenceService.saveExecution(completedContext);

      setState(prev => ({
        ...prev,
        executionContext: completedContext,
        progress: 100,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute process';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isExecuting: false,
      }));
    }
  }, [state.processDefinition, persistenceService]);

  const pauseExecution = useCallback(() => {
    // Implementation for pausing execution
    console.log('Pausing process execution');
  }, []);

  const resumeExecution = useCallback(() => {
    // Implementation for resuming execution
    console.log('Resuming process execution');
  }, []);

  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      isExecuting: false,
      executionContext: null,
      currentStep: 'steps',
      progress: 0,
    }));
  }, []);

  // Error management
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  // Reset
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      currentStep: 'definition',
      processDefinition: null,
      selectedStepId: null,
      isExecuting: false,
      executionContext: null,
      error: null,
      progress: 0,
    });
  }, []);

  // Convert description to steps
  const convertDescriptionToSteps = useCallback(async (description: string) => {
    try {
      const steps = await aiService.convertDescriptionToSteps(description);
      const optimizedSteps = await aiService.optimizeProcessSteps(steps);
      
      if (state.processDefinition) {
        const updatedDefinition: ProcessDefinition = {
          ...state.processDefinition,
          steps: optimizedSteps,
          updatedAt: new Date(),
        };
        await setProcessDefinition(updatedDefinition);
      }
      
      return optimizedSteps;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to convert description');
      return [];
    }
  }, [state.processDefinition, setProcessDefinition, setError, aiService]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    // State
    state,

    // Actions
    actions: {
      setProcessDefinition,
      addStep,
      updateStep,
      deleteStep,
      connectSteps,
      disconnectSteps,
      executeProcess,
      pauseExecution,
      resumeExecution,
      cancelExecution,
      setError,
      reset,
      convertDescriptionToSteps,
    },
    cleanup,
  };
}

export type UseProcessBuilderReturn = ReturnType<typeof useProcessBuilder>;
