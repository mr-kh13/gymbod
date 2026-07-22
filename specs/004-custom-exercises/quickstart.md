# Quickstart: Custom Exercise Management

## Overview

This feature adds custom exercise CRUD (create, rename, retire, reactivate) to the existing gym planner. Custom exercises live alongside predefined exercises in the catalogue and can be used in routines. The implementation touches domain, storage, context, and UI layers without adding any new routes, runtime dependencies, or global state.

## Development Order

Follow the test-first sequence required by the constitution:

### 1. Schema & types (`src/domain/types.ts`)
Extend `ExerciseCategory`, add `CustomExercise*` types, bump `PlannerState` to v3. These changes unlock compilation of all downstream code.

### 2. Storage migration (`src/domain/storage.ts`)
Bump `SCHEMA_VERSION` to `3`. Add `migrateV2toV3`. Update `isPlannerState` and `load()`. Write failing tests in `tests/domain/storage.test.ts` for migration correctness.

### 3. Catalogue helpers (`src/domain/catalog.ts`)
Add `activeCatalogue`, `findExercise`, `findExerciseName`. Write unit tests.

### 4. Custom exercise domain (`src/domain/customExercises.ts`)
Implement `validateCustomExercise`, `createCustomExercise`, `renameCustomExercise`, `retireCustomExercise`, `reactivateCustomExercise`. Write failing tests in `tests/domain/customExercises.test.ts` first.

### 5. Session update (`src/domain/sessions.ts`)
Change `startSession` to call `findExerciseName(id, state.customExercises)` for the name snapshot. Extend `tests/domain/sessions.test.ts` with a failing test using a custom exercise.

### 6. Context (`src/context/PlannerContext.tsx`)
Add the 4 new action cases. No new tests needed here — covered by journey tests.

### 7. ExerciseRow (`src/components/ExerciseRow.tsx`)
Add `catalogue` prop; remove hardcoded `EXERCISES` import; handle retired exercises in the dropdown.

### 8. CustomExerciseEditor (`src/components/CustomExerciseEditor.tsx`)
New component: create form + list of custom exercises with rename/retire/reactivate inline actions.

### 9. Plans route (`src/routes/plans.tsx`)
Pass full catalogue to `WorkoutEditor`; render `CustomExerciseEditor` inline with toggle.

### 10. Journey tests (`tests/journeys/customExercises.test.tsx`)
Write full RTL journey tests covering: create, empty-name validation, duplicate-name validation, select in routine, rename, rename-duplicate validation, retire, retired-exercise in existing routine, reactivate.

## Run Tests

```
pnpm test
```

Vitest runs all `tests/**/*.test.{ts,tsx}` files in jsdom. There is no backend.

## Lint

```
pnpm lint
```

Enforces TypeScript strict mode. No new `any` types.

## Key File Map

| Concern | File |
|---------|------|
| Types | `src/domain/types.ts` |
| Storage/migration | `src/domain/storage.ts` |
| Catalogue helpers | `src/domain/catalog.ts` |
| Custom exercise domain | `src/domain/customExercises.ts` *(new)* |
| Session name lookup | `src/domain/sessions.ts` |
| Context / dispatch | `src/context/PlannerContext.tsx` |
| Exercise picker row | `src/components/ExerciseRow.tsx` |
| Custom exercise UI | `src/components/CustomExerciseEditor.tsx` *(new)* |
| Plans page | `src/routes/plans.tsx` |
| Domain tests | `tests/domain/customExercises.test.ts` *(new)* |
| Storage migration tests | `tests/domain/storage.test.ts` |
| Journey tests | `tests/journeys/customExercises.test.tsx` *(new)* |
