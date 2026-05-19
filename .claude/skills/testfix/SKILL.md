---
name: testfix
description: /testfix
---

# /testfix

Classify a failed validation and repair the right thing.

## Procedure

1. Read the failing command output.
2. Decide whether the failure is caused by code, the task plan, or the validation itself.
3. If code is wrong, fix the smallest local defect and rerun the same validation.
4. If the plan is wrong, update the plan before continuing.
5. If validation is wrong or stale, tighten it instead of weakening expectations.

## Output

- failure classification
- repair made
- rerun result
- lesson worth preserving, if any