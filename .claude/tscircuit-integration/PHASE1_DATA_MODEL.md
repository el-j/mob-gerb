# Phase 1: Data Model and Interop Foundation

## Goal
Enable mob-gerb to import/export tscircuit “circuit-json” and establish a robust mapping between the two systems’ data models.

## Steps
- [x] Inventory mob-gerb’s core data model (elements, nets, footprints, layers, etc).
- [x] Inventory tscircuit’s “circuit-json” schema (see @tscircuit/core).
- [x] Map fields and identify conversion logic (1:1, computed, lossy, etc).
- [x] Prototype import: load a tscircuit circuit into mob-gerb.
- [x] Prototype export: save a mob-gerb project as tscircuit circuit-json.
- [x] Document mapping, edge cases, and blockers.

## Subagent Assignments
- **core**: schema mapping, conversion logic
- **io**: import/export flows
- **test**: round-trip and edge case tests

## Reporting
- Progress and blockers are tracked here and in ORCHESTRATOR.md.
- Lessons go to LEARNED.md.

## Progress Notes (2026-05-20)
- Confirmed canonical tscircuit schema source is the `circuit-json` package.
- Confirmed `CircuitJson` is an array alias: `type CircuitJson = AnyCircuitElement[]`.
- Confirmed runtime parse contract is `any_circuit_element` zod union and family modules (`source`, `pcb`, `schematic`, `cad`, `simulation`).
- Confirmed core serialization path: `Circuit.getCircuitJson()` and hook path via `RootCircuit.toJson()` in `use-rendered-circuit`.
- Confirmed import/inflation path in core via `inflate-circuit-json` and `createComponentsFromCircuitJson` utilities.

## Execution Notes (2026-05-20)
- Added parser prototype: `src/core/parsers/tscircuitParser.ts`.
- Added exporter prototype: `src/core/exporters/tscircuitExporter.ts`.
- Exposed both via `src/core/parsers/index.ts` and `src/core/exporters/index.ts`.
- Added tests: `src/core/parsers/tscircuitParser.test.ts` and `src/core/exporters/tscircuitExporter.test.ts`.
- Validation: targeted tests passed, plus `npm run lint` and `npm run build` passed.
