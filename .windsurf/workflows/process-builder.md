---
description: Convert user described processes into structured task checklists
---

Inputs:

- User description of a process
- Optional contextual data

Workflow Steps:

1. Receive process description input.
2. Send process description to AI service.
3. AI decomposes process into structured steps.
4. Validate generated step structure.
5. Create checklist entity with ordered steps.
6. Store checklist in database.
7. Allow user to track and update progress.
8. Update UI with process progress visualization.

Outputs:

- Structured checklist
- Stored process entity
