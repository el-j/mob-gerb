# /validate

Challenge a task plan against the actual codebase before implementation starts.

## Procedure

1. Read the task plan and identify every claimed dependency, file target, and interface.
2. Verify those claims against the current codebase.
3. Flag missing state fields, missing components, invalid assumptions, naming mismatches, and scope leaks.
4. Check whether the validation commands in the plan are still correct.
5. Either mark the plan valid or revise it before implementation proceeds.

## Validation checklist

- The target files or nearest owning files exist.
- The named state, types, and exported symbols exist or are explicitly planned.
- Acceptance criteria do not require unplanned infrastructure.
- The plan stays within one coherent implementation slice.
- The proposed tests are executable in this repo.

## Output

- `valid` or `needs-revision`
- exact issues found
- plan updates required before `/execute-task`