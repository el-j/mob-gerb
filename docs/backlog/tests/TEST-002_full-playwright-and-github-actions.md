# TEST-002: Full Playwright and GitHub Actions

- Status: completed
- Plan-Version: 1
- Depends on: TEST-001, FEAT-003, FEAT-004, FEAT-006, FEAT-007, FEAT-008, FEAT-009

## Goal

Finish the quality layer for a shippable app: complete the critical Playwright acceptance coverage across the implemented product loops and add a GitHub Actions workflow that runs lint, build, unit/integration tests, and Playwright in CI.

## Scope

- In scope: expanded Playwright suite, shared test fixtures, stable selectors, GitHub Actions workflow YAML, CI startup command, artifact retention or trace config as needed.
- Out of scope: deployment automation, performance budgets beyond basic stability, browser matrix expansion before the suite is stable.

## Acceptance criteria

1. Playwright covers the critical user flows for footprint creation, tagging, Fritzing import/export, airwires, autoroute, trace editing, persistence, and manufacturing export.
2. The CI workflow can install dependencies and run lint, build, unit/integration tests, and Playwright without repo-local hacks.
3. Test failures in CI produce actionable logs, traces, or screenshots.
4. The test docs explain how to reproduce the CI checks locally.

## Coverage target

- Unit: already covered by prior feature tasks; CI must execute them.
- Integration: already covered by prior feature tasks; CI must execute them.
- Playwright: critical-path coverage across the app surface.
- CI: GitHub Actions workflow running the standard repo commands.

## Affected surfaces

- Files: Playwright tests, fixtures, `.github/workflows/*`, test docs, package scripts if needed.
- Commands/scripts: `test:ci` as the CI aggregate path.
- Workflow: GitHub Actions execution contract.

## Specialist routing

- Primary: `react-ui`
- Secondary: `routing-worker`

## Validation

- Narrow check: run the most important Playwright flows locally.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`, `npm run test:ci`.

## Definition of done

- New automated checks run locally.
- The checks are wired into normal repo commands.
- Failure output is actionable.

## Notes

- This task intentionally comes last so CI hardening can target the final real feature surface instead of constantly being rewritten.