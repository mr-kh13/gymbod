# Implementation Plan: Exercise Performance Targets

**Branch**: `main` | **Date**: 2026-07-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-exercise-targets/spec.md`

## Summary

Add type-aware performance targets — sets × reps with optional weight (kg) for resistance exercises; sets × duration (seconds) for timed exercises — plus optional rest times (between sets; before next exercise) to each planned workout exercise. The domain type system gains a `kind` discriminator on `WorkoutExercise`. The localStorage repository migrates eagerly from schema version 1 to 2 on first load with zero data loss. Session snapshots carry the full target state at start time; completed history records are never mutated. All business logic lives in pure domain functions; components and routes call those functions and render results only.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), React 19, Node 22+.

**Primary Dependencies**: `@tanstack/react-router` 1.x, `react` 19, `react-dom` 19 — all already pinned in `package.json`. No new runtime dependencies added.

**Storage**: Browser `localStorage` via the existing versioned `createPlannerRepository`. Schema version bumped 1 → 2 with migrate-on-read logic inside `load()`. Storage key `form.planner.v1` is unchanged; the `schemaVersion` field on the stored object is the migration sentinel.

**Testing**: Vitest 4.x with `jsdom` environment (domain unit tests, migration tests). `@testing-library/react` 16 + `@testing-library/user-event` 14 (RTL journey tests). No new test dependencies. Existing `tests/setup.ts`, `renderAt`, and `memoryRepo` helpers are reused.

**Target Platform**: Browser PWA, 375 px – desktop widths. Offline-first.

**Project Type**: Single-user single-page browser application, local-first.

**Performance Goals**: Standard interactive SPA. `localStorage` round-trips are synchronous and negligible at this data volume.

**Constraints**: No new runtime or dev dependencies. No state-management or form library added. All validation and calculation logic must live in `src/domain/`. Routes and components must not contain persistence or calculation rules.

**Scale/Scope**: Single user. Migration is a one-time in-process operation; no network or server involvement.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|---------|
| I. User-Value Slices | PASS | Spec has 4 prioritised, independently testable stories: P1 resistance targets (MVP), P2 timed targets, P3 rest times, P1 backward compatibility. P1 resistance targets is deployable and usable without the other stories. |
| II. Local-First Privacy | PASS | Data stays in `localStorage`. No network calls introduced. Weight, duration, and rest targets are local planning data only. |
| III. Accessible by Default | PASS | `ExerciseRow` already uses `<fieldset>`/`<legend>`, `aria-invalid`, `aria-describedby`. All new inputs follow the same accessible pattern with visible `<span>` labels and linked error ids. |
| IV. Test-First Delivery | PASS | Domain tests and RTL journey tests for each story are authored red-first before the corresponding implementation task. Enforced in `tasks.md` task ordering. |
| V. Simplicity and Traceability | PASS | No new abstractions beyond the discriminated union. Two new domain helpers (`defaultDraftForExercise`, `workoutToDraft`) justified by the "no calculation in routes" constraint. Every task references a spec story and concrete file paths. |

## Project Structure

### Documentation (this feature)

```text
specs/001-exercise-targets/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

Files modified by this feature (`(new)` marks the one new test file):

```text
src/
├── domain/
│   ├── catalog.ts                  (modify) add measurement: ExerciseMeasurement to each
│   │                                        of the 12 Exercise entries; plank → 'timed'
│   ├── types.ts                    (modify) ExerciseMeasurement type alias; discriminated
│   │                                        ResistanceWorkoutExercise / TimedWorkoutExercise
│   │                                        union; matching Draft union; SessionExercise union;
│   │                                        PlannerState.schemaVersion 1 → 2
│   ├── workouts.ts                 (modify) validateWorkout handles both kinds + rest fields;
│   │                                        createWorkout / updateWorkout map new fields;
│   │                                        duplicateWorkout spreads full WorkoutExercise;
│   │                                        add defaultDraftForExercise(); add workoutToDraft()
│   ├── sessions.ts                 (modify) startSession spreads full WorkoutExercise (kinds
│   │                                        + rest fields) into SessionExercise snapshot
│   └── storage.ts                  (modify) SCHEMA_VERSION = 2; add migrateV1toV2(); update
│                                            isPlannerState() for v2; load() calls migration
│                                            when it reads schemaVersion === 1
└── components/
    ├── ExerciseRow.tsx             (modify) resistance branch: reps + optional weight inputs;
    │                                        timed branch: duration input; both: rest time inputs;
    │                                        exercise-change handler calls defaultDraftForExercise
    ├── WorkoutEditor.tsx           (modify) addExercise() uses defaultDraftForExercise()
    ├── SessionExercise.tsx         (modify) eyebrow shows "N sets · M reps" or "N sets · Xs"
    │                                        based on kind
    └── SetRow.tsx                  (modify) hides reps/weight inputs for timed exercises;
                                             shows duration target in eyebrow

src/routes/
├── plans.tsx                       (modify) newDraft() uses defaultDraftForExercise();
│                                            edit-button handler uses workoutToDraft();
│                                            inline-rename handler uses workoutToDraft()
└── history.$sessionId.tsx          (modify) exercise eyebrow and set-detail row adapt to kind

tests/
├── domain/
│   ├── workouts.test.ts            (modify) resistance: weight optional, rest optional;
│   │                                        timed: durationSecs required; defaultDraftForExercise;
│   │                                        workoutToDraft round-trips
│   ├── sessions.test.ts            (modify) timed snapshot carries durationSecs; rest fields
│   │                                        propagate into SessionExercise
│   └── storage.test.ts             (new)   v1 → v2 migration for resistance exercises, timed
│                                            (plank), active session, history; v2 round-trip;
│                                            corruption path unchanged
└── journeys/
    ├── plans.test.tsx              (modify) set optional weight, rest-between-sets in editor;
    │                                        add plank (timed) and verify duration field shown
    ├── session.test.tsx            (modify) active session renders duration for timed exercise
    └── history.test.tsx            (modify) history detail shows reps or duration by kind;
                                             rest times shown where set
```

**Structure Decision**: Single-project layout retained unchanged. One new test file (`tests/domain/storage.test.ts`) added following the existing TypeScript domain test convention. The legacy `tests/storage.test.js` covers the old plain-JS layer and is not touched. No contracts directory is created — this is a local-first browser app with no external interfaces.

## Complexity Tracking

No constitution violations. No unjustified abstractions introduced.
