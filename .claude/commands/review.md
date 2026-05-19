# /review

Perform a white-box review of an implemented task against its plan.

## Focus

- Acceptance criteria coverage
- type safety and architectural fit
- regression risk
- missing tests or insufficient validation
- scope drift

## Review checklist

1. Compare the diff against the task plan, not just against the previous code.
2. Confirm that core logic remains in `src/core` where appropriate.
3. Check React components for avoidable business logic.
4. Check store updates for immutability and serializable state.
5. Confirm any Fritzing layer assumptions match the docs.
6. Confirm feature tasks include non-smoke Playwright coverage for the newly introduced behavior.

## Output

List findings first, ordered by severity. If no findings exist, say that explicitly and note any remaining test gaps.