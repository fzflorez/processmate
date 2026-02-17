# Supabase Infrastructure

This document explains the Supabase infrastructure implementation in ProcessMate, following centralized architecture patterns.

## Overview

ProcessMate implements a secure, scalable Supabase integration that:
- **Separates concerns** between client and server operations
- **Prevents direct SDK usage** outside of service layers
- **Follows service result pattern** for consistent error handling
- **Maintains security** through proper key management

## Architecture Components

### Client Configuration (`/lib/supabase/client.ts`)

Browser-side Supabase client with public anon key:

```typescript
import { supabase, getCurrentUser, signInWithEmail } from '@/lib/supabase/client';

// Client-side authentication
const user = await getCurrentUser();
const session = await signInWithEmail(email, password);

// Real-time subscriptions
const subscription = supabase
  .channel('table-changes')
  .on('postgres_changes', { event: 'INSERT', table: 'workflows' }, callback)
  .subscribe();
```

**Features:**
- **Public Anon Key** - Safe for client-side usage
- **Authentication Helpers** - Sign in, sign up, password reset
- **Real-time Subscriptions** - Live data updates
- **Session Management** - Persistent auth state

### Server Configuration (`/lib/supabase/server.ts`)

Server-side Supabase client with service role key:

```typescript
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';

// Server components
const supabase = supabaseServer();
const { data } = await supabase.from('workflows').select('*');

// Admin operations (bypasses RLS)
const user = await supabaseAdmin.getUserById(userId);
const stats = await supabaseAdmin.getWorkflowStats();
```

**Features:**
- **Service Role Key** - Elevated privileges for server operations
- **Caching** - React cache for optimal performance
- **Admin Operations** - Bypass RLS for trusted operations
- **Server Components** - Next.js App Router integration

### Type Definitions (`/lib/supabase/types.ts`)

Comprehensive database type definitions:

```typescript
// Generated types for all tables
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

// Real-time payload types
type RealtimePayload<T> = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: T;
  new: TableRow<T> | null;
  old: TableRow<T> | null;
};
```

**Features:**
- **Full Type Coverage** - All tables and operations
- **Utility Types** - Common patterns for easier usage
- **Real-time Types** - Subscription payload definitions
- **Enum Support** - Database enum mappings

## Service Layer (`/services/database/supabase-service.ts`)

Centralized service wrapper preventing direct SDK usage:

```typescript
import { userService, workflowService } from '@/services/database/supabase-service';

// Service pattern with result handling
const userResult = await userService.getUserById(userId);
if (userResult.isFailure()) {
  console.error(userResult.error);
  return;
}

const user = userResult.getData();
```

### Service Classes

#### UserService
- User CRUD operations
- Email-based lookups
- User listing with pagination

#### ProfileService
- Profile management
- Upsert operations
- User profile relationships

#### WorkflowService
- Workflow CRUD operations
- User-specific workflows
- Active workflow filtering

#### WorkflowExecutionService
- Execution tracking
- Status management
- Performance analytics

#### PromptService
- Prompt management
- Public/private access
- Search functionality

#### ApiKeyService
- API key management
- Usage tracking
- Security controls

## Usage Patterns

### 1. Client-Side Operations

```typescript
// Authentication
import { signInWithEmail, getCurrentUser } from '@/lib/supabase/client';

async function handleLogin(email: string, password: string) {
  try {
    const { user, session } = await signInWithEmail(email, password);
    // Update UI state
  } catch (error) {
    // Handle error
  }
}

// Real-time updates
import { subscribeToTable } from '@/lib/supabase/client';

function WorkflowList() {
  useEffect(() => {
    const subscription = subscribeToTable('workflows', 'INSERT', (payload) => {
      // Update UI with new workflow
    });

    return () => subscription.unsubscribe();
  }, []);
}
```

### 2. Server-Side Operations

```typescript
// Server components
import { supabaseServer } from '@/lib/supabase/server';

async function WorkflowPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', params.id)
    .single();

  return <WorkflowView workflow={workflow} />;
}

// API routes
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { userId } = await request.json();
  
  // Admin operation bypassing RLS
  const user = await supabaseAdmin.getUserById(userId);
  return Response.json({ user });
}
```

### 3. Service Layer Usage

```typescript
// Feature modules
import { workflowService, promptService } from '@/services/database/supabase-service';

export async function createWorkflow(data: WorkflowInsert) {
  // Service handles all database operations
  const result = await workflowService.createWorkflow(data);
  
  if (result.isFailure()) {
    throw new Error(result.error.message);
  }
  
  return result.getData();
}

export async function searchPrompts(query: string) {
  const result = await promptService.searchPrompts(query);
  return result.isSuccess() ? result.getData() : [];
}
```

## Security Best Practices

### 1. Key Management

```typescript
// Environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

// Client-side (public key)
export const supabase = createClient(url, anonKey);

// Server-side (service role key)
export const supabaseServer = () => createClient(url, serviceKey);
```

### 2. Row Level Security (RLS)

```sql
-- Example RLS policy
CREATE POLICY "Users can view own workflows" ON workflows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows" ON workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows" ON workflows
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. Input Validation

```typescript
// Service layer validation
async createWorkflow(data: WorkflowInsert) {
  // Validate input before database operation
  if (!data.name || data.name.length > 100) {
    return ServiceResult.failure(
      ServiceError.validationError('Invalid workflow name')
    );
  }
  
  return this.create('workflows', data);
}
```

### 4. Error Handling

```typescript
// Consistent error handling
try {
  const result = await userService.createUser(userData);
  return result;
} catch (error) {
  return ServiceResult.failure(
    ServiceError.databaseError('User creation failed')
  );
}
```

## Environment Setup

### 1. Required Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Schema

```sql
-- Example tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Type Generation

```bash
# Generate types from database
supabase gen types typescript --local > lib/supabase/types.ts
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Server-side caching
export const supabaseServer = cache(createSupabaseClient);

// Query optimization
const { data } = await supabase
  .from('workflows')
  .select('id, name, created_at') // Only select needed columns
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(10);
```

### 2. Real-time Subscriptions

```typescript
// Efficient subscriptions
const subscription = supabase
  .channel('workflow-updates')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'workflows',
      filter: `user_id=eq.${userId}` // Filter server-side
    },
    handleWorkflowChange
  )
  .subscribe();
```

### 3. Connection Pooling

```typescript
// Reuse connections
const supabase = supabaseServer(); // Cached instance

// Batch operations
const { data } = await supabase
  .from('workflow_executions')
  .upsert(executions); // Batch insert/update
```

## Testing Strategy

### 1. Unit Tests

```typescript
// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: mockUser, error: null }))
        }))
      }))
    }))
  }
}));

// Test service layer
test('userService.getUserById returns user', async () => {
  const result = await userService.getUserById('user-id');
  expect(result.isSuccess()).toBe(true);
  expect(result.getData()).toEqual(mockUser);
});
```

### 2. Integration Tests

```typescript
// Test with real Supabase
import { createClient } from '@supabase/supabase-js';

const testClient = createClient(testUrl, testKey);

test('workflow service integration', async () => {
  const service = new WorkflowService();
  service.client = testClient;
  
  const result = await service.createWorkflow(testData);
  expect(result.isSuccess()).toBe(true);
});
```

## Monitoring and Debugging

### 1. Logging

```typescript
// Service-level logging
protected async create<T>(table: T, data: any) {
  console.log(`Creating ${String(table)}:`, data);
  
  try {
    const result = await this.client.from(table).insert(data);
    console.log(`Created ${String(table)} successfully:`, result.data);
    return result;
  } catch (error) {
    console.error(`Failed to create ${String(table)}:`, error);
    throw error;
  }
}
```

### 2. Error Tracking

```typescript
// Centralized error handling
export class SupabaseService {
  protected handleError(error: any, operation: string) {
    const serviceError = ServiceError.databaseError(
      `${operation} failed: ${error.message}`
    );
    
    // Track error
    errorTracker.track(serviceError);
    
    return ServiceResult.failure(serviceError);
  }
}
```

### 3. Performance Monitoring

```typescript
// Query performance tracking
async list<T>(table: T, options: ListOptions = {}) {
  const startTime = performance.now();
  
  try {
    const result = await this.client.from(table).select('*');
    const duration = performance.now() - startTime;
    
    // Track slow queries
    if (duration > 1000) {
      console.warn(`Slow query: ${String(table)} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`Query failed after ${duration}ms:`, error);
    throw error;
  }
}
```

## Migration Strategy

### 1. Database Migrations

```sql
-- Migration files
-- migrations/001_create_users.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  -- ...
);

-- migrations/002_add_profiles.sql
ALTER TABLE users ADD COLUMN profile_id UUID;
```

### 2. Type Updates

```bash
# Regenerate types after schema changes
supabase gen types typescript --local > lib/supabase/types.ts
```

### 3. Service Updates

```typescript
// Update services to handle new schema
class UserService extends SupabaseService {
  async createUserWithProfile(userData: UserInsert, profileData: ProfileInsert) {
    // Handle new relationships
    const user = await this.create('users', userData);
    if (user.isSuccess()) {
      const profile = await this.create('profiles', {
        ...profileData,
        user_id: user.getData().id
      });
      return profile;
    }
    return user;
  }
}
```

This Supabase infrastructure provides a secure, scalable foundation for ProcessMate's data layer while maintaining clean architecture patterns and comprehensive error handling.
