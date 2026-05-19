---
name: resolve
description: /resolve
---

# /resolve

Resolve plan drift, branch conflicts, or overlapping task changes.

## Procedure

1. Identify whether the conflict is in code, plan, or workflow state.
2. Prefer updating the newer task plan rather than hiding the conflict in code.
3. Preserve accepted behavior from already-completed tasks.
4. Re-run the narrowest validations that cover the resolved area.

## Deliverable

- conflict summary
- chosen resolution
- validation rerun results