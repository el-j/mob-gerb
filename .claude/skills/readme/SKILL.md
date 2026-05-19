---
name: readme
description: Claude Command Surface
---

# Claude Command Surface

This project keeps its Claude workflow in-repo so task planning and implementation rules stay versioned with the code.

## Pipeline commands

- `/bootstrap`: refresh local workflow context from the current codebase and docs.
- `/task`: create a task plan under `docs/backlog/`.
- `/validate`: challenge a task plan against the actual implementation.
- `/execute-task`: implement one approved task.
- `/orchestrator`: process queued tasks one at a time.
- `/review`: perform white-box review against the task plan.
- `/test`: run acceptance-focused validation from the plan.
- `/testfix`: classify and repair test failures.
- `/learn`: write back stable lessons.
- `/state`: report backlog and workflow status.
- `/resolve`: resolve merge or plan drift conflicts.

## Specialist commands

- `/pcb-core`
- `/react-ui`
- `/fritzing-io`
- `/routing-worker`

Use the pipeline commands to control process. Use the specialist commands for domain-specific implementation guidance.