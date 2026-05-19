# TEST-003: Style and Interaction Regression Guards

- Status: planned
- Plan-Version: 1
- Depends on: REFACTOR-002

## Goal

Add targeted testing guards for styling and interaction regressions introduced by refactor and design-system changes, especially for mobile overlays and canvas-first workflows.

## Scope

- In scope: Playwright assertions for key layout/visibility contracts, stable interaction checks for editor overlays, and documentation for style-regression checks in local workflow.
- Out of scope: full visual-diff snapshot infrastructure, browser matrix expansion, and non-editor pages.

## Acceptance criteria

1. Playwright includes focused checks that editor shell controls and overlay panels remain visible and interactive on mobile and desktop breakpoints.
2. Critical interaction paths (mode switch, zoom/grid controls, trace edit entry, part-creator actions) are protected against style-related regressions.
3. Local docs describe how to run regression checks before marking refactor tasks complete.

## Coverage target

- Unit: no new unit target required.
- Integration: existing integration tests continue covering app/store behavior.
- Playwright: targeted regression guards for editor UI layout and interactions.
- CI: regression guards run through existing `test:e2e:feature` / `test:ci` chain.

## Affected surfaces

- Files: `e2e/*.spec.ts`, optional test helpers, `docs/Testing Strategy.md`.
- Commands/scripts: existing test scripts.
- Workflow: refactor and UI tasks require regression guard checks before completion.

## Specialist routing

- Primary: react-ui
- Secondary: pcb-core

## Validation

- Narrow check: `npx playwright test e2e/workspace-camera.spec.ts e2e/part-creator-ux.spec.ts e2e/trace-edit.spec.ts`
- Repo checks: `npm run lint`, `npm run test`, `npm run test:e2e:feature`, `npm run test:ci`.

## Definition of done

- New automated checks run locally.
- The checks are wired into normal repo commands.
- Feature behavior cannot pass with smoke-only e2e coverage.
- Failure output is actionable.

## Notes

- Keep assertions resilient by targeting meaningful roles/test IDs and behavior outcomes instead of fragile pixel-perfect checks.
