# Tasks: Exercise Performance Targets

**Input**: Design documents from `specs/001-exercise-targets/`

**Prerequisites**: plan.md ✓ | spec.md ✓ | research.md ✓ | data-model.md ✓ | quickstart.md ✓

**Tests**: REQUIRED by constitution. Every user-story phase places test tasks before implementation tasks. Tests must be observed failing before the corresponding implementation task begins.

**Organization**: Tasks are grouped by user story. US1 (resistance targets) and US4 (backward compat) share Phase 3 as both are P1. US2 (timed targets) is Phase 4. US3 (rest times) is Phase 5. Phase 2 is the type-system foundation that all stories depend on.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable — operates on a different file/concern from siblings with [P]
- **[Story]**: Maps to user story in spec.md (US1–US4)
- Every task includes the exact file path it changes or creates

---

## Phase 1: Setup

**Purpose**: Confirm the baseline is green before any type-system changes.

- [ ] T001 Run `npm run test:run` and `npm run typecheck` to confirm all existing tests pass and the project compiles on `main` — no file changes; fix any pre-existing failures before continuing

---

## Phase 2: Foundational — Type System, Domain, and Storage Migration

**Purpose**: Establish the discriminated-union type system, update all domain functions, and implement the v1→v2 storage migration. Every user story depends on this phase. The app must compile and all existing (updated) tests must pass before Phase 3 begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### 2a — Type Foundation (do first; tests in 2b depend on these types)

- [ ] T002 In `src/domain/types.ts`: add `ExerciseMeasurement = 'resistance' | 'timed'`; replace `WorkoutExercise` with `ResistanceWorkoutExercise | TimedWorkoutExercise` discriminated union; update `SessionExercise` to `ResistanceSessionExercise | TimedSessionExercise`; replace `WorkoutExerciseDraft` with `ResistanceWorkoutExerciseDraft | TimedWorkoutExerciseDraft` union; change `PlannerState.schemaVersion` from `1` to `2` — see data-model.md §3–6
- [ ] T003 [P] In `src/domain/catalog.ts`: add `measurement: ExerciseMeasurement` to every `Exercise` entry; set `plank` to `'timed'` and all others to `'resistance'` — see data-model.md §2

### 2b — Write Failing Tests (after T002–T003; run in parallel)

> **Write these NOW and observe them FAIL before continuing to 2c**

- [ ] T004 [P] Create `tests/domain/storage.test.ts`: write failing tests for `migrateV1toV2` covering (a) resistance exercise with `targetReps` → `{ kind: 'resistance', targetReps }`, (b) plank with `targetReps` → `{ kind: 'timed', durationSecs }`, (c) active session migration, (d) history session migration, (e) `schemaVersion 2` round-trip loads without migration — see data-model.md §8
- [ ] T005 [P] In `tests/domain/workouts.test.ts`: add failing tests for (a) `validateWorkout` rejecting invalid `durationSecs` for timed exercise, (b) `validateWorkout` accepting optional empty `targetWeightKg`, (c) `createWorkout` mapping resistance draft to `ResistanceWorkoutExercise`, (d) `defaultDraftForExercise` returning correct kind for resistance and timed exercise ids, (e) `workoutToDraft` round-tripping a `Workout` back to a compilable `WorkoutDraft`

### 2c — Domain Implementation (makes 2b tests pass; sequence matters)

- [ ] T006 In `src/domain/workouts.ts`: update `validateWorkout` to branch on `item.kind` (resistance: validate `targetReps` 1–100 and optional `targetWeightKg` 0–1000; timed: validate `durationSecs` 1–3600); update `createWorkout` and `updateWorkout` to map discriminated draft to `WorkoutExercise`; update `duplicateWorkout` to spread full `WorkoutExercise`; add `defaultDraftForExercise(exerciseId, catalog?)` and `workoutToDraft(workout)` helpers — see data-model.md §9–10
- [ ] T007 In `src/domain/storage.ts`: set `SCHEMA_VERSION = 2`; add local `PlannerStateV1` interface; implement `export function migrateV1toV2(v1: PlannerStateV1): PlannerState`; update `isPlannerState` to check `schemaVersion === 2`; update `createDefaultState` to return `schemaVersion: 2`; update `load()` to call `migrateV1toV2` when raw data has `schemaVersion === 1` — see data-model.md §8
- [ ] T008 In `src/domain/sessions.ts`: update `startSession` to spread the full `WorkoutExercise` (including `kind` and all optional fields) into each `SessionExercise` snapshot alongside `exerciseName`; update `tests/domain/sessions.test.ts` fixtures to add `kind: 'resistance'` to all `WorkoutExercise` literals so they compile against the new union

### 2d — Compilation Fix for Components and Routes

- [ ] T009 Update the following files with the **minimum changes needed to compile** — no new UI features yet; narrowing by `exercise.kind` in rendering; `exercise` union passed instead of `targetReps: number`:
  - `src/components/SetRow.tsx`: change prop from `targetReps: number` to `exercise: SessionExercise`; derive `targetReps` inside with `exercise.kind === 'resistance' ? exercise.targetReps : null`
  - `src/components/SessionExercise.tsx`: pass `exercise={exercise}` to `<SetRow>`; keep eyebrow rendering for now (will be extended in Phase 3)
  - `src/components/ExerciseRow.tsx`: accept `WorkoutExerciseDraft` union; render fields conditionally on `item.kind` — resistance branch shows existing sets/reps inputs; timed branch shows sets and a placeholder duration input (read-only for now); no weight or rest inputs yet
  - `src/components/WorkoutEditor.tsx`: `addExercise` calls `defaultDraftForExercise(exercise.id)`
  - `src/routes/plans.tsx`: `newDraft()` uses `defaultDraftForExercise(EXERCISES[0].id)`; edit-button handler calls `workoutToDraft(workout)`; inline-rename dispatch builds draft via `workoutToDraft({ ...workout, name })`
  - `src/routes/history.$sessionId.tsx`: narrow `exercise.kind` before accessing `targetReps` or `durationSecs` in the eyebrow and per-set rows — keep visual output for resistance exercises as-is; timed exercises may show minimal fallback for now

**Checkpoint**: `npm run typecheck` reports zero errors. `npm run test:run` reports all tests passing (including T004–T005 domain tests now green). The app renders without runtime errors.

---

## Phase 3: US1 + US4 (Priority: P1) — Resistance Exercise Targets + Backward Compatibility 🎯 MVP

**Goal**: Users can set optional target weight on a resistance exercise. All data saved before this feature (schema v1) loads correctly without error.

**Independent Test**: Open the plans editor, add any non-plank exercise, enter a weight in "Target weight (kg, optional)", save, and verify the value appears when reopening the editor. Also load a workout that was created with no target weight and confirm it opens without errors.

**Note**: Backward compatibility (US4) is verified at the domain level by the migration tests in T004/T007. The journey tests here confirm the UI renders migrated and new data without errors.

### Tests for US1 + US4 ⚠️

> **Write these FIRST and observe them FAIL before T014–T016**

- [ ] T010 [P] [US1] In `tests/journeys/plans.test.tsx`: add a test that opens the workout editor, selects a resistance exercise, enters `3` sets, `8` reps, and `60` in the "Target weight (kg, optional)" input, saves, reopens the workout, and asserts the weight input shows `60` — confirms weight target persists through create→edit cycle
- [ ] T011 [P] [US1] In `tests/journeys/plans.test.tsx`: add a test that opens the editor for a workout already in the repository with exercises that have no `targetWeightKg` (backward-compat scenario) and asserts the editor opens without error and the weight input is empty
- [ ] T012 [P] [US1] In `tests/journeys/session.test.tsx`: add a test that starts a resistance session on a workout with `targetWeightKg: 80`, and asserts the `SessionExercise` eyebrow text contains "@ 80 kg"
- [ ] T013 [P] [US1] In `tests/journeys/history.test.tsx`: navigate to a completed session detail that has a resistance exercise with `targetWeightKg: 80`, and assert the history eyebrow contains "@ 80 kg"

### Implementation for US1 + US4

- [ ] T014 [US1] In `src/components/ExerciseRow.tsx`: activate the full resistance branch — add a labelled `<input type="number">` for `targetWeightKg` (min=0, max=1000, step=0.5, optional; aria-invalid + aria-describedby wired to `errors`); `onChange` updates draft with `targetWeightKg: e.target.value`; field renders the stored value or `''` — makes T010, T011 pass
- [ ] T015 [P] [US1] In `src/components/SessionExercise.tsx`: update eyebrow to `"{exercise.sets} sets · {exercise.targetReps} reps{exercise.targetWeightKg ? \` @ \${exercise.targetWeightKg} kg\` : ''}"` for resistance exercises — makes T012 pass
- [ ] T016 [P] [US1] In `src/routes/history.$sessionId.tsx`: update exercise eyebrow to same format as T015 for resistance exercises — makes T013 pass

**Checkpoint**: US1 + US4 independently verifiable. User can set weight on any resistance exercise. Existing workouts open without error. Session and history display weight where set.

---

## Phase 4: US2 (Priority: P2) — Timed Exercise Targets

**Goal**: Users can select plank (or any timed exercise), enter a duration in seconds, and save. The active session and history detail display the duration instead of reps for timed exercises. The reps and weight inputs are hidden for timed exercises.

**Independent Test**: Select plank in the workout editor, verify "Target reps" is not visible and "Duration (s)" is shown, enter `60`, save. Start a session, verify the plank eyebrow reads "3 sets · 60s". Navigate to history after finishing, verify the same format.

### Tests for US2 ⚠️

> **Write these FIRST and observe them FAIL before T021–T024**

- [ ] T017 [P] [US2] In `tests/domain/workouts.test.ts`: add tests for (a) `validateWorkout` rejecting `durationSecs: 0` and `durationSecs: 3601` for a timed exercise, (b) accepting `durationSecs: 60`, (c) `createWorkout` producing a `TimedWorkoutExercise` from a `TimedWorkoutExerciseDraft`
- [ ] T018 [P] [US2] In `tests/journeys/plans.test.tsx`: add a test that selects plank in the workout editor, asserts "Duration (s)" input is visible and "Target reps" input is not present, enters `60` in Duration, saves, reopens the workout, and asserts the duration input shows `60`
- [ ] T019 [P] [US2] In `tests/journeys/session.test.tsx`: add a test that starts a session with a timed exercise (`durationSecs: 60`) and asserts the eyebrow text contains "60s" and does not contain "reps"
- [ ] T020 [P] [US2] In `tests/journeys/history.test.tsx`: navigate to a completed session with a timed exercise and assert the history detail eyebrow contains "60s" and does not contain "reps"

### Implementation for US2

- [ ] T021 [US2] In `src/components/ExerciseRow.tsx`: implement the timed branch — show `<input type="number">` for `durationSecs` (min=1, max=3600, labelled "Duration (s)", required; aria-invalid wired to errors); hide reps and weight inputs; update exercise-select `onChange` to detect a kind change via `exerciseById(newId)?.measurement` and call `defaultDraftForExercise(newId)` when kind differs from current `item.kind` — makes T018 pass
- [ ] T022 [P] [US2] In `src/components/SessionExercise.tsx`: extend eyebrow to show `"{exercise.sets} sets · {exercise.durationSecs}s"` for timed exercises — makes T019 pass
- [ ] T023 [P] [US2] In `src/routes/history.$sessionId.tsx`: extend eyebrow and per-set target display to show `"{exercise.durationSecs}s"` for timed exercises; hide "Target X reps" span for timed exercises — makes T020 pass
- [ ] T024 [US2] In `src/components/SetRow.tsx`: for timed exercises (`exercise.kind === 'timed'`), hide the actual-reps input and the actual-weight input; show the duration target (`{exercise.durationSecs}s`) in the set header instead of targetReps — makes T019 pass (session set rows render correctly for timed exercises)

**Checkpoint**: US2 independently verifiable. Plank opens with a Duration field in the editor; active session and history show seconds notation; reps and weight inputs are absent for timed exercises.

---

## Phase 5: US3 (Priority: P3) — Rest Times

**Goal**: Users can optionally enter rest between sets (0–600 s) and rest before the next exercise (0–600 s) on any planned exercise. These values persist through create/edit cycles and appear in the history detail view.

**Independent Test**: Open the workout editor, enter `90` in "Rest between sets (s, optional)" and `120` in "Rest before next exercise (s, optional)" on any exercise, save, reopen the workout, and verify both values are present. Navigate to a completed session's history detail and verify the rest times appear beneath the exercise heading.

### Tests for US3 ⚠️

> **Write these FIRST and observe them FAIL before T028–T029**

- [ ] T025 [P] [US3] In `tests/domain/workouts.test.ts`: add tests for (a) `validateWorkout` rejecting `restBetweenSetsSecs: -1` and `restBetweenSetsSecs: 601`, (b) accepting `restBetweenSetsSecs: 0` and `restBetweenSetsSecs: 600`, (c) accepting empty-string (not set), (d) same for `restBeforeNextSecs`; assert rest fields propagate into the saved `WorkoutExercise` via `createWorkout`
- [ ] T026 [P] [US3] In `tests/journeys/plans.test.tsx`: add a test that enters `90` in "Rest between sets (s, optional)" and `120` in "Rest before next exercise (s, optional)", saves, reopens the workout, and asserts both inputs show their saved values
- [ ] T027 [P] [US3] In `tests/journeys/history.test.tsx`: navigate to a completed session detail for an exercise that has `restBetweenSetsSecs: 90` and `restBeforeNextSecs: 120`, and assert the detail page contains the text "90" and "120" in a rest-time context

### Implementation for US3

- [ ] T028 [US3] In `src/components/ExerciseRow.tsx`: add `<input type="number">` fields for `restBetweenSetsSecs` (min=0, max=600, labelled "Rest between sets (s, optional)") and `restBeforeNextSecs` (min=0, max=600, labelled "Rest before next exercise (s, optional)") inside both the resistance and timed branches; `onChange` spreads updated rest values; aria error wiring follows the existing `errId` pattern — makes T026 pass
- [ ] T029 [P] [US3] In `src/routes/history.$sessionId.tsx`: below each exercise's set list, conditionally render a rest-time summary when `exercise.restBetweenSetsSecs` or `exercise.restBeforeNextSecs` is defined (e.g., `"Rest between sets: 90 s · Rest before next: 120 s"`) — makes T027 pass

**Checkpoint**: US3 independently verifiable. Rest times can be set, saved, and read back. They appear in completed session history.

---

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Final quality gate across all stories.

- [ ] T030 [P] Run `npm run typecheck` — confirm zero TypeScript strict-mode errors across the entire project; fix any remaining narrowing issues
- [ ] T031 [P] Run `npm run test:run` — confirm all tests pass; investigate and fix any failures before marking done
- [ ] T032 Update `specs/001-exercise-targets/checklists/requirements.md` — mark implementation verification items complete; note any deferred items

---

## Dependencies and Execution Order

### Phase Dependencies

```
Phase 1 (Setup)          → no dependencies
Phase 2 (Foundational)   → depends on Phase 1 (baseline green)
Phase 3 (US1 + US4, P1) → depends on Phase 2 complete ✓
Phase 4 (US2, P2)        → depends on Phase 3 complete
Phase 5 (US3, P3)        → depends on Phase 4 complete
Phase 6 (Polish)         → depends on Phase 5 complete
```

### User Story Dependencies

| Story | Depends on | Can be skipped? |
|-------|-----------|----------------|
| US1 + US4 (Phase 3) | Phase 2 | No — it is the MVP |
| US2 (Phase 4) | Phase 3 | Yes — timed exercises are P2 |
| US3 (Phase 5) | Phase 4 | Yes — rest times are P3 |

### Within Phase 2

```
T002, T003 (parallel)
    ↓
T004, T005 (parallel, depend on T002–T003)
    ↓
T006 (depends on T002, makes T004 pass)
T007 (depends on T002, makes T003 pass)
T008 (depends on T002)
    ↓
T009 (depends on T006, T007, T008)
```

### Within Phase 3

```
T010, T011, T012, T013 (all parallel — write tests first)
    ↓
T014 (makes T010, T011 pass)
T015 (makes T012 pass, parallel with T016)
T016 (makes T013 pass, parallel with T015)
```

### Within Phase 4

```
T017, T018, T019, T020 (all parallel — write tests first)
    ↓
T021 (makes T018 pass; depends on T014)
T022 (makes T019 pass; depends on T015)
T023 (makes T020 pass; depends on T016)
T024 (makes T019 fully pass; depends on T009)
```

### Within Phase 5

```
T025, T026, T027 (all parallel — write tests first)
    ↓
T028 (makes T026 pass; depends on T021)
T029 (makes T027 pass; depends on T023)
```

---

## Parallel Opportunities by Phase

### Phase 2 parallel work

```
# Immediately after T002–T003 are done:
Task A: T004 — migration tests (tests/domain/storage.test.ts)
Task B: T005 — workouts domain tests (tests/domain/workouts.test.ts)

# After T006–T008 are done:
Task A: T009 — all component/route compilation fixes (sequential within)
```

### Phase 3 parallel work

```
# After Phase 2 checkpoint:
Task A: T010 + T011 — resistance weight journey tests (plans.test.tsx)
Task B: T012 — session journey test (session.test.tsx)
Task C: T013 — history journey test (history.test.tsx)

# After T010–T013 are written and failing:
Task A: T014 — ExerciseRow weight input
Task B: T015 — SessionExercise eyebrow
Task C: T016 — history detail eyebrow
```

### Phase 4 parallel work

```
# After Phase 3 checkpoint:
Task A: T017 — timed validation domain tests
Task B: T018 — editor journey test
Task C: T019 — session journey test
Task D: T020 — history journey test

# After T017–T020 are written and failing:
Task A: T021 — ExerciseRow timed branch
Task B: T022 — SessionExercise timed eyebrow
Task C: T023 — history timed display
Task D: T024 — SetRow timed adaptation
```

---

## Implementation Strategy

### MVP First (US1 + US4 only — Phases 1–3)

1. Phase 1: Verify baseline green
2. Phase 2: Type system + migration (foundational)
3. Phase 3: Resistance weight target + backward compat UI
4. **STOP and VALIDATE**: Run `npm run test:run`, manual smoke-test in browser (`npm run dev`), verify weight field works end-to-end in plans editor, session, and history
5. Ship or demo this increment

### Incremental Delivery

| After phase | Capability delivered |
|-------------|---------------------|
| Phase 2 | Type system correct, migration works, app compiles and all tests pass |
| Phase 3 | Resistance exercises accept optional weight target; existing data loads without error |
| Phase 4 | Plank (and any timed exercise) shows duration field; session and history adapt to kind |
| Phase 5 | Rest times between sets and before next exercise persist and display in history |
| Phase 6 | Full regression clean; all stories shippable |

---

## Notes

- **[P]** tasks operate on different files or concerns — they can be executed concurrently by parallel agents or in any order relative to each other
- **[Story]** label maps each task to a spec user story for traceability
- Tests marked with ⚠️ must be written and observed **failing** before implementing the corresponding task
- `npm run typecheck` after T009 must report zero errors before starting Phase 3
- `npm run test:run` must be green at each checkpoint before advancing to the next phase
- T009 is intentionally large (6 files) because all compilation fixes are interdependent; the changes within it are mechanical type narrowings, not new features
- Commit after each checkpoint (at minimum) so the red→green→refactor boundary is visible in git history
