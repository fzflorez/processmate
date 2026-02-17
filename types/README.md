# Types Directory

This directory contains the centralized type definitions for ProcessMate, providing type safety and consistency across the entire application.

## Purpose

The types layer provides:

- **Type safety** for all data structures and API interactions
- **Reusable type definitions** to avoid duplication
- **Consistent interfaces** for common operations
- **Better developer experience** with IntelliSense and compile-time checking

## Structure

```
types/
├── index.ts          # Central type exports
├── common.types.ts   # Reusable common types
├── api.types.ts      # API-specific types and interfaces
└── README.md         # This documentation
```

## Common Types (`common.types.ts`)

### Core Types

- **`AsyncStatus`** - Status of asynchronous operations (`idle`, `loading`, `success`, `error`)
- **`ApiResponse<T>`** - Generic API response wrapper with success status and metadata
- **`Pagination`** - Pagination metadata for list responses
- **`ErrorResponse`** - Standard error response structure
- **`Result<T, E>`** - Result type for operations that can fail

### Utility Types

- **`Optional<T, K>`** - Makes specific properties optional
- **`Required<T, K>`** - Makes specific properties required
- **`DeepPartial<T>`** - Recursively makes all properties optional

### Entity Types

- **`BaseEntity`** - Standard entity with id, createdAt, updatedAt
- **`SoftDeletableEntity`** - BaseEntity with soft delete support
- **`SearchOptions`** - Common search and filter options

## API Types (`api.types.ts`)

### HTTP & Request Types

- **`HttpMethod`** - Supported HTTP methods
- **`ApiEndpoint`** - Endpoint configuration interface
- **`ApiRequestOptions`** - Request configuration options
- **`ApiClient`** - API client interface with CRUD methods

### Error Handling

- **`ApiErrorType`** - Enum of API error types
- **`ApiError`** - Detailed error information structure

### Resource Management

- **`ResourceApi<T>`** - Generic CRUD operations interface
- **`BatchOperation<T>`** - Batch operation types
- **`BatchResponse<T>`** - Batch operation response

### Integration Types

- **`WebhookEvent<T>`** - Webhook event structure
- **`RateLimit`** - Rate limiting information

## Usage Examples

### Using Common Types

```typescript
import type { ApiResponse, AsyncStatus, Pagination } from '@/types';

// API response with typed data
const response: ApiResponse<User[]> = {
  data: users,
  success: true,
  timestamp: new Date().toISOString(),
};

// Async status in React components
const [status, setStatus] = useState<AsyncStatus>('idle');
```

### Using API Types

```typescript
import type { ApiClient, ResourceApi, ApiError } from '@/types';

// Implementing a resource API
class UserApi implements ResourceApi<User> {
  async list(params?: Record<string, unknown>) {
    // Implementation
  }
  
  async get(id: string) {
    // Implementation
  }
  // ... other methods
}
```

## Best Practices

1. **Import from index** - Use `import type { ... } from '@/types'` for cleaner imports
2. **Prefer specific types** - Use `ApiResponse<User>` instead of `any`
3. **Reuse common types** - Leverage `BaseEntity`, `Pagination`, etc.
4. **Document new types** - Add JSDoc comments for complex types
5. **Keep types focused** - Each file should have a clear responsibility

## Adding New Types

### 1. Create a new type file

```typescript
// types/business.types.ts
export interface Process {
  id: string;
  name: string;
  steps: ProcessStep[];
}

export interface ProcessStep {
  id: string;
  name: string;
  completed: boolean;
}
```

### 2. Export from index

```typescript
// types/index.ts
export * from './business.types';
```

### 3. Use throughout the application

```typescript
import type { Process } from '@/types';
```

## Type Safety Benefits

- **Compile-time error checking** - Catch type errors before runtime
- **Better IDE support** - Autocomplete and inline documentation
- **Refactoring safety** - Type-aware rename and refactoring
- **Team consistency** - Shared understanding of data structures
- **Documentation** - Types serve as living documentation

## Integration with Schemas

Types work in conjunction with the `/schemas` directory:

- **Types** define the TypeScript interfaces
- **Schemas** provide runtime validation using Zod
- Both should stay in sync for full type safety
