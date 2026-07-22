# Data Model: Custom Exercise Management

## New Types

### `CustomExerciseStatus`
```
type CustomExerciseStatus = 'active' | 'retired'
```
Transitions: `active → retired` (retire), `retired → active` (reactivate).

---

### `CustomExercise`
Stored in `PlannerState.customExercises[]`.

| Field | Type | Constraint |
|-------|------|------------|
| `id` | `string` | Stable UUID (client-generated via `crypto.randomUUID()`). Never changes. |
| `name` | `string` | 1–50 characters, trimmed. Case-insensitively unique across predefined + custom exercises. Mutable by rename action. |
| `measurement` | `ExerciseMeasurement` (`'resistance' \| 'timed'`) | Set at creation, **immutable**. |
| `status` | `CustomExerciseStatus` | Default `'active'`. Changed by retire/reactivate actions. |
| `createdAt` | ISO 8601 string | Set once at creation. |
| `updatedAt` | ISO 8601 string | Updated on rename, retire, reactivate. |

---

### `CustomExerciseDraft`
Transient form state used to create a custom exercise.

| Field | Type |
|-------|------|
| `name` | `string` |
| `measurement` | `ExerciseMeasurement` |

---

### Extended `ExerciseCategory`
```
type ExerciseCategory = 'upper' | 'lower' | 'core' | 'custom'
```
All custom exercises carry `category: 'custom'`. Predefined exercises are unchanged.

---

## Modified `PlannerState` (Schema Version 3)

```
PlannerState {
  schemaVersion: 3                    // bumped from 2
  workouts: Workout[]                 // unchanged
  activeSession: Session | null       // unchanged
  history: Session[]                  // unchanged
  customExercises: CustomExercise[]   // NEW field — empty array for migrated state
}
```

---

## Schema Migrations

### V1 → V2 (existing)
Already implemented in `src/domain/storage.ts`. No change.

### V2 → V3 (new)
```
migrateV2toV3(v2: PlannerStateV2): PlannerState
  → { ...v2, schemaVersion: 3, customExercises: [] }
```
The V2 state shape is identical to V3 minus `customExercises`. Migration is purely additive.

### Chain in `load()`
```
raw === null               → createDefaultState() (v3)
schemaVersion === 3        → isPlannerState check → return
schemaVersion === 2        → migrateV2toV3 → return
schemaVersion === 1        → migrateV1toV2 → migrateV2toV3 → return
anything else              → StorageCorruptionError
```

---

## Catalogue Helpers (additions to `src/domain/catalog.ts`)

### `activeCatalogue(customExercises: CustomExercise[]): readonly Exercise[]`
Returns `[...EXERCISES, ...activeCustom]` where `activeCustom` is the subset of `customExercises` with `status === 'active'` mapped to `Exercise` shape (`category: 'custom'`). Used as the selection source for `ExerciseRow` and `validateWorkout`.

### `findExercise(id: string, customExercises: CustomExercise[]): Exercise | undefined`
Searches predefined `EXERCISES` first, then all custom exercises (including retired). Used by `startSession` to resolve the name snapshot and by history views to display retired exercise names.

### `findExerciseName(id: string, customExercises: CustomExercise[]): string`
Returns the exercise name for any ID. Falls back to `'Unknown exercise'` if not found.

---

## New `PlannerAction` Variants

```
| { type: 'CREATE_CUSTOM_EXERCISE'; draft: CustomExerciseDraft }
| { type: 'RENAME_CUSTOM_EXERCISE'; id: string; name: string }
| { type: 'RETIRE_CUSTOM_EXERCISE'; id: string }
| { type: 'REACTIVATE_CUSTOM_EXERCISE'; id: string }
```

---

## Domain Functions (`src/domain/customExercises.ts`)

### `validateCustomExercise`
```
validateCustomExercise(
  draft: CustomExerciseDraft,
  allExercises: readonly Exercise[],   // predefined + active custom
  currentCustom: readonly CustomExercise[],
  excludeId?: string,                  // omit this ID from duplicate check (for rename)
): ValidationError[]
```
Rules:
- `name.trim().length === 0` → `{ field: 'name', message: 'Enter an exercise name.' }`
- `name.trim().length > 50` → `{ field: 'name', message: 'Use 50 characters or fewer.' }`
- Case-insensitive name match in predefined or custom (excluding `excludeId`) → `{ field: 'name', message: 'An exercise with this name already exists.' }`
- No measurement selected → `{ field: 'measurement', message: 'Choose a measurement type.' }` (defensive; UI should prevent this)

### `createCustomExercise`
```
createCustomExercise(
  state: PlannerState,
  draft: CustomExerciseDraft,
  options?: { id?: string; now?: string },
): { state: PlannerState; exercise: CustomExercise | null; errors: ValidationError[] }
```
Validates, generates ID, appends to `state.customExercises`.

### `renameCustomExercise`
```
renameCustomExercise(
  state: PlannerState,
  id: string,
  name: string,
  options?: { now?: string },
): { state: PlannerState; exercise: CustomExercise | null; errors: ValidationError[] }
```
Validates new name (excluding self from duplicate check), updates `name` and `updatedAt`. Does **not** touch `workouts`, `activeSession`, or `history` — those references remain valid via `exerciseId`.

> Note: routines reference by `exerciseId`, not by name. The name in `SessionExercise.exerciseName` (historical snapshot) is never mutated.

### `retireCustomExercise`
```
retireCustomExercise(
  state: PlannerState,
  id: string,
  options?: { now?: string },
): PlannerState
```
Sets `status: 'retired'` and `updatedAt`. Throws if exercise not found.

### `reactivateCustomExercise`
```
reactivateCustomExercise(
  state: PlannerState,
  id: string,
  options?: { now?: string },
): PlannerState
```
Sets `status: 'active'` and `updatedAt`. Throws if exercise not found.

---

## State Transition Diagram

```
             validateCustomExercise passes
                      ↓
   draft ──► createCustomExercise ──► CustomExercise { status: 'active' }
                                              │
                               ┌──────────────┴──────────────┐
                               ▼                             ▼
                      renameCustomExercise            retireCustomExercise
                      (name + updatedAt only)         (status: 'retired')
                                                             │
                                                             ▼
                                                    reactivateCustomExercise
                                                    (status: 'active')
```

---

## Impact on Existing Domain

| File | Change |
|------|--------|
| `src/domain/types.ts` | Add `'custom'` to `ExerciseCategory`; add `CustomExerciseStatus`, `CustomExercise`, `CustomExerciseDraft`; update `PlannerState` to v3; add 4 new `PlannerAction` variants |
| `src/domain/storage.ts` | `SCHEMA_VERSION = 3`; `createDefaultState()` adds `customExercises: []`; add `PlannerStateV2` interface; add `migrateV2toV3`; update `isPlannerState` guard; update `load()` chain |
| `src/domain/catalog.ts` | Add `activeCatalogue`, `findExercise`, `findExerciseName` |
| `src/domain/workouts.ts` | `validateWorkout` accepts `catalog` parameter (already present — no signature change); `defaultDraftForExercise` accepts full catalogue (already parameterised); `exerciseName` delegates to `findExerciseName` from catalog |
| `src/domain/sessions.ts` | `startSession` uses `findExerciseName(id, state.customExercises)` instead of `exerciseName(id)` |
| `src/context/PlannerContext.tsx` | Add 4 new action cases importing functions from `customExercises.ts` |
| `src/components/ExerciseRow.tsx` | Add `catalogue: readonly Exercise[]` prop; remove direct `EXERCISES` import; handle retired custom exercises in dropdown |
| `src/routes/plans.tsx` | Pass `activeCatalogue(state.customExercises)` to `WorkoutEditor` and `validateWorkout`; render `CustomExerciseEditor` inline |
