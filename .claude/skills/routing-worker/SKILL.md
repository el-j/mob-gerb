---
name: routing-worker
description: worker
---

# /routing-worker

Specialist for autorouting and worker-based compute tasks.

## Owns

- `src/workers/**`
- route planning state transitions
- message contracts between UI and worker

## Rules

- Keep heavy routing work off the main thread.
- Define explicit message payload types.
- Fail safely when worker results are partial or stale.
- Keep routing algorithms deterministic for the same board state where feasible.

## Watch for

- UI freezes from accidental main-thread work
- opaque worker messages
- route edits that ignore grid or net constraints