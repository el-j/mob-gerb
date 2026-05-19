# FEAT-014: Polygon Add/Remove Points On-Canvas

- Status: completed
- Plan-Version: 1
- Depends on: TEST-001, FEAT-013

## Summary

Enable adding and removing points for selected polygons and polylines directly on the canvas. This allows users to refine shapes visually without manual coordinate entry.

## Scope

- In scope: Midpoint handles on edges to add new vertices. Double-click/tap on existing handles to remove them. Updating typed store state.
- Out of scope: Splines, bezier curves, multi-point deletion.

## Acceptance criteria

1. Selected polygons and polylines display midpoint handles on their segments.
2. Interacting (pointer down) with a midpoint handle inserts a new point at that position and immediately transitions to a point-drag interaction.
3. Double-clicking/tapping an existing point handle removes that point from the shape.
4. Removing a point from a polygon with <=3 points or a polyline with <=2 points is prevented.
5. Canvas rendering and state update in real-time.

## Edge cases

1. Deleting a point that brings a polygon below 3 points or polyline below 2 points should be prevented to maintain shape validity.
2. Clicking a midpoint handle correctly inserts the point at the proper array index to maintain geometry winding.
3. Snapping applies correctly to the newly added point while dragging.

## Affected surfaces

- Files: `src/components/Canvas/PcbCanvas.tsx`, `src/store/editorStore.ts`
- Types: `EditorState`
- Store/actions: `addPointToSelectedShape`, `removePointFromSelectedShape`
- UI states: `PART_CREATOR_MODE`

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: test `addPointToSelectedShape` and `removePointFromSelectedShape` logic in store.
- Integration: canvas interaction triggers add/remove correctly.
- Playwright: E2E scenario adding a point via midpoint and removing a point.
- CI impact: none (uses existing pipeline)

## Validation

- Narrow check: run store unit tests, canvas integration tests, e2e tests.
- Repo checks: `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e:feature`

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- At least one non-smoke Playwright scenario is added or updated for feature behavior.
- Follow-up items separated from current scope.

## Notes

- Keep logic typed and avoid DOM-derived geometry.
