# Data Model: App Modernisation

This document defines the TypeScript types for `src/domain/types.ts`. All entities are identical
in shape to the existing JavaScript data model (schema version 1 is unchanged). Types are added
for the dark mode preference and editor draft state, which previously existed only implicitly.

---

## Exercise

```typescript
type ExerciseCategory = 'upper' | 'lower' | 'core';

interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
}
```

Product-seeded catalogue. Not user-editable. The twelve current entries are kept as an
`Exercise[]` constant in `src/domain/catalog.ts`.

---

## WorkoutExercise

```typescript
interface WorkoutExercise {
  exerciseId: string;   // references Exercise.id
  sets: number;         // 1–10
  targetReps: number;   // 1–100
}
```

Used inside a saved `Workout`. `exerciseName` is deliberately absent; it is denormalised into
`SessionExercise` when a session snapshot is taken, so catalogue name changes do not affect
archived sessions.

---

## Workout

```typescript
interface Workout {
  id: string;
  name: string;         // trimmed, 1–50 characters
  exercises: WorkoutExercise[];  // ordered, at least one, each exerciseId unique within workout
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}
```

Deletion is rejected when the active session references the workout. Editing does not change the
active or archived session snapshot.

---

## SessionExercise

```typescript
interface SessionExercise extends WorkoutExercise {
  exerciseName: string;   // snapshot from catalogue at session start
}
```

Immutable after the session is created.

---

## SetResult

```typescript
interface SetResult {
  exerciseId: string;
  setNumber: number;         // 1-based, unique with exerciseId within a session
  completed: boolean;
  actualWeightKg: number | null;   // 0–1000; null = not recorded
  actualReps: number | null;       // 0–100; null = not recorded
}
```

---

## Session

```typescript
type SessionStatus = 'active' | 'completed';

interface Session {
  id: string;
  workoutId: string;
  workoutName: string;           // immutable snapshot
  plannedExercises: SessionExercise[];   // immutable snapshot
  results: SetResult[];          // one per planned set; mutable while active
  startedAt: string;             // ISO 8601
  finishedAt?: string;           // ISO 8601; present only when status === 'completed'
  status: SessionStatus;
}
```

State transitions: `absent → active → completed`. Discard removes the session without writing
history. Completed sessions are immutable.

---

## PlannerState

```typescript
interface PlannerState {
  schemaVersion: 1;
  workouts: Workout[];
  activeSession: Session | null;
  history: Session[];    // completed sessions only, newest-first, capped at 20
}
```

Persisted to localStorage under key `form.planner.v1` (unchanged from schema version 1).

---

## WorkoutDraft

```typescript
interface WorkoutExerciseDraft {
  exerciseId: string;
  sets: string | number;       // string while the user types; converted on save
  targetReps: string | number;
}

interface WorkoutDraft {
  id: string | null;   // null for a new workout; existing id when editing
  name: string;
  exercises: WorkoutExerciseDraft[];
}
```

`WorkoutDraft` is local React state in `WorkoutEditor`. It is not persisted.

---

## ValidationError

```typescript
interface ValidationError {
  field: string;   // dot-path, e.g. "exercises.0.sets"
  message: string; // plain-language message for the user
}
```

---

## ThemePreference

```typescript
type ThemePreference = 'light' | 'dark' | 'system';
```

Persisted to localStorage under key `form.planner.theme.v1`, separate from planner data.
`'system'` means no manual override is in effect; the CSS `@media (prefers-color-scheme: dark)`
rule determines the active theme. `'light'` or `'dark'` sets `data-theme` on `<html>`,
overriding the system preference.

---

## PlannerAction

```typescript
type PlannerAction =
  | { type: 'CREATE_WORKOUT';    draft: WorkoutDraft }
  | { type: 'UPDATE_WORKOUT';    id: string; draft: WorkoutDraft }
  | { type: 'DELETE_WORKOUT';    id: string }
  | { type: 'DUPLICATE_WORKOUT'; id: string }
  | { type: 'START_SESSION';     workoutId: string }
  | { type: 'RECORD_SET';        exerciseId: string; setNumber: number; values: Partial<SetResult> }
  | { type: 'FINISH_SESSION' }
  | { type: 'DISCARD_SESSION' }
  | { type: 'RESET_DATA' };
```

Each action maps to an existing domain function in `src/domain/workouts.ts` or
`src/domain/sessions.ts`. The reducer in `PlannerContext.tsx` calls the appropriate function and
persists the resulting state via `PlannerRepository`.

---

## Storage keys (reference)

| Key | Value | Purpose |
|-----|-------|---------|
| `form.planner.v1` | `PlannerState` (JSON) | All workout, session, and history data |
| `form.planner.theme.v1` | `ThemePreference` (string) | User's theme override |

---

## Validation rules summary

| Field | Rule |
|-------|------|
| `Workout.name` | Non-blank after trim; ≤ 50 characters |
| `WorkoutExercise.exerciseId` | Must exist in catalogue; unique within the workout |
| `WorkoutExercise.sets` | Integer 1–10 |
| `WorkoutExercise.targetReps` | Integer 1–100 |
| `Workout.exercises` | At least one entry |
| `SetResult.actualWeightKg` | Finite number 0–1000, or null |
| `SetResult.actualReps` | Integer 0–100, or null |
