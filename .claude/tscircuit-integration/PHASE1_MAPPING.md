# Phase 1: mob-gerb <-> tscircuit circuit-json Mapping

Date: 2026-05-20
Status: draft-complete (mapping and blockers)

## Scope
- mob-gerb source model: `FootprintProject` and `ElementState` in `src/core/types/pcb.ts`
- tscircuit target model: `CircuitJson = AnyCircuitElement[]` from `circuit-json`
- Target usage: footprint and routing interop for import/export

## High-level model mismatch
- mob-gerb is footprint-editor centric with one project graph.
- tscircuit circuit-json is a multi-view graph (source + pcb + schematic + cad + simulation).
- Interop should initially target source + pcb records only, then expand.

## Field mapping

| mob-gerb | tscircuit circuit-json | Mapping type | Notes |
|---|---|---|---|
| `FootprintProject.projectId` | no direct global ID | computed | emit as `source_project_metadata` extension or custom metadata record |
| `FootprintProject.metadata.name` | `source_project_metadata`/`source_component.name` context | lossy | board-level naming is not a strict required field in all circuits |
| `FootprintProject.gridSize` | no canonical global grid | lossy | store in metadata extension |
| `FootprintProject.layerCount` | `pcb_board.num_layers` | computed | default to 2 when absent |
| `NetState.id` | `source_net.name` or `pcb_net` references | computed | preserve net label and generate missing IDs |
| `NetState.padIds` | derived from `source_port`/`pcb_port` connectivity | computed | requires connector->port expansion |
| `ElementState.id` | `${type}_id` style IDs (`pcb_component_id`, `pcb_smtpad_id`, etc) | computed | deterministic ID mapper needed |
| `ElementState.name` | `source_component.name` / note text names | 1:1/computed | depends on element role |
| `ElementState.pcbLayer` (`copper1`,`copper0`,`silkscreen`) | layer refs (`top`,`bottom`, visible layer enums) | computed | layer translation table required |
| `ElementState.role=connector` + `connector.kind=through-hole` | `pcb_plated_hole` + optional `pcb_port` | computed | through-hole should emit hole + net-capable port |
| `ElementState.role=connector` + `connector.kind=smd` | `pcb_smtpad` + optional `pcb_port` | computed | shape mapping required |
| `ElementState.role=silkscreen` | `pcb_silkscreen_*` or `pcb_note_*` | computed | choose by geometry shape |
| `ElementState.role=copper-surface` | `pcb_smtpad`/`pcb_trace`/`pcb_copper_pour` | computed/lossy | depends on geometry and intent |
| `ElementGeometry.x/y` | element positional fields (`center`, `x/y`, route points) | 1:1/computed | unit base is mm in both systems |
| `ElementGeometry.w/h/r` | width/height/radius fields | 1:1 | shape-dependent |
| `ElementGeometry.points` | polygon/path/trace route arrays | 1:1/computed | convert local-vs-global coordinates consistently |
| `ElementGeometry.strokeWidth` | `stroke_width` / trace width | 1:1/computed | defaulting required when missing |
| `ElementGeometry.filled` | `is_filled` / shape variant | computed | model-specific |

## Suggested v1 export subset (mob-gerb -> circuit-json)
- `pcb_board` (single board)
- `source_component` for connector-bearing elements
- `source_port` for connector pins
- `source_net` for logical nets
- `pcb_smtpad` and `pcb_plated_hole` for pads
- `pcb_trace` for routed polylines
- `pcb_silkscreen_line`/`pcb_silkscreen_path`/`pcb_silkscreen_rect`/`pcb_silkscreen_circle`

## Suggested v1 import subset (circuit-json -> mob-gerb)
- Consume only `pcb_*` and `source_net` + `source_port` records.
- Ignore schematic/cad/simulation families in v1.
- Reconstruct `ElementState` records with stable IDs and role inference from element type.

## Blockers and edge cases
- Layer naming mismatch (`copper1/copper0` vs `top/bottom`) needs canonical translation.
- mob-gerb `group`/composite semantics do not directly map to all tscircuit group constructs.
- circuit-json requires many typed IDs; mob-gerb currently uses flexible IDs.
- Some tscircuit constructs (warnings/errors/simulation) have no mob-gerb home and should be dropped or preserved as sidecar metadata.
- Through-hole nesting and drill semantics must be preserved when converting connector pads.

## Implementation notes
- Keep exporter/importer pure under `src/core`.
- Use deterministic ID factories for stable round-trips.
- Start with pcb+source subsets; add schematic later.
