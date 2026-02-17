# Configuration Layer

This directory contains the centralized configuration and environment management system for ProcessMate.

## Purpose

The configuration layer provides:

- **Type-safe environment variable access** with validation
- **Centralized configuration management** for the entire application
- **Consistent error handling** for missing or invalid environment variables
- **Future-proof architecture** for expanding configuration needs

## Environment Variables

The system validates and provides typed access to the following required environment variables:

### Required Variables

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `OPENAI_API_KEY` - OpenAI API key for AI integrations
- `APP_ENV` - Application environment (`development`, `staging`, or `production`)
- `APP_NAME` - Application name

### Usage

```typescript
import { env } from '@/config';

// Access environment variables with type safety
const supabaseUrl = env.SUPABASE_URL;
const appEnvironment = env.APP_ENV; // Type: 'development' | 'staging' | 'production'
```

## Configuration Structure

```
config/
├── env.ts          # Environment variable validation and typing
├── index.ts        # Central configuration exports
└── README.md       # This documentation
```

## Validation

The environment validation occurs at application startup. If any required variable is missing or invalid, the application will throw an error with a descriptive message.

### Validation Rules

- All required variables must be present and non-empty
- `APP_ENV` must be one of: `development`, `staging`, `production`
- Validation errors provide clear feedback about what's missing

## Future Extensions

The configuration layer is designed to accommodate future needs:

- Database configuration settings
- API configuration options
- Feature flags
- Application-specific settings

These can be added to the `config` object in `index.ts` as needed.

## Best Practices

1. **Always import from the config layer** - Never access `process.env` directly
2. **Use the typed `env` object** for environment variables
3. **Add new variables to the `EnvSchema` interface** for type safety
4. **Update validation logic** when adding new required variables
5. **Document new configuration options** in this README

## Example: Adding a New Environment Variable

1. Add to `EnvSchema` interface in `env.ts`:
```typescript
interface EnvSchema {
  // ... existing variables
  NEW_FEATURE_FLAG: string;
}
```

2. Add validation in `createEnvConfig()`:
```typescript
return {
  // ... existing variables
  NEW_FEATURE_FLAG: validateRequiredEnv('NEW_FEATURE_FLAG'),
};
```

3. Use throughout the application:
```typescript
import { env } from '@/config';
const featureEnabled = env.NEW_FEATURE_FLAG === 'true';
```
