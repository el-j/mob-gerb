# Testing Strategy

The app must be implemented test-driven from this point forward. No behavior-focused task is complete unless the corresponding automated tests exist at the appropriate layer.

## Test layers

### Unit tests

- Target `src/core/**` first.
- Cover coordinate math, parser helpers, exporter string generation, routing helpers, and DRC calculations.
- Prefer deterministic input/output assertions over snapshot-heavy tests.

### Integration tests

- Cover Zustand store actions and React component interactions that bridge UI to state.
- Focus on editor state transitions, selection, shape movement, tagging, persistence coordination, and worker message boundaries.

### End-to-end tests

- Use Playwright for the critical user journeys only.
- Each feature milestone should add or extend at least one realistic path through the app.
- The suite should cover mobile-oriented interactions where browser automation can represent them reliably.
- Smoke tests are startup guards only. They do not count as feature acceptance coverage.
- Every feature task that changes user-visible behavior must add or update at least one non-smoke Playwright scenario.

## Definition of done for implementation tasks

- The task plan defines unit, integration, and Playwright impact before coding starts.
- The first meaningful implementation step is a failing or missing automated check whenever feasible.
- New behavior ships with matching automated coverage.
- `npm run lint` and `npm run build` stay green.

## Planned repo commands

- `npm run test` for Vitest unit and integration coverage.
- `npm run test:e2e:smoke` for shell health checks.
- `npm run test:e2e:feature` for non-smoke feature acceptance flows.
- `npm run test:ci` as the future aggregate command for GitHub Actions.

## CI target state

When GitHub Actions is added, the default pipeline should run:

1. install dependencies
2. `npm run lint`
3. `npm run build`
4. `npm run test`
5. `npm run test:e2e:smoke`
6. `npm run test:e2e:feature`

Playwright must run headless and use a deterministic local app startup command so the same checks can run on developer machines and in CI.