# tscircuit Integration — Lessons Learned

- mob-gerb and tscircuit both use TypeScript and have similar concepts (elements, nets, layers, geometry), but field names and nesting differ.
- mob-gerb’s `FootprintProject` is footprint-centric, while tscircuit’s circuit-json is board/circuit-centric (multiple footprints, nets, etc).
- Geometry and layer conventions are similar, but tscircuit may support more advanced/parametric footprints and schematic constructs.
- Interop is feasible but will require careful mapping, especially for group/composite elements, custom roles, and registry/part metadata.
- Both systems are extensible and can share React-based viewers and registry flows.

- Use `circuit-json` as the schema source of truth, not the umbrella `tscircuit` package docs.
- Treat `AnyCircuitElement[]` as a mixed graph of source/pcb/schematic/cad/simulation records; importers must filter by `type` prefix early.
- For interop pipelines, run tscircuit render first (`renderUntilSettled`) before extracting `getCircuitJson()` to avoid partial async artifacts.
- tscircuit supports reverse inflation from circuit-json (`inflate-circuit-json` and `createComponentsFromCircuitJson`), which can inform mob-gerb import design.
- Viewer embedding should degrade gracefully when optional tscircuit viewer packages are absent; keep a JSON preview fallback so mobile workflows stay usable.
- Registry responses may wrap `circuit-json` in different keys (`circuitJson`, `circuit_json`, `data`, nested objects); import adapters should normalize these shapes before parsing.
- Routing workers should use deterministic route IDs and deterministic net ordering so Playwright and regression checks can assert concrete outputs across repeated runs.
- Strategy toggles can be integrated as typed worker request fields first, then upgraded to true engine swaps later without breaking UI/store contracts.

(Keep updating as each phase completes.)
