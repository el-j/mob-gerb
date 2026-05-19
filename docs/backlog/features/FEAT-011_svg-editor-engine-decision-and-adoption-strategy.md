# FEAT-011: SVG Editor Engine Decision and Adoption Strategy

- Status: completed
- Plan-Version: 1
- Depends on: FEAT-001, FEAT-002, FEAT-003, FEAT-010

## Summary

Evaluate whether mob-gerb should migrate from the current React + Zustand state-driven inline SVG renderer to a third-party SVG editor engine (`@svgdotjs/svg.js` or `svgedit`). The decision must prioritize deterministic Fritzing-compatible data modeling and export safety for Gerber and Excellon generation.

## Scope

- In scope: package maturity assessment, architectural fit analysis, state-model compatibility, mobile UX implications, and a recommended adoption strategy.
- Out of scope: full editor migration, large renderer rewrites, or introducing new editor dependencies without a controlled spike.

## Acceptance criteria

1. A recommendation is documented with clear rationale for one of: full migration, partial adoption, or no migration.
2. The recommendation explicitly addresses mob-gerb product goals: SVG/Gerber transform, multi-layer footprint authoring, and Fritzing compatibility.
3. Risks and constraints are documented for state consistency, testability, and export correctness.
4. A staged rollout strategy is provided if any external library is adopted.

## Edge cases

1. Library-managed DOM transforms diverge from persisted millimeter geometry.
2. Undo/redo and selection models split between external library internals and Zustand state.
3. Mobile/touch interactions regress when relying on desktop-first interaction plugins.
4. Export pipeline accidentally depends on DOM serialization instead of typed state.

## Affected surfaces

- Files: `src/components/Canvas/**`, `src/store/editorStore.ts`, `src/core/types/pcb.ts`, `src/core/exporters/**`, `doc/**`, `docs/backlog/**`.
- Types: geometry and connector typing contracts.
- Store/actions: selection, drag/drop, grouping, and history semantics.
- UI states: `PART_CREATOR_MODE` and interactions that feed exporter data.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Test strategy

- Unit: not required for this decision task unless code changes are introduced.
- Integration: not required for this decision task unless code changes are introduced.
- Playwright: not required for this decision task unless behavior changes are introduced.
- CI impact: none expected for docs-only execution.

## Validation

- Narrow check: verify package metadata and architecture assumptions against current codebase/docs.
- Repo checks: none required for docs-only execution.

## Definition of done

- Decision documented and justified against project goals.
- Follow-up implementation strategy captured.
- Task status updated and orchestration state synchronized.

## Notes

- Keep the editor source of truth in typed state unless a constrained spike proves otherwise.
- Decision (2026-05-19): Do not migrate the core editor to `@svgdotjs/svg.js` or `svgedit`.
- Rationale: mob-gerb depends on deterministic, typed state for Fritzing-compatible layer semantics and future Gerber/Excellon export. A DOM-first editor engine would split source-of-truth and increase export normalization risk.
- Package check: `@svgdotjs/svg.js` is mature and lightweight; `svgedit` exists on npm but has a much heavier dependency and interaction surface. Neither is a good core-engine replacement for the current state-driven architecture.
- Adoption strategy: keep React + Zustand as the authoritative editor model; optionally run a narrow future spike where `svg.js` is used only for ephemeral editor overlays (selection handles/marquee), never as persisted geometry state.
- Guardrails for any future spike:
	1. Exporters must remain pure functions over typed state.
	2. No plugin-owned transforms or DOM state may become persistence truth.
	3. Any overlay experiment must pass mobile interaction and Playwright acceptance checks.
- Validation run for this task: architecture/doc inspection plus npm metadata checks (`npm view @svgdotjs/svg.js ...`, `npm view svgedit ...`).
