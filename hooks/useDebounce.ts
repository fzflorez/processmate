/**
 * useDebounce Hook
 * Provides debouncing functionality for values and functions
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useDebounce hook options
 */
export interface UseDebounceOptions {
  /**
   * Debounce delay in milliseconds
   */
  delay: number;

  /**
   * Whether to debounce on leading edge
   */
  leading?: boolean;

  /**
   * Whether to debounce on trailing edge
   */
  trailing?: boolean;

  /**
   * Maximum time to wait before execution
   */
  maxWait?: number;
}

/**
 * useDebounce hook for debouncing values
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // This will only run 300ms after searchTerm stops changing
 *   performSearch(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebounceCallback hook for debouncing functions
 *
 * @param callback - The function to debounce
 * @param options - Debounce options
 * @returns Debounced function
 *
 * @example
 * ```tsx
 * const debouncedSave = useDebounceCallback(
 *   (data: FormData) => {
 *     saveToDatabase(data);
 *   },
 *   { delay: 500 }
 * );
 *
 * // Handle form changes
 * const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   setFormData({ ...formData, [e.target.name]: e.target.value });
 *   debouncedSave(formData);
 * };
 * ```
 */
export function useDebounceCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  options: UseDebounceOptions,
): T {
  const { delay, leading = false, trailing = true, maxWait } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const resultRef = useRef<unknown>(undefined);
  const callbackRef = useRef(callback);

  // Update ref in effect to avoid render-time access
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const invokeFunc = useCallback(
    (...args: unknown[]) => {
      const time = Date.now();
      const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

      lastCallTimeRef.current = time;

      // Leading edge execution
      if (
        leading &&
        (timeSinceLastInvoke >= delay || timeSinceLastInvoke < 0)
      ) {
        lastInvokeTimeRef.current = time;
        resultRef.current = callbackRef.current(...args);
      }

      // Trailing edge execution
      if (trailing) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          const timeSinceLastCall = Date.now() - lastCallTimeRef.current;

          if (timeSinceLastCall >= delay) {
            lastInvokeTimeRef.current = Date.now();
            resultRef.current = callbackRef.current(...args);
          }
        }, delay);
      }

      return resultRef.current;
    },
    [delay, leading, trailing],
  );

  const debouncedCallback = useCallback(
    (...args: unknown[]) => {
      // Clear existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }

      // Set max wait timeout if specified
      if (maxWait) {
        maxTimeoutRef.current = setTimeout(() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          lastInvokeTimeRef.current = Date.now();
          resultRef.current = callbackRef.current(...args);
        }, maxWait);
      }

      return invokeFunc(...args);
    },
    [invokeFunc, maxWait],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
}

/**
 * useDebouncedState hook for debounced state management
 *
 * @param initialValue - Initial state value
 * @param delay - Debounce delay in milliseconds
 * @returns [state, setState, debouncedState]
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm, debouncedSearchTerm] = useDebouncedState('', 300);
 *
 * // searchTerm updates immediately
 * // debouncedSearchTerm updates after 300ms of no changes
 * ```
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number,
): [T, (value: T) => void, T] {
  const [state, setState] = useState<T>(initialValue);
  const debouncedState = useDebounce(state, delay);

  return [state, setState, debouncedState];
}

/**
 * useThrottleCallback hook for throttling functions
 *
 * @param callback - The function to throttle
 * @param delay - Throttle delay in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```tsx
 * const throttledScroll = useThrottleCallback(
 *   () => {
 *     console.log('Scroll position:', window.scrollY);
 *   },
 *   100
 * );
 *
 * useEffect(() => {
 *   window.addEventListener('scroll', throttledScroll);
 *   return () => window.removeEventListener('scroll', throttledScroll);
 * }, [throttledScroll]);
 * ```
 */
export function useThrottleCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update ref in effect to avoid render-time access
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: unknown[]) => {
      const now = Date.now();

      if (now - lastRunRef.current >= delay) {
        lastRunRef.current = now;
        return callbackRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            lastRunRef.current = Date.now();
            return callbackRef.current(...args);
          },
          delay - (now - lastRunRef.current),
        );
      }
    },
    [delay],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback as T;
}
