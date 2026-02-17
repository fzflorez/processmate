/**
 * useAsync Hook
 * Provides a reusable way to handle asynchronous operations with loading states and error handling
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { AsyncStatus } from "@/types";

/**
 * UseAsync hook options
 */
export interface UseAsyncOptions<T> {
  /**
   * Initial data value
   */
  initialData?: T;

  /**
   * Whether to execute the async function immediately on mount
   */
  immediate?: boolean;

  /**
   * Function to call on success
   */
  onSuccess?: (data: T) => void;

  /**
   * Function to call on error
   */
  onError?: (error: Error) => void;

  /**
   * Function to call on settle (success or error)
   */
  onSettled?: () => void;

  /**
   * Reset state when the async function changes
   */
  resetOnChange?: boolean;
}

/**
 * UseAsync hook return value
 */
export interface UseAsyncReturn<T> {
  /**
   * Current data value
   */
  data: T | undefined;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Current status
   */
  status: AsyncStatus;

  /**
   * Execute the async function
   */
  execute: (...args: unknown[]) => Promise<T>;

  /**
   * Reset the state to initial values
   */
  reset: () => void;

  /**
   * Whether the hook has been executed at least once
   */
  hasExecuted: boolean;
}

/**
 * useAsync hook for managing asynchronous operations
 *
 * @param asyncFunction - The async function to execute
 * @param options - Configuration options
 * @returns Hook return value with state and controls
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsync(
 *   async (id: string) => {
 *     const response = await fetch(`/api/users/${id}`);
 *     return response.json();
 *   },
 *   {
 *     immediate: true,
 *     onSuccess: (data) => console.log('User loaded:', data),
 *     onError: (error) => console.error('Failed to load user:', error)
 *   }
 * );
 * ```
 */
export function useAsync<T>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options: UseAsyncOptions<T> = {},
): UseAsyncReturn<T> {
  const {
    initialData,
    immediate = false,
    onSuccess,
    onError,
    onSettled,
    resetOnChange = false,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [hasExecuted, setHasExecuted] = useState(false);

  // Track if the component is mounted
  const isMountedRef = useRef(true);

  // Track the current async function for comparison
  const asyncFunctionRef = useRef(asyncFunction);
  asyncFunctionRef.current = asyncFunction;

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
    setStatus("idle");
    setHasExecuted(false);
  }, [initialData]);

  // Reset state when async function changes (if enabled)
  useEffect(() => {
    if (resetOnChange) {
      reset();
    }
  }, [asyncFunction, resetOnChange, reset]);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T> => {
      try {
        setIsLoading(true);
        setError(null);
        setStatus("loading");
        setHasExecuted(true);

        const result = await asyncFunctionRef.current(...args);

        if (isMountedRef.current) {
          setData(result);
          setError(null);
          setStatus("success");
          onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");

        if (isMountedRef.current) {
          setError(error);
          setStatus("error");
          onError?.(error);
        }

        throw error;
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          onSettled?.();
        }
      }
    },
    [onSuccess, onError, onSettled],
  );

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    isLoading,
    error,
    status,
    execute,
    reset,
    hasExecuted,
  };
}

/**
 * Simplified version of useAsync for common cases
 *
 * @param asyncFunction - The async function to execute
 * @param immediate - Whether to execute immediately
 * @returns Simplified hook return value
 *
 * @example
 * ```tsx
 * const { data, loading, error, reload } = useAsyncSimple(
 *   () => fetch('/api/users').then(res => res.json()),
 *   true
 * );
 * ```
 */
export function useAsyncSimple<T>(
  asyncFunction: () => Promise<T>,
  immediate = false,
) {
  const { data, isLoading, error, execute, reset, status } = useAsync(
    asyncFunction,
    {
      immediate,
    },
  );

  return {
    data,
    loading: isLoading,
    error,
    reload: execute,
    reset,
    status,
  };
}

/**
 * Hook for managing multiple async operations
 *
 * @param asyncFunctions - Object containing async functions
 * @param options - Configuration options
 * @returns Object containing states and execute functions for each async operation
 *
 * @example
 * ```tsx
 * const {
 *   users: { data: users, loading: loadingUsers },
 *   posts: { data: posts, loading: loadingPosts }
 * } = useAsyncMulti({
 *   users: () => fetch('/api/users').then(res => res.json()),
 *   posts: () => fetch('/api/posts').then(res => res.json())
 * });
 * ```
 */
export function useAsyncMulti(
  asyncFunctions: Record<string, (...args: unknown[]) => Promise<unknown>>,
  options: UseAsyncOptions<unknown> = {},
) {
  const results = {} as Record<
    keyof typeof asyncFunctions,
    UseAsyncReturn<unknown>
  >;

  for (const [key, asyncFunction] of Object.entries(asyncFunctions)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useAsync(asyncFunction, options);
  }

  return results;
}
