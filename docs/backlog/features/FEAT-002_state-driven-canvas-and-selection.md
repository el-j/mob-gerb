# FEAT-002: State-Driven Canvas and Selection

- Status: planned
- Plan-Version: 1
- Depends on: TEST-001, FEAT-001

## Summary

Replace the hard-coded SVG sample with state-driven rendering so the canvas reflects project elements, supports selection, and enables element dragging with grid-aware updates in the correct editor modes.

## Scope

- In scope: rendering project elements from store state, selection visuals, pointer-to-world coordinate conversion, drag-to-move behavior, mode-aware interaction guards.
- Out of scope: shape creation UI, tagging drawer, import/export.

## Acceptance criteria

1. The SVG canvas renders project elements from store state instead of static sample geometry.
2. Users can select an element and see a clear visual selection state.
3. In the relevant edit mode, dragging an element updates its position using the active grid settings.
4. View pan and zoom behavior still work without conflicting with selection and drag behavior.

## Edge cases

1. Dragging while no element is selected does not mutate project geometry.
2. Switching modes mid-interaction leaves the editor in a consistent state.
3. Zoomed or panned canvases still compute correct millimeter-space movement.

## Affected surfaces

- Files: `src/components/Canvas/PcbCanvas.tsx`, `src/store/editorStore.ts`, `src/core/math/coordinates.ts`.
- Types: element render models and selection state.
- Store/actions: select element, move element, clear selection.
- UI states: `VIEW_MODE`, `PART_CREATOR_MODE`, possibly `EDIT_TRACE_MODE` guardrails.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: coordinate transform and snapping helpers.
- Integration: selection and drag action flow.
- Playwright: select-and-drag one element on the canvas.
- CI impact: Playwright baseline needs stable selectors for canvas elements.

## Validation

- Narrow check: integration test for move flow plus one Playwright drag path.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- Keep rendering logic thin; movement math belongs in helpers or the store.