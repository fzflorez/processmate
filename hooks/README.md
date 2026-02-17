# Hooks Directory

This directory contains reusable React hooks for ProcessMate, providing common functionality and state management patterns.

## Purpose

The hooks library provides:

- **Reusable logic** - Common patterns extracted into custom hooks
- **Type safety** - Full TypeScript support with proper typing
- **Performance optimization** - Memoized callbacks and efficient state management
- **Developer experience** - Intuitive APIs with comprehensive documentation
- **Testing support** - Hooks designed for easy unit testing

## Available Hooks

### Async Hooks (`useAsync.ts`)

#### `useAsync`
Manages asynchronous operations with loading states and error handling.

```tsx
import { useAsync } from '@/hooks';

const { data, isLoading, error, execute, reset, status } = useAsync(
  async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  },
  {
    initialData: undefined,
    immediate: true,
    onSuccess: (data) => console.log('User loaded:', data),
    onError: (error) => console.error('Failed to load user:', error),
    onSettled: () => console.log('Operation completed'),
    resetOnChange: false,
  }
);
```

**Features:**
- Loading state management
- Error handling with callbacks
- Success/error/settled callbacks
- Immediate execution option
- State reset functionality
- Execution status tracking

#### `useAsyncSimple`
Simplified version for common async operations.

```tsx
const { data, loading, error, reload, reset, status } = useAsyncSimple(
  () => fetch('/api/users').then(res => res.json()),
  true // immediate execution
);
```

#### `useAsyncMulti`
Manages multiple async operations simultaneously.

```tsx
const {
  users: { data: users, loading: loadingUsers },
  posts: { data: posts, loading: loadingPosts }
} = useAsyncMulti({
  users: () => fetch('/api/users').then(res => res.json()),
  posts: () => fetch('/api/posts').then(res => res.json())
});
```

### Debounce Hooks (`useDebounce.ts`)

#### `useDebounce`
Debounces value changes with specified delay.

```tsx
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  // This will only run 300ms after searchTerm stops changing
  performSearch(debouncedSearchTerm);
}, [debouncedSearchTerm]);
```

#### `useDebounceCallback`
Debounces function execution.

```tsx
const debouncedSave = useDebounceCallback(
  (data: FormData) => {
    saveToDatabase(data);
  },
  { delay: 500, leading: false, trailing: true }
);

// Handle form changes
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
  debouncedSave(formData);
};
```

**Options:**
- `delay`: Debounce delay in milliseconds
- `leading`: Execute on leading edge
- `trailing`: Execute on trailing edge
- `maxWait`: Maximum time to wait before execution

#### `useDebouncedState`
Combines state management with debouncing.

```tsx
const [searchTerm, setSearchTerm, debouncedSearchTerm] = useDebouncedState('', 300);

// searchTerm updates immediately
// debouncedSearchTerm updates after 300ms of no changes
```

#### `useThrottleCallback`
Throttles function execution to specified interval.

```tsx
const throttledScroll = useThrottleCallback(
  () => {
    console.log('Scroll position:', window.scrollY);
  },
  100
);

useEffect(() => {
  window.addEventListener('scroll', throttledScroll);
  return () => window.removeEventListener('scroll', throttledScroll);
}, [throttledScroll]);
```

### Toggle Hooks (`useToggle.ts`)

#### `useToggle`
Manages boolean state with toggle utilities.

```tsx
const { 
  value: isOpen, 
  toggle, 
  setTrue, 
  setFalse, 
  setValue, 
  reset,
  initialValue 
} = useToggle({
  initial: false,
  onChange: (isOpen) => console.log('Modal is now:', isOpen),
  autoReset: 5000 // Auto-close after 5 seconds
});

return (
  <>
    <button onClick={toggle}>Toggle Modal</button>
    <button onClick={setTrue}>Open Modal</button>
    <button onClick={setFalse}>Close Modal</button>
    <button onClick={reset}>Reset to Initial</button>
    {isOpen && <Modal />}
  </>
);
```

**Features:**
- Toggle between true/false
- Set to specific value
- Reset to initial value
- Auto-reset with delay
- Change callbacks

#### `useToggleGroup`
Manages multiple related boolean states.

```tsx
const {
  values: { showHeader, showSidebar, showFooter },
  toggles: { toggleHeader, toggleSidebar, toggleFooter },
  setters: { setShowHeader, setShowSidebar, setShowFooter },
  settersTrue: { setShowHeader: setHeaderTrue },
  settersFalse: { setShowHeader: setHeaderFalse }
} = useToggleGroup({
  showHeader: true,
  showSidebar: false,
  showFooter: true
});
```

#### `useToggleSequence`
Cycles through a sequence of values.

```tsx
const { 
  value: step, 
  index, 
  next, 
  previous, 
  reset, 
  goTo,
  hasNext,
  hasPrevious 
} = useToggleSequence(
  ['step1', 'step2', 'step3'],
  { initial: 0, loop: true, onChange: (step, index) => console.log(`Step ${index}: ${step}`) }
);

return (
  <div>
    <p>Current step: {step}</p>
    <button onClick={next} disabled={!hasNext}>Next</button>
    <button onClick={previous} disabled={!hasPrevious}>Previous</button>
    <button onClick={reset}>Reset</button>
    <button onClick={() => goTo(1)}>Go to Step 2</button>
  </div>
);
```

## Best Practices

### 1. Hook Usage

- **Custom hooks for complex logic** - Extract component logic into reusable hooks
- **Single responsibility** - Each hook should have one clear purpose
- **Type safety** - Use TypeScript for all hook parameters and returns
- **Memoization** - Use `useCallback` and `useMemo` appropriately

### 2. Performance

- **Debounce user input** - Use `useDebounce` for search, form validation, etc.
- **Throttle scroll events** - Use `useThrottleCallback` for scroll, resize events
- **Optimize dependencies** - Only include necessary dependencies in useEffect/useCallback

### 3. Error Handling

- **Handle async errors** - Use error states from `useAsync`
- **Provide fallbacks** - Handle loading and error states gracefully
- **User feedback** - Show appropriate messages for different states

### 4. State Management

- **Local state first** - Use hooks for component-local state
- **Lift state when needed** - Move state up when shared by multiple components
- **Use appropriate patterns** - Choose the right hook for the use case

## Common Patterns

### Search with Debouncing

```tsx
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useDebouncedState('', 300);
  
  const { data: results, loading, error } = useAsync(
    async (searchQuery) => {
      if (!searchQuery) return [];
      const response = await fetch(`/api/search?q=${searchQuery}`);
      return response.json();
    },
    { immediate: false }
  );

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      // Execute search
    }
  }, [debouncedQuery]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <p>Searching...</p>}
      {error && <p>Error: {error.message}</p>}
      {results && (
        <ul>
          {results.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Modal with Toggle

```tsx
function ModalComponent() {
  const { value: isOpen, toggle, setFalse } = useToggle({
    initial: false,
    onChange: (open) => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }
  });

  return (
    <>
      <button onClick={toggle}>Open Modal</button>
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Modal Title</h2>
            <p>Modal content</p>
            <button onClick={setFalse}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### Data Fetching with Async Hook

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, execute } = useAsync(
    async (id) => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      return response.json();
    },
    {
      immediate: true,
      onSuccess: (user) => console.log('User loaded:', user),
      onError: (error) => console.error('Failed to load user:', error),
    }
  );

  const handleRefresh = () => {
    execute(userId);
  };

  if (loading) return <div>Loading user profile...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
}
```

## Testing Hooks

### Testing Custom Hooks

Use `@testing-library/react-hooks` for testing custom hooks:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useToggle } from '@/hooks';

describe('useToggle', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useToggle());
    
    expect(result.current.value).toBe(false);
  });

  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle({ initial: false }));
    
    act(() => {
      result.current.toggle();
    });
    
    expect(result.current.value).toBe(true);
  });

  it('should call onChange callback', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useToggle({ onChange }));
    
    act(() => {
      result.current.toggle();
    });
    
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

## Performance Considerations

### 1. Debouncing vs Throttling

- **Debounce** - Use for user input (search, form validation)
- **Throttle** - Use for continuous events (scroll, resize)

### 2. Memoization

- **useCallback** - For functions passed to child components
- **useMemo** - For expensive calculations
- **Dependencies** - Only include what's actually needed

### 3. Cleanup

- **Event listeners** - Remove on unmount
- **Timers** - Clear timeouts/intervals
- **Subscriptions** - Unsubscribe from external sources

## Adding New Hooks

### 1. Hook Structure

```tsx
// hooks/useMyHook.ts
import { useState, useCallback, useEffect } from 'react';

export interface UseMyHookOptions {
  // Configuration options
}

export interface UseMyHookReturn {
  // Return value types
}

export function useMyHook(options: UseMyHookOptions = {}): UseMyHookReturn {
  // Hook implementation
  return {
    // Return values
  };
}
```

### 2. Export from Index

```tsx
// hooks/index.ts
export { useMyHook } from './useMyHook';
export type { UseMyHookOptions, UseMyHookReturn } from './useMyHook';
```

### 3. Documentation

- **JSDoc comments** - Document parameters and returns
- **Usage examples** - Show common use cases
- **Type safety** - Provide proper TypeScript types
- **Testing** - Include test examples

## Troubleshooting

### Common Issues

1. **Stale closures** - Use proper dependencies in useEffect/useCallback
2. **Infinite loops** - Check dependency arrays
3. **Memory leaks** - Clean up timers and event listeners
4. **Performance** - Debounce/throttle expensive operations

### Debugging Tips

- **React DevTools** - Inspect hook values and dependencies
- **Console logging** - Add debug logs to track state changes
- **Breakpoints** - Use browser dev tools to debug hook logic
- **Unit tests** - Write tests to verify hook behavior

This hooks library provides a solid foundation for common React patterns in ProcessMate, ensuring consistency, performance, and maintainability across the application.
