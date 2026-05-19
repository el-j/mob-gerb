# FEAT-009: Gerber and Excellon Export

- Status: completed
- Completed: 2026-05-19
- Validation: lint ✓ · build 434KB ✓ · 57/57 unit ✓ · 18/18 feature e2e ✓
- Plan-Version: 1
- Depends on: TEST-001, FEAT-004, FEAT-006, FEAT-007

## Summary

Generate manufacturing artifacts from the editor state: Gerber copper and silkscreen layers plus an Excellon drill file, packaged into a download-ready archive.

## Scope

- In scope: flattened geometry export pipeline, aperture mapping for supported shapes, trace segment emission, drill coordinate extraction, archive packaging.
- Out of scope: every advanced Gerber construct, fabrication rule presets, manufacturing previews.

## Acceptance criteria

1. Supported pads and traces export into deterministic Gerber layer strings.
2. Through-hole or via drill data exports into a deterministic Excellon drill file.
3. Generated output is bundled into a standard archive structure for download.
4. Export errors surface clearly when the project contains unsupported geometry.

## Edge cases

1. Unsupported shape types fail clearly rather than producing malformed manufacturing files.
2. Nested `copper0` inside `copper1` is interpreted correctly for through-hole drill data.
3. Zoom, pan, or UI-only transforms do not leak into manufacturing coordinates.

## Affected surfaces

- Files: `src/core/exporters/index.ts`, possible new Gerber and Excellon modules, export controls.
- Types: export DTOs and manufacturing layer models.
- Store/actions: trigger manufacturing export.
- UI states: export progress and error display.

## Specialist routing

- Primary: `pcb-core`
- Secondary: `fritzing-io`

## Test strategy

- Unit: Gerber and drill file string generation against fixtures.
- Integration: export action flow and unsupported-geometry handling.
- Playwright: export a known-good project and verify archive download is triggered.
- CI impact: manufacturing fixtures must remain deterministic and reviewable.

## Validation

- Narrow check: exporter fixture-based unit tests.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- This task should stay deterministic; golden-file style output fixtures will matter here.