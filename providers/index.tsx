"use client";

/**
 * Global Providers Composition System
 * Provides a centralized way to compose and manage all React providers
 */

import React, { ReactNode } from "react";

// Import future providers here
import { QueryProvider } from "./query-provider";
// import { AuthProvider } from './auth-provider';
// import { ThemeProvider } from './theme-provider';
// import { ConfigProvider } from './config-provider';

/**
 * Provider composition utility
 * Combines multiple providers into a single component
 */
function composeProviders(
  ...providers: Array<React.FC<{ children: ReactNode }>>
) {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children,
    );
  };
}

/**
 * Individual provider components (placeholders for future implementation)
 */

// Placeholder for Query Provider
// const QueryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   return (
//     <QueryClientProvider client={queryClient}>
//       {children}
//     </QueryClientProvider>
//   );
// };

// Placeholder for Auth Provider
// const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   return (
//     <AuthProviderInner>
//       {children}
//     </AuthProviderInner>
//   );
// };

// Placeholder for Theme Provider
// const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   return (
//     <ThemeProviderInner>
//       {children}
//     </ThemeProviderInner>
//   );
// };

// Placeholder for Config Provider
// const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   return (
//     <ConfigProviderInner>
//       {children}
//     </ConfigProviderInner>
//   );
// };

/**
 * Composed providers array
 * Add providers in the order they should be nested
 * The last provider will be the outermost wrapper
 */
const providers: Array<React.FC<{ children: ReactNode }>> = [
  QueryProvider, // TanStack Query for data fetching and caching
  // AuthProvider,        // Will be added when auth system is implemented
  // ThemeProvider,       // Will be added when theming is implemented
  // ConfigProvider,      // Will be added when config provider is implemented
];

/**
 * Composed provider component
 * This is the main provider that wraps the entire application
 */
export const Providers: React.FC<{ children: ReactNode }> = composeProviders(
  ...providers,
);

/**
 * Individual provider exports for selective usage
 * Export individual providers when they need to be used separately
 */

export { QueryProvider } from "./query-provider";
// export { AuthProvider } from './auth-provider';
// export { ThemeProvider } from './theme-provider';
// export { ConfigProvider } from './config-provider';

/**
 * Provider hooks for accessing provider contexts
 * These will be implemented as individual providers are added
 */

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const useTheme = () => {
//   const context = useContext(ThemeContext);
//   if (!context) {
//     throw new Error('useTheme must be used within a ThemeProvider');
//   }
//   return context;
// };

// export const useConfig = () => {
//   const context = useContext(ConfigContext);
//   if (!context) {
//     throw new Error('useConfig must be used within a ConfigProvider');
//   }
//   return context;
// };

/**
 * Provider configuration types
 * These will be used to configure individual providers
 */

// export interface QueryProviderConfig {
//   defaultOptions?: QueryClientConfig;
//   client?: QueryClient;
// }

// export interface AuthProviderConfig {
//   apiUrl?: string;
//   enableRefresh?: boolean;
//   tokenRefreshThreshold?: number;
// }

// export interface ThemeProviderConfig {
//   defaultTheme?: 'light' | 'dark' | 'system';
//   enableSystem?: boolean;
//   storageKey?: string;
// }

// export interface ConfigProviderConfig {
//   apiBaseUrl?: string;
//   environment?: string;
//   enableDebug?: boolean;
// }

/**
 * Default provider configurations
 * These will be used when providers are initialized with default settings
 */

// export const defaultQueryConfig: QueryProviderConfig = {
//   defaultOptions: {
//     queries: {
//       staleTime: 5 * 60 * 1000, // 5 minutes
//       cacheTime: 10 * 60 * 1000, // 10 minutes
//       retry: 3,
//       refetchOnWindowFocus: false,
//     },
//     mutations: {
//       retry: 1,
//     },
//   },
// };

// export const defaultAuthConfig: AuthProviderConfig = {
//   enableRefresh: true,
//   tokenRefreshThreshold: 5 * 60, // 5 minutes
// };

// export const defaultThemeConfig: ThemeProviderConfig = {
//   defaultTheme: 'system',
//   enableSystem: true,
//   storageKey: 'processmate-theme',
// };

// export const defaultConfig: ConfigProviderConfig = {
//   enableDebug: false,
// };

/**
 * Provider initialization utilities
 * These will be used to initialize providers with custom configurations
 */

// export const createQueryProvider = (config?: QueryProviderConfig) => {
//   const queryClient = new QueryClient({
//     defaultOptions: {
//       ...defaultQueryConfig.defaultOptions,
//       ...config?.defaultOptions,
//     },
//   });

//   return ({ children }: { children: ReactNode }) => (
//     <QueryClientProvider client={config?.client || queryClient}>
//       {children}
//     </QueryClientProvider>
//   );
// };

// export const createAuthProvider = (config?: AuthProviderConfig) => {
//   return ({ children }: { children: ReactNode }) => (
//     <AuthProviderInner config={{ ...defaultAuthConfig, ...config }}>
//       {children}
//     </AuthProviderInner>
//   );
// };

/**
 * Development utilities
 * These will help with debugging and development
 */

// export const ProviderDebugger: React.FC<{ children: ReactNode }> = ({ children }) => {
//   if (process.env.NODE_ENV === 'development') {
//     console.log('Providers rendered:', providers.length);
//   }

//   return <>{children}</>;
// };

/**
 * Provider testing utilities
 * These will be used for testing components with providers
 */

// export const TestProviders: React.FC<{
//   children: ReactNode;
//   providers?: Array<React.FC<{ children: ReactNode }>>;
// }> = ({ children, providers: testProviders = [] }) => {
//   const allProviders = [...testProviders, ...providers];
//   const Composed = composeProviders(...allProviders);
//
//   return <Composed>{children}</Composed>;
// };

// export const createMockProvider = <T,>(
//   Context: React.Context<T>,
//   value: T
// ): React.FC<{ children: ReactNode }> => {
//   return ({ children }) => (
//     <Context.Provider value={value}>
//       {children}
//     </Context.Provider>
//   );
// };

/**
 * Export the main providers composition
 */
export default Providers;
