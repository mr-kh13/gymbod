# Data Model: Exercise Performance Targets

**Feature**: `001-exercise-targets` | **Date**: 2026-07-20

Concrete type changes, validation rules, migration contract, and new helper signatures. All changes are in `src/domain/`.

---

## 1. New Type Alias — `ExerciseMeasurement`

Defined in `src/domain/types.ts`:

```typescript
export type ExerciseMeasurement = 'resistance' | 'timed';
```

---

## 2. Modified — `Exercise` (catalog entry)

File: `src/domain/catalog.ts`

```typescript
// Before
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
}

// After — add measurement field
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  measurement: ExerciseMeasurement;   // 'resistance' | 'timed'
}
```

`ExerciseMeasurement` is imported from `../domain/types`.

Classification of existing 12 exercises:

| id | measurement |
|----|-------------|
| bench-press | resistance |
| overhead-press | resistance |
| lat-pulldown | resistance |
| seated-row | resistance |
| biceps-curl | resistance |
| triceps-pushdown | resistance |
| back-squat | resistance |
| deadlift | resistance |
| leg-press | resistance |
| romanian-deadlift | resistance |
| plank | **timed** |
| cable-crunch | resistance |

---

## 3. Modified — `WorkoutExercise` (discriminated union)

File: `src/domain/types.ts`

```typescript
// Before (single interface)
export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  targetReps: number;
}

// After (discriminated union)
export interface ResistanceWorkoutExercise {
  kind: 'resistance';
  exerciseId: string;
  sets: number;
  targetReps: number;
  targetWeightKg?: number;         // optional; finite, 0–1000
  restBetweenSetsSecs?: number;    // optional; integer, 0–600
  restBeforeNextSecs?: number;     // optional; integer, 0–600
}

export interface TimedWorkoutExercise {
  kind: 'timed';
  exerciseId: string;
  sets: number;
  durationSecs: number;            // required; integer, 1–3600
  restBetweenSetsSecs?: number;    // optional; integer, 0–600
  restBeforeNextSecs?: number;     // optional; integer, 0–600
}

export type WorkoutExercise = ResistanceWorkoutExercise | TimedWorkoutExercise;
```

---

## 4. Modified — `SessionExercise` (snapshot discriminated union)

File: `src/domain/types.ts`

```typescript
// Before
export interface SessionExercise extends WorkoutExercise {
  exerciseName: string;
}

// After
export type ResistanceSessionExercise = ResistanceWorkoutExercise & { exerciseName: string };
export type TimedSessionExercise     = TimedWorkoutExercise     & { exerciseName: string };
export type SessionExercise          = ResistanceSessionExercise | TimedSessionExercise;
```

`startSession` in `sessions.ts` spreads the full `WorkoutExercise` (including `kind` and optional fields) and adds `exerciseName`:

```typescript
const plannedExercises: SessionExercise[] = workout.exercises.map((item) => ({
  ...item,
  exerciseName: exerciseName(item.exerciseId),
}));
```

---

## 5. Modified — Draft Types

File: `src/domain/types.ts`

```typescript
// Before (single interface)
export interface WorkoutExerciseDraft {
  exerciseId: string;
  sets: string | number;
  targetReps: string | number;
}

// After (discriminated union; optional numerics use '' for "not set")
export interface ResistanceWorkoutExerciseDraft {
  kind: 'resistance';
  exerciseId: string;
  sets: string | number;
  targetReps: string | number;
  targetWeightKg: string | number;      // '' = not set
  restBetweenSetsSecs: string | number; // '' = not set
  restBeforeNextSecs: string | number;  // '' = not set
}

export interface TimedWorkoutExerciseDraft {
  kind: 'timed';
  exerciseId: string;
  sets: string | number;
  durationSecs: string | number;
  restBetweenSetsSecs: string | number; // '' = not set
  restBeforeNextSecs: string | number;  // '' = not set
}

export type WorkoutExerciseDraft = ResistanceWorkoutExerciseDraft | TimedWorkoutExerciseDraft;
```

`WorkoutDraft.exercises` changes type from `WorkoutExerciseDraft[]` (old) to `WorkoutExerciseDraft[]` (new union) — the field name is unchanged.

---

## 6. Modified — `PlannerState.schemaVersion`

File: `src/domain/types.ts`

```typescript
// Before
export interface PlannerState {
  schemaVersion: 1;
  workouts: Workout[];
  activeSession: Session | null;
  history: Session[];
}

// After
export interface PlannerState {
  schemaVersion: 2;
  workouts: Workout[];
  activeSession: Session | null;
  history: Session[];
}
```

`createDefaultState()` in `storage.ts` returns `{ schemaVersion: 2, ... }`.

---

## 7. Modified — `SetResult` (no change)

`SetResult` is unchanged. For timed exercises, `actualReps` and `actualWeightKg` remain in the schema (both `null` for timed sets by convention). Recording actual duration for timed exercises is out of scope for this feature.

---

## 8. Storage: Migration Contract

File: `src/domain/storage.ts`

### `SCHEMA_VERSION`

```typescript
export const SCHEMA_VERSION = 2 as const;
```

### `migrateV1toV2`

Pure function; no side effects. Exported for testing.

```typescript
export function migrateV1toV2(v1: PlannerStateV1): PlannerState
```

Where `PlannerStateV1` is a local interface:

```typescript
interface WorkoutExerciseV1 {
  exerciseId: string;
  sets: number;
  targetReps: number;
}

interface SessionExerciseV1 extends WorkoutExerciseV1 {
  exerciseName: string;
}

interface SessionV1 extends Omit<Session, 'plannedExercises'> {
  plannedExercises: SessionExerciseV1[];
}

interface PlannerStateV1 {
  schemaVersion: 1;
  workouts: Array<Omit<Workout, 'exercises'> & { exercises: WorkoutExerciseV1[] }>;
  activeSession: SessionV1 | null;
  history: SessionV1[];
}
```

**Migration logic**:

1. For each `WorkoutExerciseV1` entry, look up the catalog. If `measurement === 'timed'` → `{ kind: 'timed', exerciseId, sets, durationSecs: targetReps }`. Otherwise → `{ kind: 'resistance', exerciseId, sets, targetReps }`.
2. Apply the same transform to `plannedExercises` in `activeSession` (if present) and each entry in `history`, also spreading `exerciseName` into the result.
3. Return `{ schemaVersion: 2, workouts, activeSession, history }`.

### Updated `load()` flow

```
raw = storage.getItem(STORAGE_KEY)
  null  → return createDefaultState()
  parse error → throw StorageCorruptionError
  schemaVersion === 1 → migrateV1toV2(parsed) → return migrated
  schemaVersion === 2 && isPlannerState(parsed) → return parsed
  else → throw StorageCorruptionError
```

The migrated state is returned without being immediately saved. It is saved automatically on the next user action (the normal auto-save path in `PlannerContext`).

---

## 9. New Domain Helpers

File: `src/domain/workouts.ts`

### `defaultDraftForExercise`

```typescript
export function defaultDraftForExercise(
  exerciseId: string,
  catalog?: Exercise[],
): WorkoutExerciseDraft
```

Returns a type-correct draft with sensible defaults:

- Resistance: `{ kind: 'resistance', exerciseId, sets: 3, targetReps: 8, targetWeightKg: '', restBetweenSetsSecs: '', restBeforeNextSecs: '' }`
- Timed: `{ kind: 'timed', exerciseId, sets: 3, durationSecs: 30, restBetweenSetsSecs: '', restBeforeNextSecs: '' }`

Used by:
- `WorkoutEditor.addExercise()` (replaces inline object literal)
- `ExerciseRow`'s exercise-select `onChange` handler when the measurement kind changes

### `workoutToDraft`

```typescript
export function workoutToDraft(workout: Workout): WorkoutDraft
```

Converts a stored `Workout` (with `WorkoutExercise[]`) to an editable `WorkoutDraft` (with `WorkoutExerciseDraft[]`). Optional numeric fields absent in the stored object become `''` in the draft. Used in `plans.tsx` for the edit button and the inline-rename dispatch.

---

## 10. Validation Rules (updated)

File: `src/domain/workouts.ts` — `validateWorkout`

### Shared (both kinds)

| Field | Rule | Error message |
|-------|------|--------------|
| `sets` | integer, 1–10 | "Sets must be from 1 to 10." |
| `restBetweenSetsSecs` | if non-empty: integer, 0–600 | "Rest between sets must be from 0 to 600 seconds." |
| `restBeforeNextSecs` | if non-empty: integer, 0–600 | "Rest before next exercise must be from 0 to 600 seconds." |

### Resistance-only

| Field | Rule | Error message |
|-------|------|--------------|
| `targetReps` | integer, 1–100 | "Repetitions must be from 1 to 100." |
| `targetWeightKg` | if non-empty: finite number, 0–1000 (fractional OK) | "Weight must be from 0 to 1,000 kg." |

### Timed-only

| Field | Rule | Error message |
|-------|------|--------------|
| `durationSecs` | integer, 1–3600 | "Duration must be from 1 to 3,600 seconds." |

Error field paths follow the existing convention: `exercises.{index}.{fieldName}`.

---

## 11. UI Rendering Summary (component perspective)

### `ExerciseRow` branches

**Resistance branch** (when `item.kind === 'resistance'`):
- Sets input (number, 1–10, required)
- Target reps input (number, 1–100, required)
- Target weight input (number, 0–1000, step=0.5, optional — labelled "Target weight (kg, optional)")
- Rest between sets input (number, 0–600, optional)
- Rest before next exercise input (number, 0–600, optional)

**Timed branch** (when `item.kind === 'timed'`):
- Sets input (number, 1–10, required)
- Duration input (number, 1–3600, required — labelled "Duration (s)")
- Rest between sets input (number, 0–600, optional)
- Rest before next exercise input (number, 0–600, optional)

### `SessionExercise` eyebrow

```
// Resistance
"{exercise.sets} sets · {exercise.targetReps} reps{exercise.targetWeightKg ? ` @ ${exercise.targetWeightKg} kg` : ''}"

// Timed
"{exercise.sets} sets · {exercise.durationSecs}s"
```

### `SetRow` for timed exercises

Weight input hidden. Actual-reps input hidden. Target display shows duration. Complete toggle is the only interaction.

### History detail (`history.$sessionId.tsx`) per-exercise block

Resistance: `"{sets} sets · {targetReps} reps{targetWeightKg ? ` @ ${targetWeightKg} kg` : ''}"`  
Timed: `"{sets} sets · {durationSecs}s"`  
Rest info (if set): shown as supplementary text beneath the heading.
