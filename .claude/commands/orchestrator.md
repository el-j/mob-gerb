# /orchestrator

Process open backlog items sequentially using the local pipeline.

## Queue rules

1. Read `docs/orchestrator_state.json`.
2. Pick the next `ready` task with no unresolved dependency.
3. Run `/validate` if the plan is stale or high risk.
4. Run `/execute-task`, then `/review`, then `/test`.
5. If a task fails validation or tests, send it through `/testfix` up to three attempts.
6. Record stable lessons with `/learn` before moving to the next task.

## Constraints

- Process one task at a time.
- Do not silently skip blocked tasks; mark them blocked with the reason.
- Keep follow-up ideas out of the current task unless they block acceptance criteria.