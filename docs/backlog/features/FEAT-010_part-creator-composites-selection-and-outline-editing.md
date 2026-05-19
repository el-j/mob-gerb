# FEAT-010: Part Creator Composites, Selection, and Outline Editing

- Status: completed
- Plan-Version: 1
- Depends on: TEST-001, FEAT-001, FEAT-002, FEAT-003

## Summary

Extend the part creator into a proper footprint composition editor. Users should be able to select and move shapes more clearly, combine multiple primitives into a composite footprint element, and adjust the outer outline separately from the internal primitives. Connector-bearing and non-connector composites must both remain valid, so a footprint can express multiple connectors and custom copper or silkscreen geometry without forcing hole semantics.

## Scope

- In scope: improved selection affordances, multi-selection, combine/split composite actions, composite drag behavior, editable outer outline geometry, connector-optional composites, outline adjustment controls.
- Out of scope: Fritzing archive import/export, autorouting, trace editing, Gerber output.

## Acceptance criteria

1. Users can select shapes with clear visual feedback and drag them with reliable touch/mouse behavior in part creator mode.
2. Users can select multiple primitives and combine them into one composite footprint element without losing the underlying child geometry.
3. The composite outer outline is visible and adjustable independently of the child shapes.
4. Connector metadata remains optional at the composite level, and footprints can contain multiple connector-bearing children when needed.
5. The rendered SVG and editor state stay synchronized for selection, drag, combine, split, and outline adjustments.

## Edge cases

1. Combining shapes with mixed roles or layers preserves the underlying primitives and does not silently drop metadata.
2. Dragging a composite moves all member geometry together while preserving child-relative positions.
3. Undo and redo restore both composite membership and outline state deterministically.
4. A footprint with no connectors remains valid and does not auto-generate connector metadata.
5. Switching between single-shape selection and composite selection does not leave stale selection state behind.

## Affected surfaces

- Files: `src/store/editorStore.ts`, `src/components/Canvas/PcbCanvas.tsx`, `src/App.tsx`, `src/App.css`, `src/core/types/pcb.ts`, `src/store/editorStore.test.ts`, `src/components/Canvas/PcbCanvas.test.tsx`, `src/App.test.tsx`, `e2e/**`.
- Types: composite footprint model, selection model, outline geometry, connector-bearing child metadata.
- Store/actions: multi-select, combine, split, move composite, adjust outline.
- UI states: `PART_CREATOR_MODE` primarily, with selection/drag behavior guarded by mode.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: selection toggling, combine/split helpers, outline derivation, composite cloning.
- Integration: multi-select, combine, drag, split, and outline-adjustment state transitions.
- Playwright: user story for selecting multiple shapes, combining them, dragging the composite, and adjusting the outline.
- CI impact: one non-smoke Playwright feature flow is required before completion.

## Validation

- Narrow check: store integration tests for selection/combine logic and one Playwright composite-flow test.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- At least one non-smoke Playwright scenario is added or updated for feature behavior.
- Follow-up items separated from current scope.

## Notes

- Keep the composite model explicit instead of inferring grouping from role alone.
- The outer outline should be editable as first-class geometry, not just a visual stroke.
- Implemented on 2026-05-19.
- Added composite/group selection, shift-click multi-selection, combine/split actions, outline padding controls, and clearer canvas hit targets.
- Composite footprints now move as a unit, preserve child geometry, and keep connector tagging optional at the footprint level.
- Added coverage in `src/store/editorStore.test.ts`, `src/components/Canvas/PcbCanvas.test.tsx`, `src/App.test.tsx`, and `e2e/composite-footprint.spec.ts`.
- Validation succeeded with `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e:smoke`, `npm run test:e2e:feature`, and `npm run test:ci`.
