# Research: Exercise Performance Targets

**Feature**: `001-exercise-targets` | **Date**: 2026-07-20

Phase 0 research. All decisions below resolve technical unknowns identified from the specification and the user's implementation guidance. No NEEDS CLARIFICATION markers remain.

---

## Decision 1 — TypeScript Discriminated Unions for Exercise Kinds

**Decision**: Use `kind: 'resistance' | 'timed'` as the discriminator on both `WorkoutExercise` and `WorkoutExerciseDraft`. TypeScript narrows the union exhaustively in `if`/`switch` branches under strict mode; no runtime type guard helper is needed beyond checking `item.kind`.

**Rationale**: The two exercise kinds have genuinely different required fields (`targetReps` vs. `durationSecs`). A discriminated union enforces this mutual exclusivity at compile time, prevents mixing fields from different kinds, and makes every narrowing site self-documenting.

**Alternatives considered**:
- *Single interface with optional fields* (`targetReps?: number; durationSecs?: number`) — rejected because TypeScript cannot prevent a caller from setting both or neither; validation must then be fully runtime-based, and IDE completion offers no signal about which fields apply.
- *Two separate types without a `kind` discriminator* — rejected because the `ExerciseRow` component and domain functions need a runtime check to select the correct rendering/validation branch; the `kind` field is that check without needing `instanceof` or duck-typing.

---

## Decision 2 — Storage Migration Strategy

**Decision**: Migrate-on-read within the existing storage key (`form.planner.v1`). The `load()` function in `createPlannerRepository` attempts to parse the raw JSON; if `schemaVersion === 1` it runs `migrateV1toV2()` and returns the upgraded state. The upgraded state is saved immediately on the next dispatch (the normal auto-save path). If `schemaVersion === 2` the existing v2 validator applies. Anything else throws `StorageCorruptionError`.

**Rationale**: The simplest migration path for a single-user local store. One key, one place to read. Migration runs once and is persisted by the first subsequent save. No manual user action needed.

**Alternatives considered**:
- *New key `form.planner.v2`* — would require reading two keys on load, complicating the `load()` contract and leaving stale v1 data in storage. Rejected because the complexity buys nothing in a single-user, single-tab context.
- *Deferred migration (lazy on write)* — rejected because it would require the v1 guard to remain forever and every write path to handle both schemas.

---

## Decision 3 — Catalog Measurement Classification

**Decision**: Add `measurement: ExerciseMeasurement` to each of the 12 `Exercise` entries in `catalog.ts`. Classification:

| Exercise | measurement |
|----------|-------------|
| bench-press | `resistance` |
| overhead-press | `resistance` |
| lat-pulldown | `resistance` |
| seated-row | `resistance` |
| biceps-curl | `resistance` |
| triceps-pushdown | `resistance` |
| back-squat | `resistance` |
| deadlift | `resistance` |
| leg-press | `resistance` |
| romanian-deadlift | `resistance` |
| plank | `timed` |
| cable-crunch | `resistance` |

`plank` is the only timed exercise. `cable-crunch` is resistance (it uses repetitions, not a hold duration).

**Migration for plank in v1 data**: A plank entry stored in v1 has `targetReps`. `migrateV1toV2` looks up each exercise in the catalog; if `measurement === 'timed'` it maps `{ kind: 'timed', durationSecs: item.targetReps }`, treating the old rep count as seconds. This is a reasonable proxy (a user who set "30 reps" almost certainly intended 30 seconds). The user can immediately edit the draft to correct the value.

**Rationale**: The catalog is the single source of truth for exercise metadata. Embedding `measurement` there means the `ExerciseRow` component and the migration function both derive the kind from one consistent source rather than maintaining a second lookup table.

---

## Decision 4 — Draft Kind Switching on Exercise-Id Change

**Decision**: Add a pure domain helper `defaultDraftForExercise(exerciseId: string, catalog?): WorkoutExerciseDraft` in `workouts.ts`. It looks up the exercise in the catalog, reads `measurement`, and returns a type-correct draft with sensible defaults:

- Resistance: `{ kind: 'resistance', exerciseId, sets: 3, targetReps: 8, targetWeightKg: '', restBetweenSetsSecs: '', restBeforeNextSecs: '' }`
- Timed: `{ kind: 'timed', exerciseId, sets: 3, durationSecs: 30, restBetweenSetsSecs: '', restBeforeNextSecs: '' }`

`ExerciseRow`'s exercise-select `onChange` handler checks whether the new exercise ID has a different `measurement` than the current draft `kind`. If so, it calls `defaultDraftForExercise(newId)` to replace the entire exercise draft (field values cannot be meaningfully carried across kinds). If the kind is the same, it updates only `exerciseId`.

**Rationale**: The "no calculation in components" rule means the default-values logic must live in a domain function. Placing it in `workouts.ts` makes it testable in isolation and keeps the component handler to a catalog import + function call.

**Alternatives considered**:
- *Inline the defaults in ExerciseRow* — rejected; violates the routes/components constraint.
- *Preserve sets across kind switch* (and reset only the type-specific field) — accepted as the actual behaviour: `sets` is preserved; `targetReps`/`durationSecs`/`targetWeightKg` are reset to defaults.

---

## Decision 5 — workoutToDraft Conversion Helper

**Decision**: Add `workoutToDraft(workout: Workout): WorkoutDraft` in `workouts.ts`. It converts a stored `WorkoutExercise[]` to `WorkoutExerciseDraft[]` with empty-string placeholders for optional numeric fields. Routes call this when opening the editor for an existing workout and when dispatching the inline-rename action (which passes a `WorkoutDraft` with the current exercises).

**Rationale**: `plans.tsx` currently spreads `workout.exercises` directly into the draft (`exercises: workout.exercises.map((e) => ({ ...e }))`). After the type change, `WorkoutExercise` and `WorkoutExerciseDraft` are no longer structurally compatible (numbers become `string | number`; optional fields are absent vs. `''`). A pure conversion function in `workouts.ts` keeps the route clean and makes the transformation testable.

---

## Decision 6 — Rest Time Storage and Validation

**Decision**: Rest times are stored as `restBetweenSetsSecs?: number` and `restBeforeNextSecs?: number` on both `WorkoutExercise` variants (and consequently on `SessionExercise` snapshots). In drafts, the fields are `string | number` initialised to `''` (empty, meaning "not set"). Validation rules:

- If the field is `''`, it is treated as absent — no error.
- If non-empty, it must be an integer in the range 0–600 (0 = no rest is valid; maximum 10 minutes).

Rest times are displayed in the `ExerciseRow` editor and in the history detail view. They are stored in the session snapshot (so the historical record reflects the targets at session time) but are **not** displayed in the active session view — the running timer is explicitly out of scope.

**Rationale**: 0–600 s covers practical rest periods (0 s for super-sets up to 10 min for heavy strength work). Making 0 valid avoids a special-case null/zero distinction. Storing rest in the snapshot is consistent with how all other targets are snapshotted.

---

## Decision 7 — SetRow Adaptation for Timed Exercises

**Decision**: `SetRow` receives the parent `SessionExercise` (the full discriminated union) instead of just `targetReps: number`. For timed exercises, the weight and actual-reps inputs are hidden; the set row shows the target duration in the eyebrow and only offers the "complete" toggle. `actualReps` in `SetResult` remains `null` for timed sets — no schema change to `SetResult` is needed.

**Rationale**: `SetResult` is the record of what happened; recording actual duration is out of scope. Hiding reps/weight inputs for timed sets avoids confusing users with fields that have no meaning for a hold exercise. The `SetRow` interface change is a prop type update only; the component's rendering logic narrows by `exercise.kind`.

---

## Decision 8 — Optional Weight for Resistance Exercises

**Decision**: `targetWeightKg` is stored as `number | undefined` (absent means not set). In drafts it is `string | number` with `''` representing "not set". Validation: if non-empty, must be a finite number ≥ 0 and ≤ 1000 kg. Fractional values (e.g., 2.5 kg) are valid (no `integer` constraint). Displayed in the `ExerciseRow` as an optional number input labelled "Target weight (kg, optional)"; omitted from the display when absent in the history detail and session view.

**Rationale**: The spec explicitly states weight is optional for resistance exercises. Users planning bodyweight movements (e.g., pull-ups in future) may not want a weight target. 1000 kg is a generous upper bound that prevents absurd values while not constraining any realistic use case.
