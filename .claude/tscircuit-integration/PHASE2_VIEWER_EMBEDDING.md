# Phase 2: Viewer Embedding

Status: completed
Completed-At: 2026-05-20

## Goal
Embed tscircuit PCB and schematic preview surfaces into mob-gerb with a mobile-friendly overlay and live project-to-circuit-json updates.

## Implemented
- Added `TscircuitPreviewPanel` overlay component in `src/features/workspace/TscircuitPreviewPanel.tsx`.
- Integrated panel into workspace frame in `src/features/workspace/WorkspaceFrame.tsx`.
- Added mobile/desktop overlay styling in `src/App.css`.
- Added app integration test coverage in `src/App.test.tsx`.

## Behavior
- New `tscircuit Preview` toggle opens a compact overlay panel.
- Panel computes live `circuit-json` from current store project using `exportProjectToTscircuitCircuitJson`.
- PCB and Schematic tabs are provided.
- If `@tscircuit/pcb-viewer` or `@tscircuit/schematic-viewer` are not installed, panel gracefully falls back to a readable JSON preview.

## Validation
- `npm run test -- src/App.test.tsx` passed.
- `npm run lint` passed.
- `npm run build` passed.
