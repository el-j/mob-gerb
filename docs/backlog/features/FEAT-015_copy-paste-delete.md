# FEAT-015: Copy, Paste, and Delete

- Status: completed
- Plan-Version: 1
- Depends on: TEST-001, FEAT-002

## Summary

Implement basic clipboard and deletion capabilities. Users should be able to duplicate selected elements, move them, and easily delete them via keyboard shortcuts or UI buttons.

## Scope

- In scope: In-memory clipboard store for copied elements, keyboard shortcuts (Cmd/Ctrl+C, Cmd/Ctrl+V, Backspace/Delete), and store actions for copy/paste/delete.
- Out of scope: System-level clipboard integration for cross-tab copy/paste (unless simple JSON mapping suffices), cross-project copy/paste.

## Acceptance criteria

1. Selecting elements and pressing Cmd/Ctrl+C copies them to an in-memory clipboard.
2. Pressing Cmd/Ctrl+V pastes the clipboard elements with a slight spatial offset to indicate duplication.
3. Pasted elements are automatically selected.
4. Pressing Backspace or Delete removes the currently selected elements from the canvas.

## Edge cases

1. Pasting when nothing is copied does nothing safely.
2. Pasting multiple times stacks elements with progressive offsets.
3. Deleting clears the selection state safely without leaving zombie IDs.

## Affected surfaces

- Files: `src/store/editorStore.ts`, keyboard listener hook or component.
- Types: `EditorState`
- Store/actions: `copySelected`, `pasteCopied`, `deleteSelected`.
- UI states: `PART_CREATOR_MODE`.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: store logic for copying, offsetting, and deleting elements.
- Integration: keyboard events trigger correct store actions.
- Playwright: e2e test doing a copy, paste, and delete.
- CI impact: none

## Validation

- Narrow check: unit tests and playwright.
- Repo checks: `npm run lint`, `npm run test`, `npm run test:e2e:feature`.

## Definition of done

- Behavior implemented.
- Tests added.
- Acceptance criteria mapped to executable checks.
