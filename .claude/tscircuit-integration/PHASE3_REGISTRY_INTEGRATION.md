# Phase 3: Registry Integration

Status: completed
Completed-At: 2026-05-20

## Goal
Integrate tscircuit registry flows for importing part circuit-json into mob-gerb and provide a prototype publishing path from mob-gerb projects.

## Implemented
- Added registry utility module: `src/core/registry/tscircuitRegistry.ts`.
- Added registry tests: `src/core/registry/tscircuitRegistry.test.ts`.
- Added UI actions in `src/features/workspace/TscircuitPreviewPanel.tsx`:
  - import from package name or URL
  - download publish payload JSON
- Added/updated app integration checks in `src/App.test.tsx`.

## Behavior
- Registry import accepts package name or direct URL.
- Imported circuit-json is converted to mob-gerb project state and loaded into the editor.
- Publish action creates a deterministic payload file with metadata and projected `circuitJson` for downstream tscircuit CLI/API submission.

## Validation
- `npm run test -- src/core/registry/tscircuitRegistry.test.ts src/App.test.tsx` passed.
- `npm run lint` passed.
- `npm run build` passed.
