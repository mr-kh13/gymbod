---
name: "open-pr"
description: "Validate completed work, commit and push the current feature branch, then open a GitHub pull request"
argument-hint: "Optional PR title/body guidance"
compatibility: "Requires a git repository with a GitHub remote and GitHub CLI authentication"
metadata:
  author: "project"
  source: "local"
user-invocable: true
disable-model-invocation: true
---

## User Input

```text
$ARGUMENTS
```

Use the user input as optional guidance for the pull request title, body, base branch, or reviewer notes.

## Goal

Open a GitHub pull request only after `/speckit.implement` has completed successfully and the implementation is ready for review.

## Preconditions

Before creating a pull request, verify all of the following:

1. The repository is a git repository: `git rev-parse --is-inside-work-tree`.
2. The current branch is a feature branch, not `main` or `master`.
   - If currently on `main` or `master`, stop and ask the user for the feature branch name. Do not create a PR from the base branch.
3. `/speckit.implement` reported successful completion validation.
4. The relevant `tasks.md` has all implementation tasks checked off.
5. Required validation commands pass:
   - Prefer project guidance from `CLAUDE.md`, `AGENTS.md`, and `specs/*/plan.md`.
   - For this project, run `npm test` and `npm run lint` when the scripts exist in `package.json`.
6. A GitHub remote is configured and the GitHub CLI is available/authenticated:
   - `git remote -v`
   - `gh auth status`

If any precondition fails, do not create a PR. Report the blocker and the exact command or action needed.

## Steps

1. Inspect repository state:
   - `git status --short`
   - `git branch --show-current`
   - `git remote -v`
2. Run validation commands from the preconditions.
3. If there are uncommitted changes:
   - Review the diff summary with `git status --short` and `git diff --stat`.
   - Stage implementation artifacts only; do not stage unrelated local/user files.
   - Commit with a concise message, e.g. `Implement gym session planner` or a message derived from the active spec.
4. Push the current branch:
   - `git push -u origin $(git branch --show-current)`
5. Create the pull request:
   - Detect the default/base branch with `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`; fall back to `main`.
   - Use `gh pr create --base <base-branch> --head <current-branch> --fill` unless the user provided specific title/body guidance.
   - If `--fill` cannot produce a useful body, create a concise body with:
     - Summary of implemented user value
     - Validation commands and results
     - Link/path to the active spec and tasks
6. Report the PR URL and validation status.

## Safety Rules

- Never force-push.
- Never create a PR with failing tests unless the user explicitly approves and the PR body calls out the failures.
- Never include secrets or `.env*` files.
- Never open a PR from `main` or `master`.
- If `gh` is unavailable or unauthenticated, provide manual commands instead of pretending the PR was created.
