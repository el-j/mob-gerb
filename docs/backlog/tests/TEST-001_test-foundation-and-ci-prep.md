# TEST-001: Test Foundation and CI Prep

- Status: completed
- Plan-Version: 1
- Depends on:

## Goal

Introduce the automated quality backbone required for TDD: Vitest for unit and integration tests, Playwright scaffolding for end-to-end tests, and repo scripts structured so a later GitHub Actions workflow can run the same commands unchanged.

## Scope

- In scope: test dependencies, test scripts, initial Vitest config, initial Playwright config, example passing tests for existing math and app shell behavior, deterministic local test commands.
- Out of scope: full feature coverage, full CI workflow YAML, non-essential coverage thresholds before the suite is stable.

## Acceptance criteria

1. The repo exposes `npm run test`, `npm run test:e2e`, and `npm run test:ci` commands with deterministic behavior.
2. At least one unit test and one integration-oriented UI test exist against current code, proving the harness works before feature work starts.
3. Playwright is configured to start the app locally and execute a baseline smoke test that loads the editor shell.
4. The docs describe how future GitHub Actions should run the same commands without special-case logic.

## Coverage target

- Unit: coordinate helpers in `src/core/math/coordinates.ts`.
- Integration: basic App or store-driven UI render path.
- Playwright: shell smoke test for app load and core toolbar/canvas presence.
- CI: aggregate script wired for later GitHub Actions use.

## Affected surfaces

- Files: `package.json`, Vite test config files, Playwright config, initial test files, test docs.
- Commands/scripts: `test`, `test:e2e`, `test:ci`.
- Workflow: local TDD loop and future CI contract.

## Specialist routing

- Primary: `react-ui`
- Secondary: `pcb-core`

## Validation

- Narrow check: run the new unit test and smoke Playwright test.
- Repo checks: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`, `npm run test:ci`.

## Definition of done

- Test harnesses run locally.
- Behavior tasks can start from failing tests instead of pure implementation.
- Scripts are named and documented for future GitHub Actions reuse.

## Notes

- This task intentionally comes first because every later feature should use these harnesses rather than inventing its own test path.
- Implemented on 2026-05-18.
- Validation run succeeded with: `npm run lint`, `npm run build`, `npm run test`, `npm run test:e2e`, and `npm run test:ci`.