---
name: pcb-core
description: core
---

# /pcb-core

Specialist for framework-agnostic PCB domain logic.

## Owns

- `src/core/math`
- `src/core/types`
- `src/core/exporters`
- geometry transforms, snapping, and serialization-safe domain data

## Rules

- Keep functions pure unless a file is explicitly an adapter.
- Use millimeter-space values and document conversions.
- Favor precise domain types over loose records.
- Add or update tests when this repo gains a test runner; until then rely on narrow type-safe validation.

## Watch for

- UI state leaking into core logic
- mixed coordinate systems
- implicit unit conversions
- exporter output that is not deterministic