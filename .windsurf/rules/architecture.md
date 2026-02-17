---
trigger: always_on
---

Project Development Rules

Code Standards:

- Use strict TypeScript configuration.
- Use functional React components only.
- Components must be reusable and modular.
- Avoid placing business logic inside UI components.
- Use clear typing for props, responses, and state.
- Follow consistent naming conventions.

Architecture:

- Follow feature-based folder structure.
- Separate responsibilities between:
  - UI layer
  - Business logic layer
  - Data access layer
- Use service layer to handle API and external integrations.
- Keep domain logic independent from framework-specific code.
- Promote scalability and maintainability.

Supabase Integration:

- Use a centralized Supabase client instance.
- All database queries must be typed.
- Follow patterns compatible with Row Level Security (RLS).
- Avoid direct Supabase calls inside UI components.
- Use repository or service layer for data operations.

AI Integration:

- All AI responses must return structured JSON.
- AI outputs must always be validated using Zod schemas.
- AI prompts must be stored and managed as reusable prompt templates.
- Avoid direct AI calls inside UI components.
- AI services must be abstracted through a dedicated service layer.

UI/UX Guidelines:

- The application must follow a chat-first interaction model.
- Onboarding must be minimal and intuitive.
- All AI generated content must be editable by the user.
- Provide clear loading, success, and error states.
- Maintain consistent design system using shared UI components.

Performance:

- Use Server Components when applicable.
- Avoid unnecessary client-side rendering.
- Implement caching strategies when possible.
- Optimize network requests and AI calls.
- Prevent unnecessary re-renders using memoization techniques.

Security:

- Protect sensitive operations using server-side logic.
- Never expose API keys to the client.
- Validate all external inputs before processing.
