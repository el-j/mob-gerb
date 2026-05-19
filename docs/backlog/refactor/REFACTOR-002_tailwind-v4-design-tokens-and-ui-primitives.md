# REFACTOR-002: Tailwind v4 Design Tokens and UI Primitives

- Status: completed
- Plan-Version: 1
- Depends on: REFACTOR-001
- Completed-At: 2026-05-19

## Motivation

Styling currently mixes broad CSS and incremental utility classes. Tailwind v4 is installed but not yet used as a structured design system.

## Constraints

- Behavior must remain unchanged.
- Public interfaces that may not change:
  - mobile canvas-first interaction
  - control accessibility labels and keyboard behavior

## Acceptance criteria

1. Tailwind v4 tokens are defined for typography, color, spacing, and z-layer conventions.
2. Reusable UI primitives are introduced (button, panel, input group, floating controls) and used by editor surfaces.
3. Legacy `App.css` is reduced to minimal residual rules or removed where safe.
4. Mobile overlay behavior remains stable and visually coherent.

## Risk areas

1. Mobile overlay regressions from z-index/positioning changes.
2. Inconsistent class usage causing visual drift.
3. Hard-to-debug specificity conflicts during coexistence phase.

## Affected surfaces

- Files:
  - `src/index.css`
  - `src/App.css`
  - `src/features/**`
  - optional `src/components/ui/**` (new)
- Types/state:
  - none expected

## Specialist routing

- Primary: react-ui
- Secondary: pcb-core

## Test strategy

- Safety unit/integration:
  - no domain logic changes expected
- Playwright impact:
  - ensure feature visual/interaction paths remain green
- CI impact:
  - none beyond standard checks

## Validation

- Narrow check:
  - run selected e2e feature tests focusing mobile/editor controls
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

- Keep canvas SVG styling and geometry behavior under explicit control; do not move domain geometry semantics into styling utilities.

## Execution result

1. Tailwind v4 tokens were added in `src/index.css` for typography, color, spacing, and z-layer conventions.
2. Reusable styling primitives (`ui-btn`, `ui-btn--active`, `ui-panel`, `ui-input`, `ui-floating`) were introduced and applied across editor surfaces.
3. Legacy style values in `src/App.css` were migrated toward token usage while preserving layout and interaction behavior.

## Validation result

- `npm run lint` passed.
- `npm run test` passed.
- `npm run build` passed.
- `npm run test:e2e:feature` passed.
