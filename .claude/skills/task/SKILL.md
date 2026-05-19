---
name: task
description: /task
---

# /task

Turn a request into an executable task plan.

## Inputs

- A plain-language request.
- Optional scope hints such as `feature`, `bugfix`, `refactor`, or a target file.

## Procedure

1. Classify the task as `feature`, `bugfix`, or `refactor`.
2. Route to the relevant specialist keywords:
   - geometry, snapping, coordinates, exporters -> `pcb-core`
   - component, canvas UI, toolbar, layout, touch, mobile -> `react-ui`
   - fritzing, fzp, fzz, svg layer, import, export -> `fritzing-io`
   - autoroute, worker, pathfinding, long-running compute -> `routing-worker`
3. Choose the template from `docs/templates/`.
4. Create the task file in the matching `docs/backlog/` subfolder using the next free ID.
5. Write acceptance criteria that are observable and testable.
6. Capture at least three edge cases.
7. Define the affected public interfaces, store actions, data structures, or files.
8. Add a test strategy covering unit, integration, and Playwright impact.
9. Add a validation plan using the narrowest commands available.
10. Mark whether GitHub Actions or CI workflow changes are required.

## Output format

Return the new task path and a short summary of:

- task type
- acceptance criteria count
- routed specialists
- required validation commands