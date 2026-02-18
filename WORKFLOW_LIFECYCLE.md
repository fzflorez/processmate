# Workflow Lifecycle Documentation

## Overview

The ProcessMate workflow system provides a comprehensive framework for defining, executing, and managing complex workflows with AI integration. This document explains the complete workflow lifecycle from creation to execution and monitoring.

## Architecture Components

### Core Components

1. **WorkflowEngine** - Core execution engine with enhanced orchestration
2. **WorkflowRunner** - Dynamic workflow execution and management
3. **WorkflowBuilder** - Fluent API for creating workflows programmatically
4. **AI Integration** - Seamless integration with AI services and validation

### Key Features

- **Step Orchestration**: Advanced step execution with dependencies and conditions
- **Async Support**: Full asynchronous execution with concurrency control
- **AI Integration**: Built-in AI prompt execution and response validation
- **Priority Queuing**: Workflow execution queue with priority support
- **Retry Logic**: Configurable retry policies with exponential backoff
- **Event System**: Comprehensive event emission for monitoring and debugging
- **Structured Logging**: Enhanced logging with contextual information

## Workflow Lifecycle Stages

### 1. Workflow Definition

Workflows can be defined in two ways:

#### Static Definition
```typescript
const workflow: WorkflowDefinition = {
  id: 'my-workflow',
  name: 'My Workflow',
  description: 'A sample workflow',
  version: '1.0.0',
  steps: [
    {
      id: 'step1',
      name: 'Process Data',
      type: WorkflowStepType.TRANSFORM,
      transform: 'input.map(x => x * 2)'
    }
  ]
};
```

#### Dynamic Definition with Builder
```typescript
const workflow = workflowRunner
  .createBuilder('dynamic-workflow', 'Dynamic Workflow')
  .version('1.0.0')
  .addPromptStep('prompt', 'Execute AI', 'my-prompt', {
    validationSchema: 'analysisSchema'
  })
  .addTransformStep('transform', 'Process Results', 'results.map(x => x.value)')
  .build();
```

### 2. Workflow Registration

```typescript
// Register static workflow
workflowEngine.registerWorkflow(workflow);

// Register dynamic workflow
workflowRunner.registerWorkflow(workflow);
```

### 3. Workflow Execution

#### Basic Execution
```typescript
const result = await workflowRunner.executeWorkflow('my-workflow', {
  inputData: [1, 2, 3, 4, 5]
});
```

#### Advanced Execution with Configuration
```typescript
const result = await workflowRunner.executeWorkflow('my-workflow', inputs, {
  timeout: 60000,
  priority: 10,
  retryPolicy: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    maxDelay: 30000
  },
  metadata: {
    userId: 'user123',
    sessionId: 'session456'
  }
});
```

#### Parallel Execution
```typescript
const results = await workflowRunner.executeWorkflowsParallel([
  { workflowOrId: 'workflow1', inputs: data1 },
  { workflowOrId: 'workflow2', inputs: data2 },
  { workflowOrId: 'workflow3', inputs: data3 }
]);
```

### 4. Execution Monitoring

#### Event Listeners
```typescript
workflowEngine.addEventListener(WorkflowEventType.STARTED, (event) => {
  console.log(`Workflow ${event.workflowId} started`);
});

workflowEngine.addEventListener(WorkflowEventType.STEP_COMPLETED, (event) => {
  console.log(`Step ${event.stepId} completed in ${event.data?.duration}ms`);
});

workflowEngine.addEventListener(WorkflowEventType.COMPLETED, (event) => {
  console.log(`Workflow ${event.workflowId} completed successfully`);
});
```

#### Status Monitoring
```typescript
// Get execution status
const status = workflowRunner.getExecutionStatus(executionId);

// Get active executions
const activeExecutions = workflowEngine.getActiveExecutions();

// Get queue status
const queueStatus = workflowEngine.getQueueStatus();

// Get engine metrics
const metrics = workflowRunner.getMetrics();
```

### 5. Error Handling and Recovery

#### Automatic Retry
```typescript
const result = await workflowRunner.executeWorkflowWithRetry('my-workflow', inputs, {
  retryPolicy: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    maxDelay: 30000
  }
});
```

#### Manual Error Handling
```typescript
try {
  const result = await workflowRunner.executeWorkflow('my-workflow', inputs);
  if (!result.success) {
    console.error('Workflow failed:', result.error);
    // Handle failure
  }
} catch (error) {
  console.error('Execution error:', error);
  // Handle unexpected errors
}
```

## Step Types and Configuration

### 1. Prompt Steps
Execute AI prompts with optional validation:

```typescript
.addPromptStep('ai-analysis', 'AI Analysis', 'analysis-prompt', {
  variables: { context: 'business' },
  validationSchema: 'analysisSchema',
  timeout: 30000,
  retryCount: 2,
  skipCondition: 'context.skipAI === true'
})
```

### 2. Condition Steps
Conditional branching based on expressions:

```typescript
.addConditionStep('check-data', 'Check Data Quality', 
  'context.dataQuality > 0.8', 
  'process-high-quality', 
  'process-low-quality', {
  skipCondition: 'context.forceProcessing === true'
})
```

### 3. Parallel Steps
Execute multiple steps concurrently:

```typescript
.addParallelStep('parallel-tasks', 'Parallel Processing', 
  ['task1', 'task2', 'task3'], {
  waitForAll: true,
  timeout: 60000
})
```

### 4. Transform Steps
Data transformation using JavaScript expressions:

```typescript
.addTransformStep('normalize', 'Normalize Data', 
  'input.map(item => ({ ...item, normalized: item.value / max }))', {
  inputPath: 'rawData',
  outputPath: 'processedData'
})
```

### 5. Validation Steps
Validate data against schemas:

```typescript
.addValidationStep('validate', 'Validate Output', 
  'schema.validate(input).success', {
  schema: { type: 'object', required: ['id', 'value'] }
})
```

### 6. API Call Steps
External API integration:

```typescript
.addAPICallStep('fetch-data', 'Fetch External Data', 
  'https://api.example.com/data', 'POST', {
  headers: { 'Authorization': 'Bearer token' },
  body: { query: 'example' },
  responsePath: 'data.items'
})
```

### 7. Delay Steps
Introduce delays in workflow execution:

```typescript
.addDelayStep('wait', 'Wait for Processing', 5000, {
  skipCondition: 'context.skipDelay === true'
})
```

### 8. Custom Steps
Custom logic implementation:

```typescript
.addCustomStep('custom-logic', 'Custom Processing', 
  'return customHandler.process(input, config)', {
  config: { mode: 'advanced' }
})
```

## Advanced Features

### Priority Queuing

Workflows are executed based on priority:

```typescript
// High priority workflow
await workflowRunner.executeWorkflow('urgent-workflow', inputs, {
  priority: 100
});

// Low priority workflow
await workflowRunner.executeWorkflow('background-workflow', inputs, {
  priority: 1
});
```

### Skip Conditions

Steps can be conditionally skipped:

```typescript
.addPromptStep('optional-ai', 'Optional AI Step', 'prompt-id', {
  skipCondition: 'context.userPreference.skipAI === true || context.budget < 100'
})
```

### AI Output Validation

Automatic validation of AI responses:

```typescript
.addPromptStep('validated-ai', 'Validated AI', 'prompt-id', {
  validationSchema: 'structuredResponse',
  metadata: {
    requireValidation: true,
    validationLevel: 'strict'
  }
})
```

### Context Propagation

Data flows between steps through context:

```typescript
// Step 1 produces output
.addTransformStep('step1', 'Process Data', 'input.map(x => x * 2)')

// Step 2 can access previous output
.addTransformStep('step2', 'Further Process', 'context.step1.map(x => x + 1)')
```

## Best Practices

### 1. Workflow Design

- **Idempotency**: Design steps to be idempotent where possible
- **Granularity**: Keep steps focused on single responsibilities
- **Error Boundaries**: Use validation steps to catch errors early
- **Timeouts**: Set appropriate timeouts for each step

### 2. Performance Optimization

- **Parallel Execution**: Use parallel steps for independent operations
- **Priority Management**: Set appropriate priorities for different workflow types
- **Resource Management**: Monitor concurrent execution limits
- **Caching**: Cache expensive operations where applicable

### 3. Monitoring and Debugging

- **Event Listeners**: Set up comprehensive event monitoring
- **Structured Logging**: Use the built-in logging capabilities
- **Metrics Collection**: Monitor engine metrics regularly
- **Error Tracking**: Implement proper error tracking and alerting

### 4. Security Considerations

- **Input Validation**: Validate all inputs at workflow boundaries
- **API Security**: Secure API call steps with proper authentication
- **Data Privacy**: Be mindful of data passed to AI services
- **Access Control**: Implement proper access controls for workflow execution

## Error Scenarios and Solutions

### 1. Step Timeout
```typescript
// Solution: Increase timeout or optimize step logic
.addTransformStep('slow-step', 'Slow Processing', 'process(input)', {
  timeout: 120000 // 2 minutes
})
```

### 2. AI Validation Failure
```typescript
// Solution: Add retry logic with different prompts
.addPromptStep('ai-step', 'AI Processing', 'prompt-id', {
  validationSchema: 'strictSchema',
  retryCount: 3,
  metadata: {
    fallbackPrompt: 'simple-prompt-id'
  }
})
```

### 3. API Rate Limiting
```typescript
// Solution: Add delay and retry logic
.addAPICallStep('api-call', 'External API', 'https://api.example.com', 'GET', {
  retryCount: 5,
  timeout: 30000
})
.addDelayStep('rate-limit-delay', 'Rate Limit Delay', 1000)
```

### 4. Memory Issues
```typescript
// Solution: Process data in chunks
.addTransformStep('chunk-process', 'Process Chunks', 
  'input.reduce((acc, item, index) => {
    if (index % 1000 === 0) acc.push([]);
    acc[acc.length - 1].push(item);
    return acc;
  }, [])')
```

## Monitoring and Observability

### Key Metrics to Monitor

1. **Execution Time**: Average and maximum workflow execution times
2. **Success Rate**: Percentage of successful workflow executions
3. **Queue Depth**: Number of workflows waiting in execution queue
4. **Concurrent Executions**: Number of currently running workflows
5. **Step Failures**: Frequency and patterns of step failures

### Logging Structure

The workflow engine provides structured logging:

```typescript
{
  timestamp: "2024-01-01T12:00:00.000Z",
  level: "info",
  message: "Step completed: ai-analysis",
  data: {
    duration: 2500,
    outputType: "object"
  },
  engine: "WorkflowEngine",
  activeExecutions: 3,
  queueSize: 1
}
```

### Event Types

- `STARTED`: Workflow execution started
- `STEP_STARTED`: Individual step execution started
- `STEP_COMPLETED`: Step completed successfully
- `STEP_FAILED`: Step execution failed
- `COMPLETED`: Workflow completed successfully
- `FAILED`: Workflow execution failed
- `CANCELLED`: Workflow execution was cancelled

## Integration Examples

### 1. E-commerce Order Processing

```typescript
const orderWorkflow = workflowRunner
  .createBuilder('order-processing', 'Order Processing')
  .addAPICallStep('validate-order', 'Validate Order', 
    '/api/orders/validate', 'POST', {
    body: { orderId: 'context.orderId' }
  })
  .addConditionStep('check-inventory', 'Check Inventory',
    'context.inventory.available >= context.order.quantity',
    'process-payment', 'out-of-stock')
  .addAPICallStep('process-payment', 'Process Payment',
    '/api/payments/process', 'POST', {
    body: { orderId: 'context.orderId', amount: 'context.order.total' }
  })
  .addPromptStep('generate-receipt', 'Generate Receipt',
    'receipt-template', {
    variables: { orderDetails: 'context.order' }
  })
  .build();
```

### 2. Data Analysis Pipeline

```typescript
const analysisWorkflow = workflowRunner
  .createBuilder('data-analysis', 'Data Analysis Pipeline')
  .addAPICallStep('fetch-data', 'Fetch Raw Data', 
    '/api/data/raw', 'GET')
  .addTransformStep('clean-data', 'Clean Data',
    'input.filter(item => item && item.value !== null)')
  .addPromptStep('analyze-data', 'Analyze Data',
    'data-analysis-prompt', {
    validationSchema: 'analysisSchema'
  })
  .addTransformStep('generate-report', 'Generate Report',
    'createReport(context.analyzeData, context.cleanData)')
  .addAPICallStep('save-results', 'Save Results',
    '/api/results/save', 'POST', {
    body: { report: 'context.generateReport' }
  })
  .build();
```

## Conclusion

The ProcessMate workflow system provides a robust, scalable, and flexible framework for building complex workflows with AI integration. By understanding the workflow lifecycle and following best practices, you can create efficient, reliable, and maintainable workflow solutions.

For more specific implementation details, refer to the TypeScript interfaces and type definitions in the `workflow.types.ts` file.
