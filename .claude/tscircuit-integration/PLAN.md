# tscircuit Integration Plan

## Goal
Enable mob-gerb to leverage tscircuit’s advanced EDA capabilities, registry, and visualization ecosystem for richer PCB/schematic design, automation, and interoperability.

## Phases

### Phase 1: Data Model and Interop Foundation
- [x] Analyze mob-gerb and tscircuit data models for compatibility.
- [x] Prototype import/export of tscircuit “circuit-json” in mob-gerb.
- [x] Document mapping and conversion logic.

### Phase 2: Visualization and UI Embedding
- [x] Embed tscircuit’s React PCB and schematic viewers in mob-gerb.
- [x] Enable live preview of tscircuit circuits inside mob-gerb.

### Phase 3: Registry and Footprint Ecosystem
- [x] Integrate tscircuit’s registry for part/footprint import.
- [x] Prototype publishing mob-gerb footprints to tscircuit registry.

### Phase 4: Routing, Autolayout, and Automation
- [x] Evaluate tscircuit’s autorouter and autolayout for use in mob-gerb.
- [x] Prototype using tscircuit’s routing as a mob-gerb worker.

### Phase 5: CLI, AI, and Advanced Flows
- [x] Integrate tscircuit CLI for batch export, registry, and AI flows.
- [x] Prototype AI-driven part/footprint generation in mob-gerb via tscircuit.

## Deliverables
- Interop/conversion utilities
- Embedded React viewers
- Registry integration
- Routing/automation worker
- CLI/AI integration
- Documentation and lessons

---

## Orchestration
- Each phase will have a dedicated orchestrator task file and tracked progress.
- Subagents will be used for code, UI, registry, and automation work as appropriate.
- Results and lessons will be reported in the orchestration and task files.
