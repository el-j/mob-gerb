# Phase 1: Data Model Interop — TODO

## mob-gerb Data Model Inventory (done)
- [x] Elements: `ElementState` (id, type, role, pcbLayer, geom, groupId, children, connector, net, name)
- [x] Nets: `NetState` (id, padIds)
- [x] Project: `FootprintProject` (projectId, lastModified, metadata, gridSize, layerCount, elements, nets)
- [x] Layers: string, e.g. 'copper1', 'copper0', 'silkscreen'
- [x] Geometry: `ElementGeometry` (x, y, w, h, r, points, strokeWidth, filled)

## tscircuit Data Model Inventory (done)
- [x] Inventory tscircuit “circuit-json” schema (fields, types, structure)
- [x] Identify @tscircuit/core serialization/parse logic

### Findings (2026-05-20)
- `CircuitJson` is `AnyCircuitElement[]` from `circuit-json` (`src/any_circuit_element.ts`), validated by zod unions.
- Element families are grouped by prefixes: `source_`, `pcb_`, `schematic_`, plus `cad_` and `simulation_`.
- Key PCB elements include `pcb_component`, `pcb_smtpad`, `pcb_plated_hole`, `pcb_port`, `pcb_net`, `pcb_trace`, `pcb_via`, and board/group/cutout/notes/courtyard variants.
- `@tscircuit/core` emits circuit-json through `Circuit.getCircuitJson()` / `RootCircuit.toJson()` after `render()` or `renderUntilSettled()`.
- `@tscircuit/core` supports inflation from circuit-json via `inflate-circuit-json` and `createComponentsFromCircuitJson` (subcircuit and footprint flows).

## Mapping & Conversion
- [x] Map mob-gerb <-> tscircuit fields (1:1, computed, lossy)
- [x] Document edge cases and blockers

## Prototyping
- [x] Prototype import: load tscircuit circuit into mob-gerb (core/io)
- [x] Prototype export: save mob-gerb project as tscircuit circuit-json (core/io)
- [x] Round-trip and edge case tests (test)

## Reporting
- [x] Document mapping, lessons, and blockers in LEARNED.md
- [x] Mark this file and ORCHESTRATOR.md as done when complete
