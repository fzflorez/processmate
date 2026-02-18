# AI Service Architecture

This document explains the AI service abstraction engine architecture, its components, and how to use it effectively in the ProcessMate application.

## Overview

The AI service architecture provides a clean, type-safe abstraction layer for interacting with various AI providers (OpenAI, Anthropic, Local models) while ensuring consistent error handling, response validation, and integration with the existing service patterns.

## Architecture Components

### 1. AI Types (`ai.types.ts`)

Defines all TypeScript interfaces and enums for the AI system:

- **AIProvider**: Enum for supported providers (OPENAI, ANTHROPIC, LOCAL)
- **AIRequest/Response**: Request and response structures
- **StructuredAIResponse**: Typed response with validation metadata
- **AIServiceConfig**: Configuration for AI service initialization
- **AIValidationSchema**: Zod schema wrapper for response validation

### 2. AI Client (`ai-client.ts`)

Handles communication with AI providers:

- **IAIClient**: Interface for AI client implementations
- **OpenAIClient**: OpenAI provider implementation
- **AnthropicClient**: Anthropic provider implementation (placeholder)
- **LocalAIClient**: Local model provider implementation (placeholder)
- **AIClientFactory**: Factory for creating and managing client instances

#### Key Features:
- Graceful fallback when OpenAI SDK is not installed
- Mock implementations for development and testing
- Comprehensive error handling and categorization
- Automatic retry logic and timeout management

### 3. AI Validator (`ai-validator.ts`)

Validates AI responses using Zod schemas:

- **AIValidator**: Main validation class
- **CommonSchemas**: Pre-built validation schemas
- JSON extraction from natural language responses
- Structured error reporting for validation failures

#### Key Features:
- Automatic JSON extraction from AI responses
- Comprehensive validation error reporting
- Schema registration and management
- Support for complex nested validation schemas

### 4. AI Service (`ai-service.ts`)

Main service orchestrating AI operations:

- **AIService**: Primary service class
- Integration with prompt loader for template management
- Caching layer for performance optimization
- Metrics tracking and monitoring
- Structured response generation

#### Key Features:
- Template-based prompt management
- Response caching with TTL
- Comprehensive metrics tracking
- Service result pattern integration

## Integration with Prompt Loader

The AI service integrates seamlessly with the existing prompt loader system:

```typescript
// Load and execute a prompt template
const result = await aiService.sendPrompt(
  'chat.default',           // Template ID
  { userInput: 'Hello' },   // Variables
  'string',                 // Validation schema key
  { userId: 'user123' }     // Context
);
```

## Usage Examples

### Basic AI Service Setup

```typescript
import { aiService, AIProvider } from '@/services/ai';

// Initialize the AI service
await aiService.initialize({
  client: {
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: 30000,
  },
  defaultModel: {
    provider: AIProvider.OPENAI,
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
  },
  enableCaching: true,
  enableValidation: true,
});
```

### Using Prompt Templates

```typescript
// Send a prompt with template and validation
const result = await aiService.sendPrompt(
  'process.analysis',
  { processDescription: 'User registration flow' },
  'analysis',  // Uses CommonSchemas.analysisSchema
  { userId: 'user123' }
);

if (result.success) {
  const analysis = result.data?.data;
  console.log('Analysis:', analysis);
} else {
  console.error('AI request failed:', result.error);
}
```

### Raw Prompt Usage

```typescript
// Send raw prompt without template
const result = await aiService.sendRawPrompt(
  'Explain this code: const x = 42;',
  {
    systemPrompt: 'You are a helpful programming assistant.',
    model: { temperature: 0.3 },
    context: { sessionId: 'session456' }
  }
);
```

### Custom Validation

```typescript
import { z } from 'zod';

// Register custom validation schema
const customSchema = aiValidator.createSchema(
  z.object({
    confidence: z.number().min(0).max(1),
    categories: z.array(z.string()),
    summary: z.string(),
  }),
  'Custom analysis result'
);

aiValidator.registerSchema('customAnalysis', customSchema);

// Use custom schema
const result = await aiService.sendPrompt(
  'analyze.content',
  { content: 'Article text here' },
  'customAnalysis'
);
```

## Error Handling

The AI service provides comprehensive error handling:

### Error Categories

- **INVALID_API_KEY**: Missing or invalid API key
- **MODEL_NOT_FOUND**: Requested model not available
- **RATE_LIMIT_EXCEEDED**: API rate limit exceeded
- **VALIDATION_FAILED**: Response validation failed
- **NETWORK_ERROR**: Network connectivity issues
- **TIMEOUT_ERROR**: Request timeout
- **UNKNOWN_ERROR**: Unexpected errors

### Error Handling Pattern

```typescript
const result = await aiService.sendPrompt('template.id', {});

if (!result.success) {
  // Handle different error types
  switch (result.error?.code) {
    case 'RATE_LIMIT_EXCEEDED':
      // Implement retry logic or user notification
      break;
    case 'VALIDATION_FAILED':
      // Log validation issues
      break;
    default:
      // Generic error handling
      break;
  }
}
```

## Performance Features

### Caching

- Automatic response caching based on request parameters
- Configurable TTL (default: 5 minutes)
- Cache hit/miss tracking
- Manual cache clearing support

### Metrics

The AI service tracks comprehensive metrics:

```typescript
const metrics = aiService.getMetrics();
console.log('Total requests:', metrics.totalRequests);
console.log('Success rate:', metrics.successfulRequests / metrics.totalRequests);
console.log('Average latency:', metrics.averageLatency);
console.log('Total tokens used:', metrics.totalTokens);
```

## Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_ORGANIZATION=your_org_id

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key

# Local AI Configuration
LOCAL_AI_BASE_URL=http://localhost:8080/v1
```

### Service Configuration

```typescript
const config: AIServiceConfig = {
  client: {
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL,
    timeout: 30000,
    maxRetries: 3,
  },
  defaultModel: {
    provider: AIProvider.OPENAI,
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
  },
  enableCaching: true,
  enableValidation: true,
  maxConcurrency: 5,
};
```

## Best Practices

### 1. Template Management

- Use descriptive template IDs
- Include comprehensive variable descriptions
- Provide examples in template definitions
- Validate templates before deployment

### 2. Error Handling

- Always check `result.success` before accessing data
- Implement retry logic for rate limit errors
- Log validation failures for debugging
- Provide user-friendly error messages

### 3. Performance

- Enable caching for frequently used prompts
- Monitor token usage and costs
- Use appropriate model sizes for tasks
- Implement request batching where possible

### 4. Security

- Never expose API keys in client-side code
- Use environment variables for sensitive configuration
- Implement request rate limiting
- Validate and sanitize user inputs

### 5. Validation

- Always validate structured AI responses
- Use specific schemas for different response types
- Handle validation failures gracefully
- Provide fallback responses for critical operations

## Testing

### Mock Implementation

The AI service includes mock implementations that work without API keys:

```typescript
// Works without OpenAI SDK installed
const result = await aiService.sendPrompt('test.template', {});
// Returns: "Mock AI response for: template content..."
```

### Unit Testing

```typescript
import { aiService } from '@/services/ai';

describe('AI Service', () => {
  beforeEach(async () => {
    await aiService.initialize({
      client: { apiKey: 'test-key' },
      defaultModel: { provider: AIProvider.OPENAI, model: 'gpt-3.5-turbo' },
    });
  });

  it('should send prompt and return structured response', async () => {
    const result = await aiService.sendPrompt('test.template', {}, 'string');
    expect(result.success).toBe(true);
    expect(result.data?.data).toBeDefined();
  });
});
```

## Migration Strategy

### From Direct API Calls

```typescript
// Before
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.chat.completions.create({...});

// After
import { aiService } from '@/services/ai';
const result = await aiService.sendRawPrompt('Your prompt here');
if (result.success) {
  const response = result.data;
}
```

### From Existing AI Services

1. **Phase 1**: Set up AI service configuration
2. **Phase 2**: Replace direct API calls with aiService methods
3. **Phase 3**: Add validation schemas for structured responses
4. **Phase 4**: Implement caching and metrics
5. **Phase 5**: Add custom prompt templates

## Future Enhancements

### Planned Features

1. **Streaming Support**: Real-time response streaming
2. **Multi-modal Support**: Image and audio processing
3. **Advanced Caching**: Distributed caching with Redis
4. **Rate Limiting**: Built-in request rate limiting
5. **Cost Tracking**: Detailed cost analysis and alerts
6. **A/B Testing**: Model comparison and testing framework
7. **Prompt Optimization**: Automatic prompt improvement
8. **Custom Providers**: Easy integration of new AI providers

### Extensibility

The architecture is designed for easy extension:

- **New Providers**: Implement `IAIClient` interface
- **Custom Validators**: Extend `AIValidator` class
- **Prompt Templates**: Add to `/prompts` directory
- **Validation Schemas**: Register with `aiValidator`

## File Structure

```
services/ai/
├── ai-client.ts          # AI provider clients
├── ai-service.ts         # Main AI service
├── ai-validator.ts       # Response validation
├── ai.types.ts           # Type definitions
├── index.ts              # Module exports
└── README.md             # This documentation

prompts/
├── prompt-loader.ts      # Template loading system
├── prompt.types.ts       # Prompt type definitions
└── [template files]      # Individual prompt templates
```

This architecture provides a robust, scalable, and maintainable foundation for AI integration in the ProcessMate application while following established patterns and best practices.
