# FEAT-013: On-Canvas Point Handle Editing

- Status: completed
- Plan-Version: 1
- Depends on: TEST-001, FEAT-012

## Summary

Add direct on-canvas point-handle editing for selected polyline and polygon shapes in part creator mode, so users can drag vertices visually instead of relying only on numeric point inputs.

## Scope

- In scope: visible point handles for selected point-based shapes, pointer drag editing of point coordinates, grid-aware snapping during handle drag, and tests.
- Out of scope: bezier/spline tools, rotate/skew transforms, multi-point box editing.

## Acceptance criteria

1. Selecting a polyline or polygon in part creator mode shows editable point handles.
2. Dragging a handle updates that point in real time using active grid snapping.
3. Existing shape drag and selection behavior remains stable.
4. Updated geometry is reflected in both canvas rendering and state.

## Edge cases

1. Dragging when no point-based shape is selected does nothing.
2. Invalid point index edits are ignored safely.
3. Handle drag does not accidentally pan viewport in part creator mode.

## Affected surfaces

- Files: `src/components/Canvas/PcbCanvas.tsx`, `src/store/editorStore.ts`, tests under `src/**` and `e2e/**`.
- Types: point-edit actions for selected shapes.
- Store/actions: update selected point coordinate action.
- UI states: `PART_CREATOR_MODE`.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: point-update action behavior and guards.
- Integration: canvas handle drag updates selected shape points.
- Playwright: user story dragging a visible point handle.
- CI impact: one non-smoke e2e path updated.

## Validation

- Narrow check: updated store/canvas tests and targeted Playwright feature flow.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e:feature`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Task and orchestration state updated after validation.

## Notes

- Keep point edits in typed state as canonical geometry for downstream exporter correctness.
- Implemented on 2026-05-19.
- Added direct on-canvas point handles for selected polyline and polygon elements in part creator mode.
- Point-handle drag now updates selected point geometry in real time with grid-aware snapping.
- Added store action `updateSelectedPointFromWorld` to preserve typed geometry updates without DOM-derived state.
- Added coverage in `src/store/editorStore.test.ts`, `src/components/Canvas/PcbCanvas.test.tsx`, and updated e2e flow in `e2e/part-creator-ux.spec.ts`.
- Validation succeeded with `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e:feature`, and `npm run test:ci`.
