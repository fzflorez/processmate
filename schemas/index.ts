/**
 * Central schema exports for the application
 * Provides a single entry point for all validation schemas
 */

// Export all common schemas
export * from './common.schema';

// Future schema exports can be added here
// export * from './api.schema';
// export * from './database.schema';
// export * from './business.schema';

/**
 * Schema registry for centralized schema management
 * This will be populated with actual schemas when Zod is installed
 */
export const schemaRegistry = {
  // Placeholder for schema registry
  // common: commonSchemas,
  // api: apiSchemas,
  // database: databaseSchemas,
};
