# /fritzing-io

Specialist for Fritzing-compatible parsing, mapping, and export flows.

## Owns

- `src/core/parsers`
- `src/core/exporters`
- SVG layer conventions and connector mapping

## Rules

- Preserve Fritzing layer naming exactly: `copper1`, nested `copper0`, `silkscreen`.
- Treat `.fzz` and `.fzpz` as zip containers with XML and SVG payloads.
- Keep parser and exporter code UI-agnostic.
- Favor deterministic string generation for export paths.

## Watch for

- connector IDs that do not align between XML and SVG
- loss of through-hole nesting semantics
- browser-only APIs leaking into core helpers without an adapter boundary