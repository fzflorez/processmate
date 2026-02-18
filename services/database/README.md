# Database Repository Pattern

This directory contains the repository pattern implementation for database operations in the ProcessMate application.

## Overview

The repository pattern provides a clean abstraction layer between the business logic and the database operations. It encapsulates all data access logic and provides a consistent interface for working with different entities.

## Architecture

### Base Repository (`base-repository.ts`)

The `BaseRepository` class provides generic CRUD operations and extends the `SupabaseService` to leverage existing service patterns:

- **Generic Type Support**: Fully typed with TypeScript generics for type safety
- **Service Result Pattern**: All operations return `ServiceResult<T>` for consistent error handling
- **Extensible**: Easy to extend with domain-specific methods
- **Helper Methods**: Includes common operations like `findByField`, `exists`, and `count`

#### Core Operations
- `create(data)` - Create a new record
- `findById(id)` - Find a record by ID
- `findMany(options)` - Find multiple records with filtering and pagination
- `update(id, data)` - Update an existing record
- `delete(id)` - Delete a record

#### Helper Methods
- `findByField(field, value)` - Find records by a specific field
- `findOneByField(field, value)` - Find one record by a specific field
- `exists(id)` - Check if a record exists
- `count(options)` - Count records with optional filters

### Repository Interface (`IRepository<T, TInsert, TUpdate>`)

Defines the contract that all repositories must implement, ensuring consistency across the codebase.

## Repository Examples

### User Repository (`repositories/user.repository.ts`)

Example implementation showing how to extend the base repository with domain-specific methods:

```typescript
export class UserRepository extends BaseRepository<"users", User, UserInsert, UserUpdate> {
  constructor() {
    super("users");
  }

  // Domain-specific methods
  async findByEmail(email: string): Promise<ServiceResult<User | null>> {
    return this.findOneByField("email", email);
  }

  async getActiveUsers(): Promise<ServiceResult<User[]>> {
    return this.findMany({
      orderBy: { column: "created_at", ascending: false },
    });
  }
}
```

### Document Repository (`repositories/document.repository.ts`)

Placeholder example showing how to implement repositories for custom entities. Adjust the types and table names based on your actual database schema.

## Usage Guidelines

### 1. Creating a New Repository

1. Define your entity types (Row, Insert, Update)
2. Extend `BaseRepository` with your table name and types
3. Add domain-specific methods as needed
4. Export a singleton instance

```typescript
export class MyEntityRepository extends BaseRepository<"my_table", MyEntity, MyEntityInsert, MyEntityUpdate> {
  constructor() {
    super("my_table");
  }

  async findByCustomField(value: string): Promise<ServiceResult<MyEntity[]>> {
    return this.findByField("custom_field", value);
  }
}

export const myEntityRepository = new MyEntityRepository();
```

### 2. Using Repositories in Services

```typescript
import { userRepository } from '@/services/database/repositories/user.repository';

class UserService {
  async getUserProfile(userId: string) {
    const userResult = await userRepository.findById(userId);
    
    if (!userResult.success) {
      return createErrorResult(userResult.error);
    }

    // Process user data...
    return createSuccessResult(processedData);
  }
}
```

### 3. Error Handling

All repository methods return `ServiceResult<T>`, which provides consistent error handling:

```typescript
const result = await userRepository.findById(userId);

if (result.success) {
  const user = result.data;
  // Use user data
} else {
  // Handle error
  console.error('Failed to get user:', result.error);
}
```

## Best Practices

### 1. **Type Safety**
- Always use proper TypeScript types for your entities
- Leverage the generic type system for compile-time safety
- Use the database types from `@/lib/supabase/types`

### 2. **Domain-Specific Methods**
- Add business logic methods to repositories rather than exposing generic CRUD
- Keep repositories focused on data access, not business logic
- Use descriptive method names that reflect business operations

### 3. **Error Handling**
- Always handle `ServiceResult` return values properly
- Don't throw exceptions from repositories; use the service result pattern
- Provide meaningful error messages for debugging

### 4. **Performance**
- Use appropriate filtering and pagination in `findMany` operations
- Consider adding specific query methods for complex operations
- Avoid N+1 query problems by using appropriate joins or batch operations

### 5. **Testing**
- Mock repositories in unit tests using the interface
- Test both success and error scenarios
- Use the service result pattern in test assertions

## Integration with Existing Services

The repository pattern complements the existing service layer:

- **Services** handle business logic and orchestration
- **Repositories** handle data access and entity management
- **Service Results** provide consistent error handling across both layers

## Future Enhancements

### Planned Improvements

1. **Advanced Query Support**
   - Custom select queries
   - Join operations
   - Full-text search
   - Aggregation queries

2. **Caching Layer**
   - Entity-level caching
   - Query result caching
   - Cache invalidation strategies

3. **Transaction Support**
   - Multi-repository transactions
   - Rollback capabilities
   - Transaction isolation levels

4. **Batch Operations**
   - Bulk insert/update/delete
   - Batch processing for large datasets
   - Performance optimizations

5. **Event System**
   - Repository events (create, update, delete)
   - Domain event publishing
   - Event-driven architecture support

## Migration Strategy

To migrate existing services to use the repository pattern:

1. **Phase 1**: Create repositories for existing entities
2. **Phase 2**: Update services to use repositories instead of direct Supabase calls
3. **Phase 3**: Add domain-specific methods to repositories
4. **Phase 4**: Remove redundant service methods
5. **Phase 5**: Add advanced features and optimizations

## File Structure

```
services/database/
├── base-repository.ts          # Base repository implementation
├── repositories/
│   ├── user.repository.ts      # User-specific repository
│   ├── document.repository.ts  # Document-specific repository (example)
│   └── ...                     # Other entity repositories
└── README.md                   # This documentation
```

This pattern provides a solid foundation for scalable, maintainable data access in your application while following TypeScript best practices and maintaining consistency with the existing service architecture.
