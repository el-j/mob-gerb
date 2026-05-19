# FEAT-012: Part Creator Mobile UX and Drawing Controls

- Status: completed
- Plan-Version: 1
- Depends on: TEST-001, FEAT-001, FEAT-002, FEAT-003, FEAT-010

## Summary

Close key usability gaps in part creator mode: zoom/grid clarity, obvious selection feedback, easier 1:1 reset, fillable pads/surfaces, editable stroke thickness, clearer connector assignment feedback, and a mobile-first overlay UI where the drawing region remains primary.

## Scope

- In scope: zoom/grid rendering polish, explicit zoom badge/reset affordance, selection box visualization, fill toggle for closed shapes, thickness controls for line/polylines, connector assignment visibility, mobile overlay toolbar/panel layout.
- Out of scope: full CAD-grade freehand spline tooling, advanced boolean geometry operations, complete style system overhaul across non-editor screens.

## Acceptance criteria

1. Grid visualization scales coherently with zoom and no longer feels detached from canvas zoom state.
2. Zoom level is clearly visible and reset to 1:1 is one-tap in both desktop and mobile contexts.
3. Selected shapes have an unmistakable selection box/handles.
4. Closed shapes can be toggled between outlined and filled pad/surface behavior.
5. Users can edit stroke thickness for line-based elements.
6. Connector identity for selected elements is clearly visible in controls/status text.
7. On mobile, the canvas is the primary region and controls behave as compact overlays.

## Edge cases

1. Fill toggle is ignored safely for non-closed geometry where fill is not meaningful.
2. Thickness controls clamp invalid values and avoid NaN store mutations.
3. Selection state remains stable when switching modes and opening/closing overlays.
4. Zoom reset does not alter geometry coordinates, only viewport camera state.

## Affected surfaces

- Files: `src/components/Canvas/PcbCanvas.tsx`, `src/store/editorStore.ts`, `src/core/types/pcb.ts`, `src/App.tsx`, `src/App.css`, tests under `src/**` and `e2e/**`.
- Types: element styling metadata for fill and stroke thickness.
- Store/actions: selected element style update actions.
- UI states: `PART_CREATOR_MODE`, camera controls, mobile overlay behavior.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: style update action guards and clamping.
- Integration: fill/thickness controls and selection feedback updates.
- Playwright: user story covering zoom badge/reset, selection visibility, and style edits.
- CI impact: one new non-smoke Playwright path.

## Validation

- Narrow check: updated store/app/canvas tests and targeted Playwright story.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e:feature`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Task and orchestration state updated after validation.

## Notes

- Keep the persisted geometry model typed and deterministic for future Fritzing and Gerber export stages.
- Implemented on 2026-05-19.
- Grid rendering now scales with viewport zoom by rendering the pattern in world space under the pan/zoom transform.
- Added explicit zoom visibility and quick 1:1 reset controls, including a floating camera control for canvas-first workflows.
- Added selection-box visualization, free-draw polyline workflow, fill toggle for closed shapes, stroke thickness editing, and polyline point editing controls.
- Clarified connector assignment with explicit helper text and selected connector status.
- Mobile layout now prioritizes canvas as primary region with overlay controls and bottom-sheet style creator controls.
- Added/updated coverage in `src/store/editorStore.test.ts`, `src/components/Canvas/PcbCanvas.test.tsx`, `src/App.test.tsx`, and `e2e/part-creator-ux.spec.ts`.
- Validation succeeded with `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e:feature`, and `npm run test:ci`.
