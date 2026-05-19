# MOB-GERB Claude Instructions

This repository uses a local Claude Code workflow. Prefer the project commands in `.claude/commands/` over ad hoc prompting.

## Project summary

- Stack: React 19, Vite 8, TypeScript 6, Zustand.
- Domain: mobile-first PCB editor with Fritzing-compatible data flow.
- Core rule: keep domain logic in `src/core`; UI components should stay thin.
- Rendering rule: inline SVG, millimeter-oriented coordinates, grid-aware interactions.

## Source of truth

- Product and architecture intent lives in `doc/`.
- Task plans live in `docs/backlog/`.
- Reusable task templates live in `docs/templates/`.
- Runtime orchestration state lives in `docs/orchestrator_state.json`.

## Standard commands

- `/bootstrap` refreshes project context and missing workflow docs.
- `/task <request>` creates or updates a task plan.
- `/validate <task-id>` checks a task plan against the real codebase.
- `/execute-task <task-id>` implements one planned task.
- `/review <task-id>` performs a white-box review against the plan.
- `/test <task-id>` runs acceptance-oriented validation.
- `/learn <task-id>` records reusable lessons into the relevant workflow file.
- `/state` reports workflow and backlog state.

## Quality gates

Before marking a task complete:

1. Check the plan still matches the code being changed.
2. Start from tests or test scaffolding first when the task changes behavior.
3. Run the narrowest useful validation first.
4. Run `npm run lint` for touched TypeScript or React code.
5. Run `npm run build` for cross-project validation when behavior or types changed.
6. Keep unit, integration, and Playwright acceptance coverage aligned with the task plan.
7. Record any follow-up work instead of mixing extra scope into the current task.

## Skill routing

Delegate to the specialist command that best fits the task:

- `pcb-core` for geometry, types, exporters, and pure domain logic.
- `react-ui` for React components, layout, and interaction polish.
- `fritzing-io` for `.fz`, `.fzp`, `.fzz`, `.fzpz`, SVG layer mapping, and import/export.
- `routing-worker` for autorouting, web workers, and longer-running compute flows.

## Project-specific constraints

- Do not introduce `any`.
- Preserve TypeScript strictness.
- Avoid moving core logic into React components.
- Prefer immutable store updates.
- Treat all geometry values as millimeter-space unless a file explicitly documents otherwise.
- If the implementation diverges from the `doc/` specs, either align the code or capture the discrepancy in a task plan or follow-up note.