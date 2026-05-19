# FEAT-007: Trace Edit Mode and DRC

- Status: completed
- Plan-Version: 1
- Depends on: TEST-001, FEAT-002, FEAT-006
- Completed: 2026-05-19
- Note: All AC already implemented in prior sessions. Validated via trace-edit.spec.ts (passing) and 6 drcEngine unit tests.

## Summary

Add manual correction tools for routed traces: double-tap entry into trace edit mode, oversized drag handles, grid-aware waypoint adjustment, and design-rule checks that surface invalid copper overlaps or clearance breaches.

## Scope

- In scope: double-tap detection, trace isolation visuals, drag handles, editable waypoints, DRC geometry checks, violation highlighting.
- Out of scope: full rule editor, advanced routing optimizations, production-grade autorouter heuristics.

## Acceptance criteria

1. Double-tapping a routed trace enters `EDIT_TRACE_MODE` and visually isolates the selected trace.
2. The selected trace exposes touch-friendly editable handles.
3. Dragging a handle updates the trace on-grid and preserves route connectivity.
4. DRC violations are computed for relevant copper geometry and surfaced clearly in the UI.

## Edge cases

1. Exiting edit mode mid-drag leaves the route in a consistent state.
2. Nearby same-net connections snap correctly without breaking geometry.
3. DRC checks do not report self-intersections or same-net contact as unrelated errors if the rules allow them.

## Affected surfaces

- Files: `src/components/Canvas/PcbCanvas.tsx`, `src/store/editorStore.ts`, possible new DRC helpers under `src/core`, routing-related UI components.
- Types: trace vertex model, DRC result model.
- Store/actions: enter edit mode, update trace vertex, exit edit mode, recompute DRC.
- UI states: `EDIT_TRACE_MODE`.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: DRC geometry checks and snapping rules.
- Integration: edit-mode transitions and trace vertex updates.
- Playwright: double-tap a trace, drag a handle, and verify violation surfacing on invalid geometry.
- CI impact: gesture timing in Playwright must be deterministic.

## Validation

- Narrow check: DRC unit tests plus edit-mode integration tests.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- Keep the visual handle size and the actual touch target conceptually separate so mobile usability does not regress.