"use client";

/**
 * TanStack Query Provider
 * Provides React Query functionality for data fetching, caching, and state management
 *
 * Note: This file is prepared but requires @tanstack/react-query to be installed
 * Install with: npm install @tanstack/react-query
 * or: pnpm add @tanstack/react-query
 */

import React, { ReactNode } from "react";

// Uncomment when TanStack Query is installed
// import { QueryClient, QueryClientProvider, QueryClientConfig } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Query Provider Configuration Interface
 */
export interface QueryProviderConfig {
  /**
   * Default query options
   */
  defaultOptions?: Record<string, unknown>;

  /**
   * Custom QueryClient instance
   */
  client?: unknown;

  /**
   * Enable React Query DevTools in development
   */
  enableDevTools?: boolean;

  /**
   * DevTools initial position
   */
  devToolsPosition?: "top" | "bottom" | "left" | "right";

  /**
   * DevTools initial isOpen state
   */
  devToolsInitialIsOpen?: boolean;
}

/**
 * Default Query Client Configuration
 */
export const defaultQueryConfig: QueryProviderConfig = {
  enableDevTools: process.env.NODE_ENV === "development",
  devToolsPosition: "bottom",
  devToolsInitialIsOpen: false,

  // Default options will be applied when TanStack Query is installed
  defaultOptions: {
    // queries: {
    //   staleTime: 5 * 60 * 1000, // 5 minutes
    //   cacheTime: 10 * 60 * 1000, // 10 minutes
    //   retry: (failureCount, error) => {
    //     // Don't retry on 4xx errors
    //     if (error && typeof error === 'object' && 'status' in error) {
    //       const status = error.status as number;
    //       if (status >= 400 && status < 500) {
    //         return false;
    //       }
    //     }
    //     return failureCount < 3;
    //   },
    //   refetchOnWindowFocus: false,
    //   refetchOnReconnect: true,
    //   retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    // },
    // mutations: {
    //   retry: 1,
    //   retryDelay: 1000,
    // },
  },
};

/**
 * Query Client Instance
 * Will be created when TanStack Query is installed
 */
const queryClient: unknown = null;

/**
 * Create or get Query Client instance
 */
export const getQueryClient = (): unknown => {
  return queryClient;
};

/**
 * Query Provider Component
 *
 * Usage:
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 *
 * With custom config:
 * ```tsx
 * <QueryProvider
 *   config={{
 *     defaultOptions: {
 *       queries: { staleTime: 10 * 60 * 1000 }
 *     }
 *   }}
 * >
 *   <App />
 * </QueryProvider>
 * ```
 */
export const QueryProvider: React.FC<{
  children: ReactNode;
  config?: QueryProviderConfig;
}> = ({ children }) => {
  // This is a placeholder implementation
  // Uncomment when TanStack Query is installed
  /*
  const client = getQueryClient(config);
  const finalConfig = { ...defaultQueryConfig, ...config };
  
  return (
    <QueryClientProvider client={client}>
      {children}
      {finalConfig.enableDevTools && process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={finalConfig.devToolsInitialIsOpen}
          position={finalConfig.devToolsPosition}
        />
      )}
    </QueryClientProvider>
  );
  */

  // Placeholder implementation - passes children through
  console.warn(
    "QueryProvider is a placeholder. Install @tanstack/react-query to enable functionality.",
  );
  return <>{children}</>;
};

/**
 * Query Hooks
 * These will be implemented when TanStack Query is installed
 */

// export const useQuery = (...args: Parameters<typeof import('@tanstack/react-query').useQuery>) => {
//   return import('@tanstack/react-query').then(({ useQuery }) => useQuery(...args));
// };

// export const useMutation = (...args: Parameters<typeof import('@tanstack/react-query').useMutation>) => {
//   return import('@tanstack/react-query').then(({ useMutation }) => useMutation(...args));
// };

// export const useInfiniteQuery = (...args: Parameters<typeof import('@tanstack/react-query').useInfiniteQuery>) => {
//   return import('@tanstack/react-query').then(({ useInfiniteQuery }) => useInfiniteQuery(...args));
// };

// export const useQueryClient = () => {
//   return import('@tanstack/react-query').then(({ useQueryClient }) => useQueryClient());
// };

/**
 * Query Utilities
 * Helper functions for common query patterns
 */

// export const createQueryKey = (entity: string, params?: Record<string, unknown>) => {
//   return params ? [entity, params] : [entity];
// };

// export const createMutationKey = (action: string, entity: string) => {
//   return [action, entity];
// };

// export const invalidateQueries = (queryClient: any, key: string[]) => {
//   queryClient.invalidateQueries({ queryKey: key });
// };

// export const setQueryData = (queryClient: any, key: string[], data: unknown) => {
//   queryClient.setQueryData(key, data);
// };

// export const getQueryData = (queryClient: any, key: string[]) => {
//   return queryClient.getQueryData(key);
// };

/**
 * Query Configuration Presets
 * Common configurations for different use cases
 */

// export const queryPresets = {
//   // For data that changes rarely
//   static: {
//     staleTime: 60 * 60 * 1000, // 1 hour
//     cacheTime: 2 * 60 * 60 * 1000, // 2 hours
//     refetchOnWindowFocus: false,
//   },

//   // For user-specific data
//   user: {
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     cacheTime: 10 * 60 * 1000, // 10 minutes
//     refetchOnWindowFocus: true,
//   },

//   // For real-time data
//   realtime: {
//     staleTime: 0,
//     cacheTime: 0,
//     refetchInterval: 30 * 1000, // 30 seconds
//   },

//   // For data that should be fresh
//   fresh: {
//     staleTime: 0,
//     cacheTime: 5 * 60 * 1000, // 5 minutes
//     refetchOnWindowFocus: true,
//   },
// };

/**
 * Error Handling Utilities
 * Helper functions for handling query errors
 */

// export const isQueryError = (error: unknown): error is Error => {
//   return error instanceof Error;
// };

// export const getQueryErrorMessage = (error: unknown): string => {
//   if (isQueryError(error)) {
//     return error.message;
//   }
//   return 'An unknown error occurred';
// };

// export const handleQueryError = (error: unknown, onError?: (message: string) => void) => {
//   const message = getQueryErrorMessage(error);
//   console.error('Query error:', error);
//   onError?.(message);
// };

/**
 * Testing Utilities
 * Helper functions for testing components that use queries
 */

// export const createMockQueryClient = () => {
//   return new QueryClient({
//     defaultOptions: {
//       queries: { retry: false },
//       mutations: { retry: false },
//     },
//   });
// };

// export const createQueryWrapper = (client?: any) => {
//   const queryClient = client || createMockQueryClient();

//   return ({ children }: { children: ReactNode }) => (
//     <QueryClientProvider client={queryClient}>
//       {children}
//     </QueryClientProvider>
//   );
// };

/**
 * Performance Monitoring
 * Utilities for monitoring query performance
 */

// export const queryPerformanceLogger = {
//   logQueryStart: (queryKey: string[]) => {
//     console.log(`[Query] Starting: ${queryKey.join('.')}`);
//   },

//   logQuerySuccess: (queryKey: string[], duration: number) => {
//     console.log(`[Query] Success: ${queryKey.join('.')} (${duration}ms)`);
//   },

//   logQueryError: (queryKey: string[], error: unknown, duration: number) => {
//     console.error(`[Query] Error: ${queryKey.join('.')} (${duration}ms)`, error);
//   },
// };

export default QueryProvider;
