# Quickstart: Exercise Performance Targets

**Feature**: `001-exercise-targets` | **Date**: 2026-07-20

---

## Prerequisites

- Node.js 22+
- `npm install` already run (dependencies pinned in `package.json`)

---

## Run all tests

```bash
npm run test:run
```

Runs Vitest once across `tests/**/*.test.{ts,tsx}` with `jsdom`. Expect all tests to pass on `main`.

## Run tests in watch mode (during development)

```bash
npm test
```

## Type check

```bash
npm run typecheck
```

TypeScript 5.x strict mode. No errors expected on `main`.

## Dev server

```bash
npm run dev
```

Opens the PWA at `http://localhost:5173`. The workout editor is at `/plans`.

---

## Implementing this feature (test-first order)

Follow the task ordering in `specs/001-exercise-targets/tasks.md`. Each task lists the test file to write first, then the implementation file to change. The red→green→refactor cycle applies to each task.

**Key entry points**:

| What to change | File |
|---------------|------|
| Add `measurement` to catalog | `src/domain/catalog.ts` |
| New type union, draft union, schemaVersion | `src/domain/types.ts` |
| `validateWorkout`, `createWorkout`, helpers | `src/domain/workouts.ts` |
| Session snapshot | `src/domain/sessions.ts` |
| v1→v2 migration | `src/domain/storage.ts` |
| Exercise editor UI | `src/components/ExerciseRow.tsx` |
| Workout builder | `src/components/WorkoutEditor.tsx` |
| Active session display | `src/components/SessionExercise.tsx`, `SetRow.tsx` |
| History detail | `src/routes/history.$sessionId.tsx` |
| Plans route draft helpers | `src/routes/plans.tsx` |

**Reference docs**:
- `specs/001-exercise-targets/data-model.md` — exact type shapes, validation rules, migration contract
- `specs/001-exercise-targets/research.md` — design decisions and rationale
