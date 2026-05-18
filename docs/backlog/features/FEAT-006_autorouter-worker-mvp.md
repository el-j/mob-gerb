# FEAT-006: Autorouter Worker MVP

- Status: planned
- Plan-Version: 1
- Depends on: TEST-001, FEAT-001, FEAT-005

## Summary

Implement a first autorouting loop using a Web Worker, a typed message protocol, and a grid-based routing algorithm that can transform airwires into simple copper trace waypoint paths without freezing the UI.

## Scope

- In scope: worker message contracts, route request/response types, obstacle model, MVP pathfinding, routing-mode state transitions, route rendering.
- Out of scope: optimal routing quality, advanced shove-routing, full DRC-driven rerouting.

## Acceptance criteria

1. The app can send the current routing request to a worker and receive route waypoint results asynchronously.
2. `ROUTING_MODE` visibly locks the relevant UI until the worker resolves or fails.
3. Successful routes are rendered as physical trace geometry distinct from airwires.
4. Worker failures or stale responses do not corrupt the editor state.

## Edge cases

1. A routing request canceled by state changes is ignored safely.
2. Unroutable requests return a handled failure state rather than hanging.
3. Repeated runs over the same input produce stable results within the MVP routing model.

## Affected surfaces

- Files: `src/workers/autorouter.worker.ts`, `src/store/editorStore.ts`, `src/components/Canvas/PcbCanvas.tsx`, possible routing helpers under `src/core`.
- Types: worker request/response payloads, route waypoint model.
- Store/actions: start routing, complete routing, fail routing.
- UI states: `ROUTING_MODE`.

## Specialist routing

- Primary: `routing-worker`
- Secondary: `pcb-core`

## Test strategy

- Unit: routing helpers and obstacle-grid calculations.
- Integration: store-worker orchestration with mocked worker boundary.
- Playwright: create a simple net and trigger autoroute.
- CI impact: worker tests and Playwright route fixtures must stay deterministic.

## Validation

- Narrow check: routing helper tests and mocked orchestration integration test.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- Keep the worker contract explicit; opaque `postMessage` blobs will make this hard to test and maintain.