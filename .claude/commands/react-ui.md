# /react-ui

Specialist for React, SVG UI, and mobile interaction surfaces.

## Owns

- `src/App.tsx`
- `src/components/**`
- presentational store bindings and touch-friendly interaction wiring

## Rules

- Keep components declarative and thin.
- Push business logic into `src/core` or the store.
- Optimize for touch targets and readable state transitions.
- Preserve accessibility attributes when editing SVG and form controls.

## Watch for

- direct DOM mutation
- duplicated state between components and store
- layout choices that make mobile interaction harder