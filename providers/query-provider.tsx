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
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/**
 * Query Provider Configuration Interface
 */
export interface QueryProviderConfig {
  /**
   * Default query options
   */
  defaultOptions?: {
    queries?: {
      staleTime?: number;
      gcTime?: number;
      retry?:
        | number
        | boolean
        | ((failureCount: number, error: unknown) => boolean);
      refetchOnWindowFocus?: boolean;
      refetchOnReconnect?: boolean;
      retryDelay?: number | ((attemptIndex: number) => number);
    };
    mutations?: {
      retry?:
        | number
        | boolean
        | ((failureCount: number, error: unknown) => boolean);
      retryDelay?: number | ((attemptIndex: number) => number);
    };
  };

  /**
   * Custom QueryClient instance
   */
  client?: QueryClient;

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

  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === "object" && "status" in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
};

/**
 * Create Query Client instance
 */
const createQueryClient = (config?: QueryProviderConfig): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      ...defaultQueryConfig.defaultOptions,
      ...config?.defaultOptions,
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Global query error handling
        console.error("Query error:", error, "Query:", query);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _context, _mutation) => {
        // Global mutation error handling
        console.error("Mutation error:", error, "Variables:", variables);
      },
    }),
  });
};

/**
 * Query Client Instance
 * Singleton pattern to ensure only one instance is created
 */
let queryClient: QueryClient | null = null;

/**
 * Create or get Query Client instance
 */
export const getQueryClient = (config?: QueryProviderConfig): QueryClient => {
  if (!queryClient) {
    queryClient = createQueryClient(config);
  }
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
}> = ({ children, config }) => {
  const client = config?.client || getQueryClient(config);
  const finalConfig = { ...defaultQueryConfig, ...config };

  return (
    <QueryClientProvider client={client}>
      {children}
      {finalConfig.enableDevTools && process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={finalConfig.devToolsInitialIsOpen}
          position={finalConfig.devToolsPosition}
        />
      )}
    </QueryClientProvider>
  );
};

/**
 * Query Hooks
 */

import { useQueryClient as useReactQueryClient } from "@tanstack/react-query";

// Re-export TanStack Query hooks for convenience
export { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";

export const useQueryClient = () => {
  return useReactQueryClient();
};

/**
 * Query Utilities
 * Helper functions for common query patterns
 */

export const createQueryKey = (
  entity: string,
  params?: Record<string, unknown>,
) => {
  return params ? [entity, params] : [entity];
};

export const createMutationKey = (action: string, entity: string) => {
  return [action, entity];
};

export const invalidateQueries = (queryClient: QueryClient, key: string[]) => {
  queryClient.invalidateQueries({ queryKey: key });
};

export const setQueryData = (
  queryClient: QueryClient,
  key: string[],
  data: unknown,
) => {
  queryClient.setQueryData(key, data);
};

export const getQueryData = (queryClient: QueryClient, key: string[]) => {
  return queryClient.getQueryData(key);
};

/**
 * Reset query client utility
 * Useful for testing or when user logs out
 */
export const resetQueryClient = () => {
  if (queryClient) {
    queryClient.clear();
    queryClient = null;
  }
};

/**
 * Error Handling Utilities
 * Helper functions for handling query errors
 */

export const isQueryError = (error: unknown): error is Error => {
  return error instanceof Error;
};

export const getQueryErrorMessage = (error: unknown): string => {
  if (isQueryError(error)) {
    return error.message;
  }
  return "An unknown error occurred";
};

export const handleQueryError = (
  error: unknown,
  onError?: (message: string) => void,
) => {
  const message = getQueryErrorMessage(error);
  console.error("Query error:", error);
  onError?.(message);
};

/**
 * Testing Utilities
 * Helper functions for testing components that use queries
 */

export const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
};

export const createQueryWrapper = (client?: QueryClient) => {
  const queryClient = client || createMockQueryClient();

  const QueryWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  QueryWrapper.displayName = "QueryWrapper";
  return QueryWrapper;
};

export default QueryProvider;
