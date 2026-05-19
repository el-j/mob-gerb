# REFACTOR-001: App Shell Decomposition and Router Foundation

- Status: completed
- Plan-Version: 1
- Depends on: FEAT-015
- Completed-At: 2026-05-19

## Motivation

`src/App.tsx` currently concentrates too many responsibilities, which increases change risk and slows feature work. React Router is installed but not yet used to structure editor/utility surfaces.

## Constraints

- Behavior must remain unchanged.
- Public interfaces that may not change:
  - current editor interaction semantics (selection, draw, routing, DRC)
  - existing test-visible labels/test IDs for active e2e flows
  - store as source-of-truth

## Acceptance criteria

1. Router root exists and renders the current editor route unchanged at `/`.
2. `App.tsx` responsibilities are decomposed into focused modules (header/file controls, mode panel switch, workspace controls).
3. `App.tsx` size is significantly reduced and no longer acts as a boss-file.
4. Existing tests continue to pass without behavioral drift.

## Risk areas

1. Breaking existing e2e selectors while moving controls.
2. Introducing duplicate state reads across extracted components.
3. Accidentally changing mode visibility/guard behavior.

## Affected surfaces

- Files:
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/layouts/**` (new)
  - `src/routes/**` (new)
  - `src/features/**` (new)
- Types/state:
  - selector boundaries only; no domain shape changes expected

## Specialist routing

- Primary: react-ui
- Secondary: pcb-core

## Test strategy

- Safety unit/integration:
  - `src/App.test.tsx`
  - panel module tests as extracted
- Playwright impact:
  - smoke + feature suite must remain green
- CI impact:
  - none expected beyond normal suite

## Validation

- Narrow check:
  - run app tests after each extraction step
- Repo checks:
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run test:e2e:feature`
  - `npm run test:ci`

## Definition of done

- Public behavior remains unchanged.
- Existing tests still pass and missing safety coverage is added.
- Scope remains structural, not feature-expanding.

## Notes

- Route hierarchy should reserve future utility pages (`/import`, `/export`, `/settings`, `/docs`) while keeping editor-first experience at `/`.

## Execution result

1. Router foundation added with `RouterProvider`, route layouts, and utility route stubs while preserving `/` editor behavior.
2. `src/App.tsx` reduced to shell composition using extracted feature modules (header/file controls, mode panel switch, workspace frame).
3. Selector and interaction contracts were preserved for existing e2e coverage.

## Validation result

- `npm run lint` passed.
- `npm run test` passed.
- `npm run build` passed.
- `npm run test:e2e:smoke` passed.
- `npm run test:e2e:feature` passed.
- `npm run test:ci` passed.
