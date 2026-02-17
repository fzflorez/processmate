# ProcessMate - AI Workflow Architecture

This document explains the AI workflow philosophy and architecture implemented in ProcessMate.

## Overview

ProcessMate implements a sophisticated AI workflow system that enables:
- **Dynamic prompt management** with template-based AI interactions
- **Workflow orchestration** for complex multi-step processes
- **Type-safe execution** with comprehensive error handling
- **Event-driven architecture** for real-time monitoring and debugging

## Core Philosophy

### 1. Prompt-Centric Design

AI interactions are centered around **prompt templates** rather than hardcoded prompts:

```typescript
// Template-based approach
const template = {
  id: 'process.analysis',
  template: 'Analyze the following process: {{processDescription}}',
  variables: [{ name: 'processDescription', type: 'string', required: true }]
};

// vs hardcoded approach
const hardcodedPrompt = `Analyze the following process: ${userInput}`;
```

**Benefits:**
- **Reusability** - Templates can be reused across different contexts
- **Maintainability** - Changes to prompts are centralized
- **Type Safety** - Variable validation and type checking
- **Documentation** - Built-in examples and descriptions

### 2. Workflow Composition

Complex AI operations are broken down into **workflow steps**:

```typescript
// Multi-step workflow
const workflow = {
  id: 'business.process.analysis',
  steps: [
    { type: 'prompt', promptId: 'process.analysis' },
    { type: 'transform', transform: 'formatAnalysisResult' },
    { type: 'validate', validation: 'hasRequiredSections' },
    { type: 'api_call', endpoint: '/api/save-analysis' }
  ]
};
```

**Benefits:**
- **Modularity** - Each step can be developed and tested independently
- **Reusability** - Steps can be combined in different workflows
- **Error Isolation** - Failures are contained to specific steps
- **Parallel Processing** - Steps can run concurrently when appropriate

### 3. Event-Driven Execution

All workflow operations emit **events** for monitoring:

```typescript
// Event-driven monitoring
workflowEngine.addEventListener(WorkflowEventType.STEP_STARTED, (event) => {
  console.log(`Step ${event.stepId} started`);
});

workflowEngine.addEventListener(WorkflowEventType.STEP_FAILED, (event) => {
  console.error(`Step ${event.stepId} failed: ${event.error}`);
});
```

**Benefits:**
- **Real-time Monitoring** - Track execution progress live
- **Debugging** - Detailed event logs for troubleshooting
- **Integration** - External systems can listen to workflow events
- **Analytics** - Build metrics and reporting systems

## Architecture Components

### Prompt System (`/prompts`)

#### Type Definitions (`prompt.types.ts`)
- **Interfaces** for all prompt-related data structures
- **Enums** for categorization and status tracking
- **Type Safety** - Full TypeScript support

#### Prompt Loader (`prompt-loader.ts`)
- **Template Management** - Load, cache, and validate prompts
- **Compilation** - Variable substitution and template processing
- **Execution** - AI service integration with context management
- **Caching** - Performance optimization for compiled prompts

### Workflow System (`/workflows`)

#### Type Definitions (`workflow.types.ts`)
- **Step Types** - Prompt, condition, parallel, delay, transform, etc.
- **Execution Context** - Runtime state and variable management
- **Event System** - Comprehensive event types and listeners
- **Handler Interface** - Pluggable step execution system

#### Workflow Engine (`workflow-engine.ts`)
- **Orchestration** - Step-by-step workflow execution
- **Timeout Management** - Configurable timeouts and retries
- **Event Emission** - Real-time progress tracking
- **Default Handlers** - Built-in implementations for common step types

## Usage Patterns

### 1. Simple Prompt Execution

```typescript
import { promptLoader } from '@/prompts';

// Execute a single prompt
const result = await promptLoader.loadAndExecute('chat.default', {
  userInput: 'Hello, how are you?'
}, {
  userId: 'user123',
  model: { provider: 'openai', model: 'gpt-4' }
});

if (result.success) {
  console.log('AI Response:', result.content);
}
```

### 2. Workflow Composition

```typescript
import { workflowEngine } from '@/workflows';

// Define a workflow
const analysisWorkflow = {
  id: 'process.analysis',
  name: 'Business Process Analysis',
  steps: [
    {
      id: 'analyze',
      type: 'prompt',
      promptId: 'process.analysis',
      variables: { processDescription: 'customer onboarding process' }
    },
    {
      id: 'validate',
      type: 'validate',
      validation: 'result => result && result.length > 100',
      schema: { minLength: 50 }
    }
  ]
};

// Register and execute
workflowEngine.registerWorkflow(analysisWorkflow);

const result = await workflowEngine.executeWorkflow('process.analysis', {
  processDescription: 'customer onboarding process'
});
```

### 3. Event-Driven Monitoring

```typescript
// Set up monitoring
workflowEngine.addEventListener(WorkflowEventType.STARTED, (event) => {
  updateUI({ status: 'running', startTime: event.timestamp });
});

workflowEngine.addEventListener(WorkflowEventType.STEP_COMPLETED, (event) => {
  updateProgress({ currentStep: event.stepId, progress: calculateProgress() });
});

workflowEngine.addEventListener(WorkflowEventType.COMPLETED, (event) => {
  updateUI({ status: 'completed', results: event.data });
});
```

### 4. Custom Step Handlers

```typescript
// Register custom step handler
workflowEngine.registerStepHandler(WorkflowStepType.CUSTOM, {
  async execute(step, context) {
    // Custom logic
    return await customAPICall(step.config);
  },
  
  validate(step, input) {
    // Custom validation
    return isValidInput(input);
  }
});
```

## Best Practices

### 1. Prompt Design

- **Variable Naming** - Use descriptive, consistent variable names
- **Template Structure** - Keep templates readable and well-organized
- **Validation** - Always validate inputs before processing
- **Documentation** - Provide clear examples and descriptions

### 2. Workflow Design

- **Single Responsibility** - Each step should have one clear purpose
- **Error Handling** - Graceful failure handling with retry logic
- **Timeout Management** - Appropriate timeouts for different operation types
- **State Management** - Clear data flow between steps

### 3. Performance Optimization

- **Caching** - Cache compiled prompts and workflow results
- **Parallel Processing** - Use parallel steps when operations are independent
- **Lazy Loading** - Load templates and workflows on demand
- **Memory Management** - Clean up resources and event listeners

### 4. Monitoring and Debugging

- **Event Logging** - Comprehensive event tracking
- **Error Context** - Include relevant context in error messages
- **Progress Tracking** - Provide real-time progress updates
- **Metrics Collection** - Track performance and usage patterns

## Integration Points

### 1. AI Service Integration

The workflow engine integrates with AI services through the prompt system:

```typescript
// AI service integration
class AIServiceIntegration {
  async executePrompt(prompt: string, context: PromptExecutionContext) {
    switch (context.model.provider) {
      case 'openai':
        return this.callOpenAI(prompt, context);
      case 'anthropic':
        return this.callAnthropic(prompt, context);
      default:
        throw new Error(`Unsupported provider: ${context.model.provider}`);
    }
  }
}
```

### 2. Database Integration

Workflow results can be persisted and retrieved:

```typescript
// Database integration
class WorkflowPersistence {
  async saveExecution(execution: WorkflowExecutionContext) {
    await db.workflowExecutions.create({
      id: execution.executionId,
      workflowId: execution.workflowId,
      status: execution.status,
      inputs: execution.inputs,
      outputs: execution.outputs,
      duration: execution.duration,
      timestamp: new Date()
    });
  }
  
  async getExecution(executionId: string) {
    return await db.workflowExecutions.findUnique({
      where: { id: executionId }
    });
  }
}
```

### 3. UI Integration

React components can consume workflow events:

```typescript
// React integration
function WorkflowMonitor({ workflowId }: { workflowId: string }) {
  const [status, setStatus] = useState<WorkflowStatus>('pending');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const handleEvent = (event: WorkflowEvent) => {
      if (event.workflowId === workflowId) {
        switch (event.type) {
          case WorkflowEventType.STARTED:
            setStatus('running');
            break;
          case WorkflowEventType.STEP_COMPLETED:
            setProgress(calculateProgress());
            break;
          case WorkflowEventType.COMPLETED:
            setStatus('completed');
            break;
        }
      }
    };
    
    workflowEngine.addEventListener(WorkflowEventType.STARTED, handleEvent);
    workflowEngine.addEventListener(WorkflowEventType.STEP_COMPLETED, handleEvent);
    workflowEngine.addEventListener(WorkflowEventType.COMPLETED, handleEvent);
    
    return () => {
      workflowEngine.removeEventListener(WorkflowEventType.STARTED, handleEvent);
      workflowEngine.removeEventListener(WorkflowEventType.STEP_COMPLETED, handleEvent);
      workflowEngine.removeEventListener(WorkflowEventType.COMPLETED, handleEvent);
    };
  }, [workflowId]);
  
  return (
    <div>
      <div>Status: {status}</div>
      <div>Progress: {progress}%</div>
    </div>
  );
}
```

## Error Handling Strategy

### 1. Graceful Degradation

- **Step Isolation** - Failures don't cascade to other steps
- **Retry Logic** - Configurable retry with exponential backoff
- **Fallback Options** - Alternative approaches when primary fails
- **User Feedback** - Clear error messages and recovery options

### 2. Context Preservation

- **State Management** - Maintain execution context throughout workflow
- **Variable Passing** - Clear data flow between steps
- **Error Context** - Include relevant context in error reporting
- **Recovery State** - Enable workflow resumption after failures

## Security Considerations

### 1. Input Validation

- **Template Validation** - Validate prompt templates before use
- **Variable Sanitization** - Clean and validate user inputs
- **Type Checking** - Ensure variables match expected types
- **Injection Prevention** - Protect against prompt injection attacks

### 2. Access Control

- **User Context** - Include user permissions in execution context
- **Workflow Permissions** - Control access to specific workflows
- **Resource Limits** - Enforce usage quotas and rate limits
- **Audit Logging** - Track all workflow executions for compliance

## Future Enhancements

### 1. Advanced Workflow Features

- **Conditional Branching** - Complex conditional logic in workflows
- **Loop Constructs** - Iterative processing with dynamic conditions
- **Sub-workflows** - Nested workflow composition
- **Dynamic Step Generation** - Runtime step creation and modification

### 2. AI Model Integration

- **Multi-Model Support** - Support for different AI providers
- **Model Selection** - Automatic model choice based on requirements
- **Cost Optimization** - Token usage and cost management
- **Performance Tuning** - Model-specific optimization strategies

### 3. Monitoring and Analytics

- **Performance Metrics** - Detailed execution analytics
- **Usage Patterns** - Workflow usage optimization insights
- **Error Analysis** - Pattern recognition in failures
- **Resource Monitoring** - System resource usage tracking

This architecture provides a robust, scalable foundation for AI-powered workflows in ProcessMate, enabling complex automation while maintaining type safety, error resilience, and comprehensive monitoring capabilities.
