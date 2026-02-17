---
description: Process user chat messages and generate structured AI responses
---

Inputs:

- User message text
- User session data (optional)
- Conversation history

Workflow Steps:

1. Receive user message input.
2. Analyze message context and history.
3. Perform intent detection using AI service.
4. Generate structured AI response.
5. Validate AI output using Zod schema.
6. Save conversation interaction in database.
7. Return response to UI and update chat interface.

Outputs:

- Structured AI response object
- Updated conversation history
