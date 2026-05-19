# REFACTOR-003: Selector Hooks and Mode Panel Modules

- Status: completed
- Plan-Version: 1
- Depends on: REFACTOR-001
- Completed: 2026-05-19
- Validation: lint ✓ · build 427KB ✓ · 40/40 unit ✓ · 1/1 smoke ✓ · 9/9 feature e2e ✓

## Motivation

Store consumption is broad in top-level components. Feature-scoped selector hooks and mode modules will reduce duplication and make state handling clearer and safer.

## Constraints

- Behavior must remain unchanged.
- Public interfaces that may not change:
  - store action semantics
  - mode-driven panel gating

## Acceptance criteria

1. Feature-scoped hooks exist for part creator, logical, trace edit, routing, and workspace controls.
2. Top-level route component no longer imports large numbers of store selectors directly.
3. Reused panel and control components consume typed props, not direct store access.
4. No regression in mode switching or editor interactions.

## Risk areas

1. Hook over-fragmentation causing indirection overhead.
2. Selector mismatch bugs during extraction.
3. Increased rerenders from poorly scoped selectors.

## Affected surfaces

- Files:
  - `src/store/editorStore.ts` (selectors only if needed)
  - `src/features/**` hooks/components
  - `src/App.tsx` or route successor
- Types/state:
  - selector return types and component prop contracts

## Specialist routing

- Primary: react-ui
- Secondary: pcb-core

## Test strategy

- Safety unit/integration:
  - existing app/canvas tests
  - targeted tests for extracted panel components
- Playwright impact:
  - no selector/behavior regressions across mode flows
- CI impact:
  - none beyond standard checks

## Validation

- Narrow check:
  - app + panel tests during extraction
- Repo checks:
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run test:e2e:feature`

## Definition of done

- Public behavior remains unchanged.
- Existing tests still pass and missing safety coverage is added.
- Scope remains structural, not feature-expanding.

## Notes

- Prefer memo-safe selector hooks and avoid passing full store slices into presentational components.
