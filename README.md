# Form — Gym Session Planner

A small local-first gym planner built as an end-to-end GitHub Spec Kit case study.

## What it does

- Creates reusable workouts from a 12-exercise catalogue
- Records one active session with per-set completion, kilograms, and repetitions
- Preserves progress across refreshes without an account or backend
- Keeps the 20 most recent immutable session records
- Supports keyboard use and responsive layouts from 375 px to 1440 px

## Run

```powershell
python -m http.server 4173
```

Open `http://localhost:4173`.

## Test

```powershell
node --test
```

The Spec Kit trail starts at [the constitution](.specify/memory/constitution.md) and continues
through [the specification](specs/001-gym-session-planner/spec.md),
[implementation plan](specs/001-gym-session-planner/plan.md), and
[completed task list](specs/001-gym-session-planner/tasks.md).

See [demo-guide.md](specs/001-gym-session-planner/demo-guide.md) for the ten-minute presentation.
