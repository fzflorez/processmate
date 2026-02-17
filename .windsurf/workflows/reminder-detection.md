---
description: Detect reminder opportunities from user conversation
---

Inputs:

- User message text
- Conversation context

Workflow Steps:

1. Analyze user message for temporal expressions.
2. Extract date and time entities using AI or parser.
3. Validate extracted temporal data.
4. Generate reminder object.
5. Store reminder entity in database.
6. Create notification scheduling placeholder.
7. Associate reminder with user session.

Outputs:

- Reminder entity
- Scheduled notification reference
