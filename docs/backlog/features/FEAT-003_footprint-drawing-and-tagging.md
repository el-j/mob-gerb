# FEAT-003: Footprint Drawing and Tagging

- Status: planned
- Plan-Version: 1
- Depends on: TEST-001, FEAT-001, FEAT-002

## Summary

Implement the first user-complete footprint creator loop: add primitive shapes, move them on-grid, select them, and tag them as through-hole pads, SMD pads, or silkscreen with connector-aware metadata.

## Scope

- In scope: add-shape actions, toolbar or control entry points for basic shapes, tagging drawer or modal, connector pin naming, layer assignment, role assignment.
- Out of scope: final `.fzpz` export bundle, existing Fritzing import.

## Acceptance criteria

1. Users can add at least circles, lines, and rectangles into the current project.
2. Users can select a shape and assign it a PCB role and layer consistent with the spec docs.
3. Through-hole and SMD pad tagging produces connector-oriented metadata that later export logic can consume.
4. The rendered SVG updates immediately to reflect role and layer changes.

## Edge cases

1. Assigning a connector pin number already in use surfaces a conflict or deterministic rename rule.
2. Tagging non-pad geometry as copper does not generate invalid geometry metadata silently.
3. Cancelling the tagging UI leaves the prior state unchanged.

## Affected surfaces

- Files: `src/components/Toolbar/**`, `src/components/Canvas/**`, possible new modal or drawer components, `src/store/editorStore.ts`, `src/core/types/pcb.ts`.
- Types: element role metadata, connector metadata, layer mapping.
- Store/actions: add shape, update shape role, update connector data.
- UI states: `PART_CREATOR_MODE`.

## Specialist routing

- Primary: `react-ui`
- Secondary: `fritzing-io`

## Test strategy

- Unit: connector ID derivation and role-to-layer mapping helpers.
- Integration: add-shape and tagging state transitions.
- Playwright: add a pad, move it, tag it, and verify updated SVG/state indicators.
- CI impact: Playwright flows need stable controls and deterministic initial state.

## Validation

- Narrow check: add/tag integration test and one Playwright footprint-creation flow.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- Keep export-specific XML formatting out of UI code; this task only establishes the tagged model needed by export tasks.