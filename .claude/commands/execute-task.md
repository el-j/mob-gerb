# /execute-task

Implement one validated task plan with minimal scope drift.

## Procedure

1. Read the task plan and the routed specialist commands.
2. Start with the smallest failing or missing test that proves the target behavior, unless the task is pure scaffolding.
3. Restate the smallest falsifiable implementation hypothesis.
4. Make the smallest grounded edit that tests that hypothesis.
5. Immediately run the narrowest validation from the plan.
6. If validation fails, repair the same slice before widening scope.
7. Finish with `npm run lint` and `npm run build` when TypeScript, React, store, or core logic changed.
8. For user-facing behavior, add or update Playwright coverage before the task is considered done.
9. Update the task plan status and record follow-up work instead of bundling unrelated fixes.

## Guardrails

- Do not skip validation after the first meaningful edit.
- Do not merge behavior changes without the corresponding tests from the task plan.
- Do not rewrite large surfaces when a local change will do.
- Do not weaken type safety to make validation pass.
- Do not mix roadmap work into a single backlog task.

## Deliverable

- implemented code
- validation results
- concise notes for `/review` and `/learn`