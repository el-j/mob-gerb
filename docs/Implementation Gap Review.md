# Implementation Gap Review

This document compares the current implementation against the project intent described in the markdown files under `doc/`.

## Implemented foundation

- React, Vite, TypeScript, and Zustand are set up.
- Core PCB domain types exist in `src/core/types/pcb.ts`.
- Coordinate conversion and grid snapping helpers exist in `src/core/math/coordinates.ts`.
- A basic editor mode state machine exists in `src/store/editorStore.ts`.
- A basic inline SVG workspace exists in `src/components/Canvas/PcbCanvas.tsx`.
- The canvas supports single-pointer pan in `VIEW_MODE`, wheel zoom, a visible grid, and a minimal Fritzing-like SVG layer scaffold.
- A mode toolbar exists in `src/components/Toolbar/ModeToolbar.tsx`.

## Missing from Feature 1: Footprint Creator

- No shape creation workflow for pads, lines, rectangles, or text.
- No project metadata state such as part name or author.
- No editable element collection that drives the SVG.
- No selection model for shapes.
- No shape dragging or element-specific grid-snapped movement.
- No tagging UI for assigning through-hole, SMD, or silkscreen roles.
- No connector naming flow such as `connector1pin`.
- No FZP compiler that converts tagged elements into XML.
- No SVG export bundling for part creation.

## Missing from Fritzing Data Pipeline

- `src/core/parsers/index.ts` is a stub and does not parse `.fzz` or `.fzpz` archives.
- No ZIP handling library is installed for archive ingestion.
- No DOMParser-based XML ingestion layer exists.
- No extraction of `.fz`, `.fzp`, or SVG payloads exists.
- No connector mapping between `.fzp` connector definitions and SVG node IDs exists.
- No import flow for existing Fritzing sketches or parts.
- No export flow for `.fzpz` bundles.

## Missing from Mobile UX Strategy

- `LOGICAL_MODE` exists as a mode label only; there is no airwire or net creation behavior.
- `ROUTING_MODE` exists as a mode label only; no UI lock or routing progress behavior exists.
- `EDIT_TRACE_MODE` exists as a mode label only; no trace selection, dimming, or edit handles exist.
- No double-tap gesture handling exists.
- No multi-touch pinch zoom exists.
- No magnetic snapping to related pads exists.
- No haptic feedback integration exists.

## Missing from Autorouting and Worker Design

- `src/workers/autorouter.worker.ts` is empty.
- No worker message protocol exists.
- No pathfinding algorithm exists.
- No board obstacle model, netlist model, or route output format exists.
- No route rendering exists.

## Missing from State Management Architecture

- The store only tracks `mode`, `pan`, `zoom`, and `gridSize`.
- No persisted footprint or board project state exists.
- No IndexedDB layer exists.
- No auto-save or resume flow exists.
- No undo or redo history exists.
- No draft file export exists.
- The current state shape does not yet hold metadata, elements, or nets.

## Missing from Project Implementation Plan

- No drag-and-drop file ingestion flow exists.
- No pan and zoom gestures beyond wheel zoom and pointer pan exist.
- No part placement flow exists.
- No routing output, DRC, or collision checking exists.
- No part creator drawing tools exist.
- No Gerber or Excellon generation exists.
- `src/core/exporters/index.ts` is still a stub.

## Missing from Coding Standards expectations

- Core functions have only minimal JSDoc coverage.
- No unit tests exist for `src/core/`.
- No integration tests exist for store behavior.
- No end-to-end tests exist for critical editor flows.

## Highest-value next steps

1. Build the real project state model in the store: metadata, elements, selection, and history.
2. Replace the static SVG sample with state-driven footprint elements and selection.
3. Implement shape creation, movement, and tagging for the footprint creator.
4. Add parser and exporter foundations with real archive and XML handling.
5. Introduce a test runner and start with unit tests for `src/core/math` and upcoming parser/exporter logic.