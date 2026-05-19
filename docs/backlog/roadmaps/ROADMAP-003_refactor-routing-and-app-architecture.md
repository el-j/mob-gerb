# ROADMAP-003: Refactor Routing and App Architecture

- Status: in-progress
- Owner: refactor-program
- Last-Updated: 2026-05-19

## Goal

Refactor the editor shell into a clean, modular architecture that avoids boss-files, enforces reusable component boundaries, and adopts React Router + Tailwind v4 in a controlled way while preserving behavior.

## Why now

- `src/App.tsx` has accumulated multiple responsibilities (file I/O, mode panels, camera controls, DRC panel, routing controls, editor layout).
- Tailwind v4 and React Router are installed but not used as architectural first-class tools.
- The workflow state file was repaired and now validates as strict JSON.

## Verified findings

1. `ROUTING_MODE` exists and is wired in the current app/store, so this is not missing functionality.
2. The primary issue is structural complexity and maintainability, not lack of mode support.
3. Routing + styling infrastructure is available and ready for phased migration.

## Work breakdown

1. REFACTOR-001 (completed): App shell decomposition + router foundation.
2. REFACTOR-002 (completed): Tailwind v4 tokenization and component primitive migration.
3. REFACTOR-003 (ready): Store selector/module extraction for mode panels and workspace controls.

## Non-goals

- No feature expansion in this roadmap.
- No export math or geometry behavior changes.
- No semantics changes to routing, DRC, or autorouter results.

## Architecture target

- Route shell boundary:
  - `/` editor route remains canvas-first.
  - utility routes (`/import`, `/export`, `/settings`, `/docs`) split into module pages.
- Feature module boundaries:
  - app shell layout module
  - file I/O module
  - mode panel modules (`part creator`, `logical`, `trace edit`, `routing`)
  - workspace module
- State access:
  - no large direct store usage in page components
  - selector hooks per feature module

## Quality gates

- Maintain parity with current behavior and e2e flows.
- Keep strict TypeScript and avoid `any`.
- Preserve source-of-truth state in store/core, not DOM.

## Validation policy

Each refactor slice must pass:
- `npm run lint`
- `npm run test`
- `npm run build`
- targeted `npm run test:e2e:feature`
- full `npm run test:ci` at slice completion
