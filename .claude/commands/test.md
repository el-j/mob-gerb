# /test

Run acceptance-oriented validation for one task.

## Procedure

1. Read the task plan's acceptance criteria and validation section.
2. Prefer the narrowest executable checks first.
3. Run unit tests for touched `src/core` logic.
4. Run integration tests for store or component behavior.
5. For user-facing flows, run or update Playwright acceptance coverage.
6. For feature tasks, require at least one non-smoke Playwright case for the new behavior.
7. For type or integration changes, run `npm run lint` and `npm run build`.
8. Report which acceptance criteria were directly exercised and which still rely on reasoning only.

## Default repo commands

- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run test:e2e:smoke`
- `npm run test:e2e:feature`
- `npm run test:ci`

If a future test runner exists, update this command file and the templates to use it.