# tscircuit Integration Orchestration

## Process
- Each phase is tracked as a separate orchestrator task.
- Subagents are assigned by domain (core, react-ui, registry, automation, AI, etc).
- All results, blockers, and lessons are reported here and in the relevant task file.

## Task List

1. **Data Model Interop**
   - Analyze and map mob-gerb <-> tscircuit data models
   - Prototype import/export of tscircuit “circuit-json”
2. **Viewer Embedding**
   - Embed tscircuit React PCB/schematic viewers in mob-gerb
   - Enable live preview of tscircuit circuits
3. **Registry Integration**
   - Integrate tscircuit registry for part/footprint import
   - Prototype mob-gerb footprint publishing
4. **Routing/Autolayout**
   - Evaluate and prototype tscircuit routing/autolayout as mob-gerb worker
5. **CLI/AI Integration**
   - Integrate tscircuit CLI for batch/AI flows
   - Prototype AI-driven part/footprint generation

## Reporting
- Each completed task is marked here and in its task file.
- Lessons and reusable patterns are recorded in `.claude/tscircuit-integration/LEARNED.md`.

## Current Status (2026-05-20)
- Task 1 (Data Model Interop): completed.
- Task 2 (Viewer Embedding): completed.
- Task 3 (Registry Integration): completed.
- Task 4 (Routing/Autolayout): completed.
- Completed in Task 1:
   - mob-gerb core model inventory
   - tscircuit `circuit-json` schema inventory
   - `@tscircuit/core` serialization/inflation path inventory
-   - field mapping and blocker documentation
-   - import/export prototype stubs in mob-gerb core IO paths
-   - unit tests for parser/exporter stubs
- Completed in Task 2:
   - mobile-friendly preview overlay in workspace frame
   - live circuit-json projection from store project
   - optional dynamic loading for tscircuit viewers with fallback rendering
   - app integration tests and quality gates
- Next active task:
   - Task 5 (CLI/AI Integration)
