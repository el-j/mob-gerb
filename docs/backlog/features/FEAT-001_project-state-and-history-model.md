# FEAT-001: Project State and History Model

- Status: planned
- Plan-Version: 1
- Depends on: TEST-001

## Summary

Replace the current minimal editor store with a serializable project model that can represent metadata, footprint elements, selection, nets, and undo/redo history without leaking UI-only structures into core domain state.

## Scope

- In scope: richer domain types, store restructuring, selection state, metadata, element collections, history stack mechanics, immutable update helpers.
- Out of scope: persistence to IndexedDB, full drawing tools, export logic.

## Acceptance criteria

1. The store can represent metadata, element records, selection, and history in a serializable structure consistent with the architecture docs.
2. Undo and redo primitives exist for committed editor actions with a bounded history depth.
3. Existing mode, pan, zoom, and grid behavior continue to work on top of the richer store.
4. No React component becomes the owner of domain state that belongs in the store or core types.

## Edge cases

1. Undo and redo on an empty history do not corrupt state.
2. Rapid repeated commits do not mutate older history snapshots.
3. Invalid grid or metadata inputs do not poison the project state.

## Affected surfaces

- Files: `src/core/types/pcb.ts`, `src/store/editorStore.ts`, possible new helpers under `src/core` or `src/store`.
- Types: project metadata, element variants, selection model, history entries.
- Store/actions: create/update/delete element actions, selection actions, commit/undo/redo actions.
- UI states: existing toolbar and canvas bindings.

## Specialist routing

- Primary: `pcb-core`
- Secondary: `react-ui`

## Test strategy

- Unit: immutable state helper behavior and history helper behavior.
- Integration: store actions for add/select/update/undo/redo.
- Playwright: none beyond smoke impact at this stage.
- CI impact: new `npm run test` coverage becomes mandatory for store changes.

## Validation

- Narrow check: store integration tests for action sequences.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- This task is the substrate for most later feature work and should stay focused on state modeling rather than UI polish.