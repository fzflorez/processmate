/**
 * Environment variable validation and configuration
 * Provides type-safe access to environment variables with validation
 */

interface EnvSchema {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENAI_API_KEY: string;
  APP_ENV: 'development' | 'staging' | 'production';
  APP_NAME: string;
}

/**
 * Validates that a required environment variable exists and is not empty
 */
function validateRequiredEnv(key: keyof EnvSchema): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  if (value.trim() === '') {
    throw new Error(`Environment variable ${key} cannot be empty`);
  }
  
  return value;
}

/**
 * Validates APP_ENV is one of the allowed values
 */
function validateAppEnv(value: string): EnvSchema['APP_ENV'] {
  const allowedEnvs = ['development', 'staging', 'production'];
  
  if (!allowedEnvs.includes(value)) {
    throw new Error(`APP_ENV must be one of: ${allowedEnvs.join(', ')}. Got: ${value}`);
  }
  
  return value as EnvSchema['APP_ENV'];
}

/**
 * Validates and returns typed environment variables
 */
function createEnvConfig(): EnvSchema {
  try {
    return {
      SUPABASE_URL: validateRequiredEnv('SUPABASE_URL'),
      SUPABASE_ANON_KEY: validateRequiredEnv('SUPABASE_ANON_KEY'),
      OPENAI_API_KEY: validateRequiredEnv('OPENAI_API_KEY'),
      APP_ENV: validateAppEnv(validateRequiredEnv('APP_ENV')),
      APP_NAME: validateRequiredEnv('APP_NAME'),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Environment configuration error: ${error.message}`);
    }
    throw new Error('Unknown environment configuration error');
  }
}

/**
 * Exported environment configuration object
 * This is the single source of truth for all environment variables
 */
export const env = createEnvConfig();

/**
 * Type exports for use throughout the application
 */
export type { EnvSchema };
