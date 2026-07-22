# Research: Custom Exercise Management

## Decision 1: Schema version bump strategy

**Decision**: Bump `schemaVersion` from `2` to `3` and add a `migrateV2toV3` function that appends `customExercises: []` to any existing state. Chain migrations in `load()`: detect v1 → run V1→V2 → run V2→V3; detect v2 → run V2→V3; detect v3 → pass through.

**Rationale**: The existing pattern in `src/domain/storage.ts` already chains V1→V2 with `isPlannerState` / version-guarded fallbacks. The V2→V3 migration is purely additive and non-destructive: it only adds an empty array for states that pre-date custom exercises. The localStorage key `form.planner.v1` is deliberately unchanged (it refers to app identity, not schema version).

**Alternatives considered**: Using a feature-flag field (`hasCustomExercises`) that defaults to absent was rejected because it bypasses the established migration pattern and complicates `isPlannerState`.

---

## Decision 2: Custom exercise identity

**Decision**: Use `crypto.randomUUID()` (already used in `makeId()` in `workouts.ts` and `sessions.ts`) for stable, client-generated IDs. Custom exercise IDs are stored as strings.

**Rationale**: The app already uses this approach for workout and session IDs. UUIDs are collision-resistant and do not require coordination with any server. A custom exercise ID never collides with a predefined exercise ID because predefined IDs are lowercase slugs (e.g. `bench-press`) while UUIDs contain hyphens and digits only.

**Alternatives considered**: Slug-derived IDs from the exercise name were rejected because they would require updates when an exercise is renamed, breaking `exerciseId` references in stored workouts and sessions.

---

## Decision 3: Uniqueness scope and comparison

**Decision**: Enforce case-insensitive uniqueness of custom exercise names across both predefined and custom exercises. Compare with `.trim().toLowerCase()`. Maximum name length: 50 characters (matching the existing workout name limit).

**Rationale**: A user typing "Bench Press" when "Bench press" exists in the predefined catalogue should get a duplicate error. Using the same 50-character limit keeps validation logic consistent with `validateWorkout`.

**Alternatives considered**: Case-sensitive uniqueness was rejected (confusing UX). A separate custom-only uniqueness scope was rejected (could lead to shadowing of predefined exercises under a different capitalisation).

---

## Decision 4: Category field for custom exercises

**Decision**: Extend `ExerciseCategory` with `'custom'` and assign all custom exercises `category: 'custom'`. The category is displayed in the exercise dropdown label as `{name} · custom` (consistent with `{name} · upper` etc. for predefined exercises).

**Rationale**: The `Exercise` interface requires `category: ExerciseCategory`. The simplest, type-safe approach is to extend the union. No predefined exercise uses `'custom'`, so there is no risk of collision. The `ExerciseCategory` type is only used for display grouping; adding a new member is non-breaking.

**Alternatives considered**: Making `category` optional in `Exercise` was rejected because it would ripple type changes into places that don't concern this feature. Keeping `CustomExercise` as a distinct type never satisfying `Exercise` was rejected because it would require parallel code paths everywhere exercises are consumed.

---

## Decision 5: Retirement approach

**Decision**: Retirement is a soft-delete — a `status` field on `CustomExercise` set to `'retired'`. Retired exercises are excluded from the `activeCatalogue()` result used for new selection. They remain in `state.customExercises` so that existing workout references remain valid for name lookup. Reactivation is supported by resetting `status` to `'active'`.

**Rationale**: The spec requires existing routines and completed session history to remain readable after retirement. Deleting the custom exercise record would break `exerciseName` lookups in history views. Soft-delete preserves referential integrity without duplicating data.

**Alternatives considered**: Cascading deletion (remove exercise from routines) was explicitly excluded by the spec. Archiving to a separate array was rejected (unnecessary complexity; a `status` field on the same record is sufficient).

---

## Decision 6: Measurement type immutability

**Decision**: `measurement` on a custom exercise cannot be changed after creation. No update action for `measurement` is defined. The `RENAME_CUSTOM_EXERCISE` action only updates `name`.

**Rationale**: Sessions snapshot `kind` (`'resistance'` | `'timed'`) from the workout exercise into `SessionExercise`. Changing the measurement type would make historical session data inconsistent (e.g., a set result with `actualReps` for an exercise now classified as `'timed'`). The spec explicitly states this constraint.

---

## Decision 7: Exercise name in session snapshots

**Decision**: `startSession` stores the exercise name at the time of session start by calling a unified `findExerciseName(id, state.customExercises)` function. This replaces the current `exerciseName(id)` call (which only checks predefined exercises). The snapshot in `SessionExercise.exerciseName` is never mutated by a subsequent rename.

**Rationale**: The existing snapshot model in `sessions.ts` already captures `workoutName` and `exerciseName` to make history self-describing. Extending this pattern to custom exercises requires only changing the name-lookup function, not the session data model.

---

## Decision 8: Exercise picker extension

**Decision**: `ExerciseRow.tsx` receives a `catalogue: readonly Exercise[]` prop instead of importing `EXERCISES` directly. Callers (currently `WorkoutEditor`) pass the full `activeCatalogue(state.customExercises)` merged list. A retired custom exercise that is already selected on an existing workout draft still appears in the dropdown (so the existing value displays correctly) but is disabled for new selection; it receives a `[retired]` suffix in its display label.

**Rationale**: Passing the catalogue as a prop makes the component testable in isolation and keeps it decoupled from the state source. The existing `usedIds` disabling pattern extends naturally to retired exercises.

**Alternatives considered**: A separate retired-exercise select entry with its own option group was considered but rejected as unnecessary complexity for the common case. A disabled option with the current value is the standard HTML pattern for "value exists but is no longer selectable".

---

## Decision 9: Custom exercise management entry point

**Decision**: Add a `CustomExerciseEditor` component rendered inline on the Plans page, toggled by a "Manage exercises" button (same pattern as the existing `WorkoutEditor` inline display). No new route is added.

**Rationale**: Adding a route would require new TanStack Router boilerplate and a new nav link. The Plans page already uses an inline toggle for the workout editor. The constitution (Principle V — Simplicity) requires the smallest architecture that satisfies the spec.

**Alternatives considered**: A `/exercises` route was considered and rejected in favour of inline display to avoid new routing infrastructure. A modal/dialog was rejected because the existing design language uses inline panels, and dialogs require additional accessibility work (focus trapping, `aria-modal`).

---

## Decision 10: Domain file placement

**Decision**: New domain functions for custom exercises go in `src/domain/customExercises.ts`. Helper functions shared between `catalog.ts` and `customExercises.ts` (e.g. `activeCatalogue`, `findExercise`) are defined in `src/domain/catalog.ts` alongside predefined exercises.

**Rationale**: Follows the existing one-concern-per-file pattern: `workouts.ts` owns workout CRUD, `sessions.ts` owns session lifecycle. Keeping catalogue-merging helpers in `catalog.ts` keeps the import graph simple (consumers import from `catalog`, not from two files).
