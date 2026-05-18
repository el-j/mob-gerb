# FEAT-008: Persistence and Draft I/O

- Status: planned
- Plan-Version: 1
- Depends on: TEST-001, FEAT-001, FEAT-003, FEAT-005

## Summary

Persist editor state locally using IndexedDB, restore drafts on reload, and allow users to import and export the raw project state as a draft file separate from Fritzing part and manufacturing exports.

## Scope

- In scope: IndexedDB adapter, debounced autosave, startup restore, manual draft export, manual draft import, bounded persistence of history if appropriate.
- Out of scope: cloud sync, collaborative editing, remote storage.

## Acceptance criteria

1. Relevant project changes are saved asynchronously to IndexedDB without blocking interaction.
2. Reloading the app restores the last saved draft.
3. Users can export and import raw project drafts as a project-specific file format or JSON.
4. Persistence failures surface actionable feedback instead of silent data loss.

## Edge cases

1. Corrupt draft data is rejected safely.
2. Autosave debouncing does not drop the final committed state.
3. Older stored drafts with missing fields can still be migrated or rejected clearly.

## Affected surfaces

- Files: `src/store/editorStore.ts`, new persistence adapter modules, app bootstrap logic, import/export controls.
- Types: persisted project version and migration types.
- Store/actions: save draft, load draft, clear draft, import raw project.
- UI states: startup restore and persistence status feedback.

## Specialist routing

- Primary: `pcb-core`
- Secondary: `react-ui`

## Test strategy

- Unit: persistence adapter and migration helpers.
- Integration: autosave and restore flow with mocked storage.
- Playwright: create content, reload, and verify draft restore; import/export a draft.
- CI impact: browser storage tests must be deterministic and isolated per run.

## Validation

- Narrow check: persistence integration tests with mocked IndexedDB adapter.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- Keep the adapter boundary clean so storage logic is testable without browser globals in every test.