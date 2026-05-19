# ROADMAP-001: Working App Foundation

- Status: planned
- Plan-Version: 1

## Goal

Turn the current scaffold into a real, test-driven, mobile-first PCB editor that can create tagged footprint geometry, import and export Fritzing-compatible artifacts, support logical connectivity and routing, persist drafts, and later run cleanly in GitHub Actions with Vitest and Playwright.

## Current state

- The repo has a basic React shell, a static SVG canvas scaffold, coordinate helpers, and a small editor mode store.
- No feature-complete product flow exists yet.
- No automated tests or CI workflow exist yet.

## Major missing areas

1. Test and CI infrastructure.
2. Real project state and history model.
3. State-driven SVG rendering and shape interaction.
4. Footprint drawing, tagging, and Fritzing part export.
5. Fritzing sketch and part import pipeline.
6. Logical connectivity, autorouting, and trace editing.
7. Persistence, DRC, and manufacturing export.

## Delivery order

1. [TEST-001_test-foundation-and-ci-prep.md](../tests/TEST-001_test-foundation-and-ci-prep.md)
2. [FEAT-001_project-state-and-history-model.md](../features/FEAT-001_project-state-and-history-model.md)
3. [FEAT-002_state-driven-canvas-and-selection.md](../features/FEAT-002_state-driven-canvas-and-selection.md)
4. [FEAT-003_footprint-drawing-and-tagging.md](../features/FEAT-003_footprint-drawing-and-tagging.md)
5. [FEAT-004_fritzing-import-and-part-export.md](../features/FEAT-004_fritzing-import-and-part-export.md)
6. [FEAT-005_logical-nets-and-airwires.md](../features/FEAT-005_logical-nets-and-airwires.md)
7. [FEAT-006_autorouter-worker-mvp.md](../features/FEAT-006_autorouter-worker-mvp.md)
8. [FEAT-007_trace-edit-mode-and-drc.md](../features/FEAT-007_trace-edit-mode-and-drc.md)
9. [FEAT-008_persistence-and-draft-io.md](../features/FEAT-008_persistence-and-draft-io.md)
10. [FEAT-009_gerber-and-excellon-export.md](../features/FEAT-009_gerber-and-excellon-export.md)
11. [TEST-002_full-playwright-and-github-actions.md](../tests/TEST-002_full-playwright-and-github-actions.md)

## Dependency notes

- `TEST-001` is a prerequisite for all behavior tasks because the repo needs test harnesses before TDD is practical.
- `FEAT-001` and `FEAT-002` establish the state and rendering substrate used by almost everything else.
- `FEAT-003` and `FEAT-004` complete the first user-valuable footprint creator loop.
- `FEAT-005` through `FEAT-007` build the interactive PCB editing and routing loop.
- `FEAT-008` and `FEAT-009` harden the app into a usable artifact pipeline.
- `TEST-002` finalizes CI-grade acceptance coverage once the feature surface is real.

## Release checkpoint suggestions

- Milestone A: Footprint creator usable locally after `FEAT-004`.
- Milestone B: Intent-based routing usable locally after `FEAT-007`.
- Milestone C: Persisted drafts and manufacturing export after `FEAT-009`.
- Milestone D: CI-ready release after `TEST-002`.