# MOB-GERB

Mobile-first, Fritzing-compatible PCB editor (client-side only).

## Current foundation

- React + Vite + TypeScript setup
- Strict TypeScript enabled
- Domain-first folder structure under `src/core`, `src/store`, `src/components`, and `src/workers`
- Zustand editor mode state machine scaffold
- Inline SVG canvas scaffold with grid snapping helpers

## Claude workflow

- Project instructions live in `CLAUDE.md`
- Slash commands live in `.claude/commands/`
- Task plans live in `docs/backlog/`
- Task templates live in `docs/templates/`
- Workflow state lives in `docs/orchestrator_state.json`

Recommended flow:

1. `/bootstrap` to refresh project context and missing docs.
2. `/task <request>` to write an actionable plan before implementation.
3. `/validate <task-id>` before larger or risky changes.
4. `/execute-task <task-id>` for implementation work.
5. `/review <task-id>` and `/test <task-id>` before merge.
6. `/learn <task-id>` to capture anything worth encoding back into the workflow.

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run build`
