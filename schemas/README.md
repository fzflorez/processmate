# Schemas Directory

This directory contains the validation schemas for ProcessMate, providing runtime data validation and type safety using Zod.

## Purpose

The schemas layer provides:

- **Runtime validation** of incoming data and API responses
- **Type inference** from validation schemas
- **Data sanitization** and transformation
- **Consistent validation rules** across the application
- **Error handling** with detailed validation messages

## Structure

```
schemas/
├── index.ts          # Central schema exports
├── common.schema.ts  # Reusable validation schemas
└── README.md         # This documentation
```

## Common Schemas (`common.schema.ts`)

### Base Validation Schemas

The common schema file contains reusable validation patterns:

- **ID validation** - UUID and identifier formats
- **String formats** - Email, URL, datetime validation
- **Pagination** - Page, limit, and metadata validation
- **Search options** - Query parameters and filters

### Schema Utilities

Helper functions for schema operations:

- **`validate()`** - Strict validation with error throwing
- **`safeValidate()`** - Safe validation with result object

## Usage Examples

### Basic Validation

```typescript
import { commonSchemas, schemaUtils } from '@/schemas';

// Validate a user ID (when Zod is installed)
const userId = '123e4567-e89b-12d3-a456-426614174000';
const validatedId = schemaUtils.validate(commonSchemas.id, userId);
```

### API Response Validation

```typescript
// Validate API response data
const response = {
  page: 1,
  limit: 10,
  total: 100,
  totalPages: 10,
  hasNext: true,
  hasPrev: false,
};

const validatedPagination = schemaUtils.validate(
  commonSchemas.pagination,
  response
);
```

### Safe Validation

```typescript
// Safe validation with error handling
const result = schemaUtils.safeValidate(commonSchemas.email, 'invalid-email');

if (!result.success) {
  console.error('Validation error:', result.error);
} else {
  console.log('Valid email:', result.data);
}
```

## Schema Structure

### Schema Definition Pattern

```typescript
// Example schema structure (when Zod is installed)
export const userSchema = z.object({
  id: commonSchemas.id,
  email: commonSchemas.email,
  name: z.string().min(1).max(100),
  createdAt: commonSchemas.timestamp,
  updatedAt: commonSchemas.timestamp,
});

// Infer TypeScript type from schema
export type User = z.infer<typeof userSchema>;
```

### Composite Schemas

```typescript
// Building complex schemas from reusable parts
export const createUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateUserSchema = userSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
```

## Integration with Types

Schemas work in conjunction with the `/types` directory:

1. **Define schemas** with Zod validation rules
2. **Infer types** from schemas using `z.infer<>`
3. **Export types** from the types directory for consistency
4. **Use schemas** for runtime validation at boundaries

### Example Integration

```typescript
// schemas/user.schema.ts
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;

// types/user.types.ts
export type { User } from '../schemas/user.schema';

// Usage in API layer
import { userSchema } from '@/schemas';
import type { User } from '@/types';

// Validate incoming data
const validatedUser = userSchema.parse(requestBody);
```

## Validation Boundaries

Use schemas at these application boundaries:

### API Layer
- Validate incoming request bodies
- Validate API responses before sending
- Validate query parameters and headers

### Database Layer
- Validate data before database operations
- Transform and sanitize database records

### External Integrations
- Validate webhook payloads
- Validate third-party API responses
- Validate configuration data

## Error Handling

### Validation Errors

Zod provides detailed validation errors:

```typescript
const result = schemaUtils.safeValidate(commonSchemas.email, 'invalid');

if (!result.success) {
  // result.error contains detailed validation information
  console.log(result.error.issues); // Array of validation issues
}
```

### Custom Error Messages

```typescript
export const customSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
```

## Best Practices

1. **Reuse common schemas** - Leverage `commonSchemas` for standard validations
2. **Be specific** - Create focused schemas for specific use cases
3. **Document constraints** - Use descriptive error messages
4. **Validate early** - Validate at application boundaries
5. **Handle errors gracefully** - Use `safeParse()` for user input
6. **Keep schemas in sync** - Ensure types and schemas match

## Adding New Schemas

### 1. Create schema file

```typescript
// schemas/process.schema.ts
import { z } from 'zod';
import { commonSchemas } from './common.schema';

export const processSchema = z.object({
  id: commonSchemas.id,
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  createdAt: commonSchemas.timestamp,
  updatedAt: commonSchemas.timestamp,
});

export type Process = z.infer<typeof processSchema>;
```

### 2. Export from index

```typescript
// schemas/index.ts
export * from './process.schema';
```

### 3. Use in application

```typescript
import { processSchema } from '@/schemas';
import type { Process } from '@/types';
```

## Performance Considerations

- **Schema compilation** - Zod compiles schemas for better performance
- **Validation caching** - Cache validation results when appropriate
- **Selective validation** - Validate only what's necessary
- **Async validation** - Use async validation for external dependencies

## Security

- **Input sanitization** - Validate and sanitize all user input
- **Type safety** - Use schemas to prevent type confusion attacks
- **Data validation** - Validate data at trust boundaries
- **Error information** - Avoid leaking sensitive information in errors
