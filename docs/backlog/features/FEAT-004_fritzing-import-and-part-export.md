# FEAT-004: Fritzing Import and Part Export

- Status: planned
- Plan-Version: 1
- Depends on: TEST-001, FEAT-001, FEAT-003

## Summary

Implement the Fritzing bridge: archive parsing for `.fzz` and `.fzpz`, XML and SVG extraction, connector-to-SVG mapping, and part export for the footprint creator as valid `.fzp` plus SVG content bundled into `.fzpz`.

## Scope

- In scope: archive read/write helpers, DOMParser adapters, extracted domain models, PCB SVG layer ingestion, `.fzp` compilation from tagged state, download-ready part bundle generation.
- Out of scope: Gerber export, autorouting, full PCB sketch editing semantics beyond import display.

## Acceptance criteria

1. Core parser functions can read `.fzpz` and `.fzz` archives and extract the relevant XML and SVG payloads.
2. Imported PCB SVG data preserves `copper1`, nested `copper0`, and `silkscreen` semantics.
3. Tagged footprint projects can compile into deterministic `.fzp` XML and SVG content suitable for bundling into a `.fzpz` archive.
4. The user can trigger an import flow and a part-export flow from the app shell or relevant UI surface.

## Edge cases

1. Missing expected archive members produce typed errors rather than silent failure.
2. Connector IDs referenced in `.fzp` but missing in SVG are surfaced as validation issues.
3. Through-hole nesting is preserved when both copper layers target the same connector.

## Affected surfaces

- Files: `src/core/parsers/index.ts`, `src/core/exporters/index.ts`, possible new parser/exporter modules, app UI for import/export triggers.
- Types: imported archive models, connector maps, export DTOs.
- Store/actions: import project or footprint data, trigger export.
- UI states: import/export controls, error surface.

## Specialist routing

- Primary: `fritzing-io`
- Secondary: `pcb-core`

## Test strategy

- Unit: XML parsing helpers, connector mapping, deterministic `.fzp` generation.
- Integration: import/export action flow with mocked file adapters.
- Playwright: import a fixture archive and export a tagged footprint.
- CI impact: fixture files must be checked into the repo for deterministic runs.

## Validation

- Narrow check: parser/exporter unit suite against fixtures.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`.

## Definition of done

- Behavior implemented.
- Required tests added first or alongside the change.
- Acceptance criteria mapped to executable checks.
- Follow-up items separated from current scope.

## Notes

- Keep browser-specific file and download APIs behind adapter boundaries so the core parser and exporter logic stays unit-testable.