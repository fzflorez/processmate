# Providers System

This directory contains the global providers composition system for ProcessMate, providing a centralized way to manage React context providers throughout the application.

## Purpose

The providers system provides:

- **Centralized provider management** - Single location for all React providers
- **Composition pattern** - Clean nesting and ordering of providers
- **Type safety** - Full TypeScript support for provider configurations
- **Development tools** - Built-in debugging and testing utilities
- **Performance optimization** - Efficient provider rendering and updates

## Architecture

```
providers/
├── index.tsx           # Main providers composition
├── query-provider.tsx  # TanStack Query provider (prepared)
├── README.md          # This documentation
└── [future providers] # Additional providers as needed
```

## Core Components

### Provider Composition (`index.tsx`)

The main providers system uses a composition pattern to combine multiple providers:

```typescript
// Providers are composed in order of nesting
const providers = [
  QueryProvider,      // Innermost provider
  AuthProvider,       // Wraps QueryProvider
  ThemeProvider,       // Wraps AuthProvider
  ConfigProvider,      // Outermost provider
];

// Single composed provider
export const Providers = composeProviders(...providers);
```

#### Usage in Application

```tsx
// app/layout.tsx or root component
import { Providers } from '@/providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

#### Composition Utility

The `composeProviders` function creates a single provider from multiple providers:

```typescript
function composeProviders(...providers) {
  return ({ children }) => {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
}
```

### Query Provider (`query-provider.tsx`)

Prepared structure for TanStack Query integration:

- **Placeholder implementation** - Ready for @tanstack/react-query installation
- **Configuration interface** - Type-safe provider configuration
- **Default settings** - Sensible defaults for caching and retry logic
- **Development tools** - React Query DevTools integration
- **Testing utilities** - Mock providers for unit testing

#### Installation

```bash
# Install TanStack Query
npm install @tanstack/react-query
# or
pnpm add @tanstack/react-query

# Optional: DevTools for development
npm install @tanstack/react-query-devtools
```

#### Usage After Installation

```tsx
// providers/index.tsx - uncomment the QueryProvider
import { QueryProvider } from './query-provider';

const providers = [
  QueryProvider,
  // ... other providers
];
```

```tsx
// Custom configuration
<QueryProvider 
  config={{
    defaultOptions: {
      queries: { staleTime: 10 * 60 * 1000 }
    }
  }}
>
  <App />
</QueryProvider>
```

## Provider Configuration

### Configuration Interfaces

Each provider supports type-safe configuration:

```typescript
// Query Provider Configuration
interface QueryProviderConfig {
  defaultOptions?: Record<string, unknown>;
  client?: unknown;
  enableDevTools?: boolean;
  devToolsPosition?: 'top' | 'bottom' | 'left' | 'right';
  devToolsInitialIsOpen?: boolean;
}
```

### Default Configurations

Sensible defaults are provided for all providers:

```typescript
export const defaultQueryConfig: QueryProviderConfig = {
  enableDevTools: process.env.NODE_ENV === 'development',
  devToolsPosition: 'bottom',
  devToolsInitialIsOpen: false,
  defaultOptions: {
    // Applied when TanStack Query is installed
  },
};
```

## Provider Patterns

### 1. Basic Provider Structure

```typescript
// providers/my-provider.tsx
import React, { createContext, useContext, ReactNode } from 'react';

interface MyContextValue {
  // Your context value
}

const MyContext = createContext<MyContextValue | null>(null);

export const MyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = {
    // Provider value
  };

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

### 2. Configurable Provider

```typescript
// providers/configurable-provider.tsx
interface ConfigurableProviderConfig {
  apiUrl?: string;
  timeout?: number;
  enableDebug?: boolean;
}

const defaultConfig: ConfigurableProviderConfig = {
  timeout: 5000,
  enableDebug: false,
};

export const ConfigurableProvider: React.FC<{
  children: ReactNode;
  config?: ConfigurableProviderConfig;
}> = ({ children, config }) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  // Use finalConfig in provider logic
  return (
    <SomeContext.Provider value={{ config: finalConfig }}>
      {children}
    </SomeContext.Provider>
  );
};
```

### 3. Provider with Side Effects

```typescript
// providers/side-effect-provider.tsx
export const SideEffectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Initialize services
    const cleanup = initializeServices();
    
    return cleanup;
  }, []);

  return (
    <SomeContext.Provider value={{}}>
      {children}
    </SomeContext.Provider>
  );
};
```

## Adding New Providers

### 1. Create Provider File

```typescript
// providers/new-provider.tsx
import React, { createContext, useContext, ReactNode } from 'react';

interface NewProviderConfig {
  // Configuration options
}

interface NewContextValue {
  // Context value type
}

const NewContext = createContext<NewContextValue | null>(null);

export const NewProvider: React.FC<{
  children: ReactNode;
  config?: NewProviderConfig;
}> = ({ children, config }) => {
  const value: NewContextValue = {
    // Initialize context value
  };

  return (
    <NewContext.Provider value={value}>
      {children}
    </NewContext.Provider>
  );
};

export const useNewContext = () => {
  const context = useContext(NewContext);
  if (!context) {
    throw new Error('useNewContext must be used within NewProvider');
  }
  return context;
};
```

### 2. Add to Composition

```typescript
// providers/index.tsx
import { NewProvider } from './new-provider';

const providers: Array<React.FC<{ children: ReactNode }>> = [
  QueryProvider,
  NewProvider,      // Add new provider
  AuthProvider,
  // ... other providers
];
```

### 3. Export Hook

```typescript
// providers/index.tsx
export { useNewContext } from './new-provider';
```

## Testing with Providers

### 1. Test Wrapper

```typescript
// utils/test-wrapper.tsx
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const TestWrapper: React.FC<{
  children: ReactNode;
  queryClient?: QueryClient;
}> = ({ children, queryClient = createTestQueryClient() }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

### 2. Component Testing

```typescript
// __tests__/my-component.test.tsx
import { render, screen } from '@testing-library/react';
import { TestWrapper } from '@/utils/test-wrapper';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(
      <TestWrapper>
        <MyComponent />
      </TestWrapper>
    );
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### 3. Provider Testing

```typescript
// __tests__/providers/my-provider.test.tsx
import { renderHook } from '@testing-library/react';
import { MyProvider, useMyContext } from '@/providers/my-provider';

describe('MyProvider', () => {
  it('provides context value', () => {
    const wrapper = ({ children }) => (
      <MyProvider>{children}</MyProvider>
    );

    const { result } = renderHook(() => useMyContext(), { wrapper });
    
    expect(result.current).toBeDefined();
  });
});
```

## Performance Considerations

### 1. Provider Ordering

Place frequently changing providers deeper in the composition:

```typescript
// Good: Frequently changing providers are innermost
const providers = [
  QueryProvider,      // Changes often (data)
  ThemeProvider,       // Changes occasionally
  ConfigProvider,      // Changes rarely
];
```

### 2. Memoization

Use `useMemo` for expensive context values:

```typescript
export const ExpensiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useMemo(() => {
    return expensiveCalculation();
  }, []); // Empty dependency array if value never changes

  return (
    <ExpensiveContext.Provider value={value}>
      {children}
    </ExpensiveContext.Provider>
  );
};
```

### 3. Selective Context

Split large contexts into smaller, focused contexts:

```typescript
// Instead of one large context
const AppContext = createContext<{
  user: User;
  theme: Theme;
  config: Config;
  notifications: Notification[];
}>();

// Use multiple focused contexts
const UserContext = createContext<User>();
const ThemeContext = createContext<Theme>();
const ConfigContext = createContext<Config>();
```

## Development Tools

### 1. Provider Debugger

```typescript
// providers/debug-provider.tsx
export const ProviderDebugger: React.FC<{ children: ReactNode }> = ({ children }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Provider tree rendered:', {
      timestamp: new Date().toISOString(),
      providers: ['QueryProvider', 'AuthProvider', 'ThemeProvider'],
    });
  }
  
  return <>{children}</>;
};
```

### 2. Context DevTools

Use React DevTools to inspect context values:

1. Install React DevTools browser extension
2. Open DevTools and go to "Components" tab
3. Select a component to see its context providers
4. Expand context providers to inspect current values

## Best Practices

### 1. Provider Design

- **Single responsibility** - Each provider should have one clear purpose
- **Minimal context** - Only provide what's necessary
- **Type safety** - Use TypeScript for all context values
- **Default values** - Provide sensible defaults when possible

### 2. Context Usage

- **Custom hooks** - Create custom hooks for context access
- **Error boundaries** - Handle errors gracefully in providers
- **Performance** - Memoize context values when needed
- **Testing** - Make providers testable with mock values

### 3. Composition

- **Logical ordering** - Place providers in logical dependency order
- **Documentation** - Document provider dependencies and ordering
- **Flexibility** - Allow providers to be used independently
- **Configuration** - Support both default and custom configurations

## Migration Guide

### From Individual Providers

If you have individual providers scattered throughout your app:

```tsx
// Before
<AuthProvider>
  <QueryProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </QueryProvider>
</AuthProvider>

// After
<Providers>
  <App />
</Providers>
```

### Adding to Existing Apps

1. Create the providers directory structure
2. Move existing providers to the providers directory
3. Update imports to use the centralized providers
4. Add providers to the composition array
5. Test thoroughly to ensure no context is lost

## Troubleshooting

### Common Issues

1. **Context is undefined** - Ensure provider is in the composition tree
2. **Provider not updating** - Check context value memoization
3. **Performance issues** - Review provider ordering and context size
4. **Type errors** - Verify TypeScript types for context values

### Debugging Steps

1. Check provider composition order
2. Verify context values with React DevTools
3. Test providers individually
4. Check for missing error boundaries
5. Review provider dependencies

This providers system provides a solid foundation for managing React contexts in ProcessMate, ensuring consistency, type safety, and maintainability across the entire application.
