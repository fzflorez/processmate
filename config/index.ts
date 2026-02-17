/**
 * Central configuration hub
 * Exports all configuration objects for the application
 */

// Environment configuration
export { env, type EnvSchema } from "./env";

// Future global configuration placeholders
export const config = {
  // Database configuration
  database: {
    // Future database-specific settings can be added here
  },

  // API configuration
  api: {
    // Future API-specific settings can be added here
  },

  // Feature flags
  features: {
    // Future feature flags can be added here
  },

  // Application settings
  app: {
    // Future app-specific settings can be added here
  },
};

/**
 * Export a unified configuration object
 * This provides a single entry point for all configuration needs
 */
export const configuration = {
  env,
  database: config.database,
  api: config.api,
  features: config.features,
  app: config.app,
};
