# FEAT-005: Logical Nets and Airwires

- Status: planned
- Plan-Version: 1
- Depends on: TEST-001, FEAT-001, FEAT-002, FEAT-004

## Summary

Implement the intent-definition layer for PCB editing: selecting compatible pads in `LOGICAL_MODE` creates or extends nets and renders visible airwires without yet committing physical copper traces.

## Scope

- In scope: net data model, pad hit targeting, two-step pad connection flow, airwire rendering, logical-mode UI affordances.
- Out of scope: pathfinding, worker execution, trace editing.

## Acceptance criteria

1. In `LOGICAL_MODE`, the user can tap two compatible pads to create a logical net.
2. The app renders an airwire between connected pads and keeps it synchronized with pad movement.
3. Reusing an existing net extends that net instead of creating duplicate disconnected intent.
4. Non-logical modes do not accidentally create or edit nets.

## Edge cases

1. Connecting a pad to itself is blocked.
2. Selecting an invalid second target leaves the pending first selection recoverable.
3. Moving a tagged pad updates connected airwire endpoints deterministically.

## Affected surfaces

- Files: `src/store/editorStore.ts`, `src/components/Canvas/PcbCanvas.tsx`, possible net rendering helpers under `src/core`.
- Types: net model, pad references, airwire render data.
- Store/actions: begin logical connect, complete logical connect, cancel logical connect.
- UI states: `LOGICAL_MODE`.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: net creation and endpoint derivation helpers.
- Integration: logical connect action sequences.
- Playwright: create an airwire between two pads and verify it persists visually.
- CI impact: logical connect selectors and fixture project state must be stable.

## Validation

- Narrow check: net action integration tests.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- This task is about intent only; do not smuggle routing heuristics into it.