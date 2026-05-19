# /bootstrap

Refresh the local Claude workflow for the current state of MOB-GERB.

## Goals

- Scan `src/`, `doc/`, `package.json`, and existing workflow files.
- Detect changes in stack, scripts, architecture, or missing domains.
- Propose updates before editing workflow files.
- Regenerate only what is stale or missing; preserve project-specific learnings.

## Procedure

1. Read `CLAUDE.md`, `.claude/commands/README.md`, `package.json`, and the most relevant docs in `doc/`.
2. Compare current implementation surfaces under `src/` against workflow assumptions.
3. Identify missing or outdated specialist commands, task templates, or backlog structure.
4. Summarize proposed changes.
5. After approval, update only the stale workflow files.

## Required output

- A short repo snapshot.
- A list of stale or missing workflow files.
- A concrete update plan grouped by command, template, or state file.