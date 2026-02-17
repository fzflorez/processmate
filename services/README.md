# Services Layer

This directory contains the service layer architecture for ProcessMate, providing a scalable and maintainable foundation for business logic and data operations.

## Purpose

The service layer provides:

- **Business logic abstraction** - Separates domain logic from UI and data layers
- **Consistent error handling** - Standardized error management across all services
- **Result pattern implementation** - Predictable success/error response handling
- **Service composition** - Ability to combine multiple services for complex operations
- **Logging and monitoring** - Built-in observability for all service operations
- **Retry and timeout mechanisms** - Resilient service operations with automatic recovery

## Architecture

```
services/
├── base-service.ts      # Abstract base service class
├── service-error.ts     # Service error abstraction
├── service-result.ts    # Result pattern implementation
├── README.md           # This documentation
├── ai/                 # AI-related services
│   └── index.ts
├── database/           # Database services
│   └── index.ts
└── auth/               # Authentication services
    └── index.ts
```

## Core Components

### Base Service (`base-service.ts`)

The `AbstractBaseService` class provides:

- **Standard operation execution** with error handling
- **Timeout management** for long-running operations
- **Retry logic** with exponential backoff
- **Logging infrastructure** for debugging and monitoring
- **Health check** capabilities
- **Configuration management** for service settings

#### Usage Example

```typescript
import { AbstractBaseService } from '../base-service';
import { ServiceError, ServiceErrorCategory } from '../service-error';

class UserService extends AbstractBaseService {
  constructor() {
    super({
      serviceName: 'UserService',
      version: '1.0.0',
      timeout: 10000,
      retries: 3,
    });
  }

  async getUserById(id: string) {
    return this.executeOperation(async () => {
      // Your business logic here
      const user = await this.findUserInDatabase(id);
      
      if (!user) {
        throw ServiceError.notFound(
          'USER_NOT_FOUND',
          `User with id ${id} not found`
        );
      }
      
      return user;
    }, 'get_user_by_id');
  }
}
```

### Service Error (`service-error.ts`)

Structured error handling with:

- **Error categorization** - Validation, authentication, database, etc.
- **Severity levels** - Low, medium, high, critical
- **Rich context** - Request ID, user ID, operation details
- **Error chaining** - Preserves original error causes
- **Factory methods** - Convenient error creation

#### Error Categories

- `VALIDATION` - Input validation failures
- `AUTHENTICATION` - Authentication failures
- `AUTHORIZATION` - Permission/authorization failures
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflicts
- `EXTERNAL_SERVICE` - Third-party service failures
- `DATABASE` - Database operation failures
- `NETWORK` - Network-related failures
- `TIMEOUT` - Operation timeouts
- `INTERNAL` - Internal server errors
- `UNKNOWN` - Unclassified errors

#### Usage Example

```typescript
import { ServiceError, ServiceErrorCategory } from '../service-error';

// Create specific errors
throw ServiceError.validation(
  'INVALID_EMAIL',
  'Email format is invalid',
  { field: 'email', value: email }
);

throw ServiceError.authentication(
  'INVALID_CREDENTIALS',
  'Invalid username or password'
);

throw ServiceError.database(
  'CONNECTION_FAILED',
  'Database connection failed',
  originalError,
  { database: 'users' }
);
```

### Service Result (`service-result.ts`)

Result pattern implementation providing:

- **Consistent response structure** - Success/error with metadata
- **Type safety** - Generic typing for data
- **Status tracking** - Async operation states
- **Utility functions** - Result creation and manipulation
- **Type guards** - Safe result checking

#### Result Structure

```typescript
interface ServiceResult<T> {
  success: boolean;
  data?: T;           // Available when success is true
  error?: ServiceError; // Available when success is false
  status: AsyncStatus; // 'idle' | 'loading' | 'success' | 'error'
  timestamp: string;
}
```

#### Usage Example

```typescript
import { 
  createSuccessResult, 
  createErrorResult, 
  isSuccessResult,
  getResultData 
} from '../service-result';

// Create results
const success = createSuccessResult({ id: '123', name: 'John' });
const error = createErrorResult('Something went wrong');

// Check results
if (isSuccessResult(success)) {
  const data = getResultData(success); // Type-safe data access
}

// Wrap async operations
const result = await wrapServiceResult(async () => {
  return await someAsyncOperation();
});
```

## Service Modules

### AI Services (`/ai`)

Handles AI-related functionality:

- **OpenAI integration** - Chat completions, embeddings, etc.
- **Prompt management** - Template storage and rendering
- **Response processing** - AI response validation and formatting
- **Model configuration** - Temperature, tokens, model selection

### Database Services (`/database`)

Manages data persistence:

- **Supabase integration** - Database operations and real-time subscriptions
- **Repository pattern** - Data access abstraction
- **Query building** - Type-safe database queries
- **Caching layer** - Performance optimization

### Auth Services (`/auth`)

Handles authentication and authorization:

- **User authentication** - Login, registration, password management
- **Session management** - Token creation and validation
- **Permission system** - Role-based access control
- **Security features** - MFA, rate limiting, audit logging

## Best Practices

### 1. Service Design

- **Single responsibility** - Each service should have one clear purpose
- **Dependency injection** - Pass dependencies through constructors
- **Interface segregation** - Create focused interfaces for specific needs
- **Configuration externalization** - Use environment variables for settings

### 2. Error Handling

- **Specific error types** - Use appropriate error categories
- **Rich error context** - Include relevant metadata
- **Error boundaries** - Handle errors at appropriate levels
- **User-friendly messages** - Provide clear, actionable error messages

### 3. Result Pattern

- **Always return results** - Never throw errors from service methods
- **Type safety** - Use generic typing for data
- **Consistent structure** - Follow the standard result format
- **Proper status tracking** - Update status based on operation state

### 4. Logging

- **Structured logging** - Use consistent log formats
- **Appropriate levels** - Debug, info, warn, error
- **Context inclusion** - Include relevant metadata
- **Performance tracking** - Log operation durations

### 5. Testing

- **Unit tests** - Test individual service methods
- **Integration tests** - Test service interactions
- **Error scenarios** - Test error handling paths
- **Mock dependencies** - Isolate services during testing

## Creating New Services

### 1. Extend Base Service

```typescript
import { AbstractBaseService } from '../base-service';

export class MyService extends AbstractBaseService {
  constructor(config?: Partial<BaseServiceConfig>) {
    super({
      serviceName: 'MyService',
      version: '1.0.0',
      ...config,
    });
  }

  async myOperation(input: MyInput): Promise<ServiceResult<MyOutput>> {
    return this.executeOperation(async () => {
      // Business logic here
      return result;
    }, 'my_operation');
  }
}
```

### 2. Define Service Interface

```typescript
export interface IMyService {
  myOperation(input: MyInput): Promise<ServiceResult<MyOutput>>;
  anotherOperation(id: string): Promise<ServiceResult<AnotherOutput>>;
}
```

### 3. Add to Module

```typescript
// services/my-module/index.ts
export { MyService } from './my.service';
export type { IMyService } from './my.service.interface';

export const myServices = {
  myService: new MyService(),
};
```

## Service Composition

Services can be composed to create complex operations:

```typescript
class ProcessService extends AbstractBaseService {
  constructor(
    private userService: UserService,
    private aiService: AIService,
    private databaseService: DatabaseService
  ) {
    super({ serviceName: 'ProcessService' });
  }

  async processUserRequest(userId: string, request: string) {
    return this.executeOperation(async () => {
      // Get user
      const userResult = await this.userService.getUserById(userId);
      if (!userResult.success) {
        throw userResult.error;
      }

      // Process with AI
      const aiResult = await this.aiService.generateResponse(request);
      if (!aiResult.success) {
        throw aiResult.error;
      }

      // Save result
      const saveResult = await this.databaseService.saveProcessResult({
        userId,
        request,
        response: aiResult.data,
      });

      return saveResult.data;
    }, 'process_user_request');
  }
}
```

## Performance Considerations

- **Connection pooling** - Reuse database connections
- **Caching strategies** - Cache frequently accessed data
- **Batch operations** - Group multiple operations
- **Lazy loading** - Load data only when needed
- **Async operations** - Use non-blocking operations

## Security

- **Input validation** - Validate all inputs
- **Sanitization** - Sanitize user inputs
- **Rate limiting** - Prevent abuse
- **Audit logging** - Track sensitive operations
- **Error information** - Avoid leaking sensitive data in errors
