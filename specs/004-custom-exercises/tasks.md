# Tasks: Custom Exercise Management

**Input**: Design documents from `specs/004-custom-exercises/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Tests**: Tests are REQUIRED by the project constitution. Every user-story phase places behavioral test tasks before implementation tasks.

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in every description

## Path Conventions

Single-project layout: `src/` and `tests/` at repository root.

---

## Phase 1: Setup (Baseline Verification)

**Purpose**: Confirm the existing test suite is green before touching any files.

- [x] T001 Run `pnpm test` and confirm all existing tests pass; note the baseline count for regression detection

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema types, storage migration, and catalogue helpers that every user story depends on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Complete T002–T006 in order before starting any Phase 3+ task.

- [x] T002 Extend `ExerciseCategory` with `'custom'`; add `CustomExerciseStatus`, `CustomExercise`, `CustomExerciseDraft`; bump `PlannerState` to `schemaVersion: 3` with `customExercises: CustomExercise[]`; append four new `PlannerAction` variants (`CREATE_CUSTOM_EXERCISE`, `RENAME_CUSTOM_EXERCISE`, `RETIRE_CUSTOM_EXERCISE`, `REACTIVATE_CUSTOM_EXERCISE`) in `src/domain/types.ts`
- [x] T003 [P] Write failing tests for V2→V3 migration (`migrateV2toV3` adds `customExercises: []`), V1-chain migration (V1→V2→V3), V3 round-trip, and unknown schema version → `StorageCorruptionError`, and `createDefaultState()` returning `schemaVersion: 3` in `tests/domain/storage.test.ts`
- [x] T004 [P] Write failing unit tests for `activeCatalogue` (empty custom → 12 predefined; active custom → included; retired custom → excluded), `findExercise` (predefined hit; custom hit; undefined miss), and `findExerciseName` (returns name or `'Unknown exercise'`) in `tests/domain/catalog.test.ts`
- [x] T005 Implement `SCHEMA_VERSION = 3`, `PlannerStateV2` interface, `migrateV2toV3`, updated `isPlannerState` guard (checks `schemaVersion === 3` and `Array.isArray(customExercises)`), updated `load()` migration chain (v3 → pass, v2 → migrate, v1 → migrate×2), and updated `createDefaultState()` in `src/domain/storage.ts` — observe T003 tests failing then passing
- [x] T006 Add `activeCatalogue(customExercises: CustomExercise[]): readonly Exercise[]`, `findExercise(id, customExercises): Exercise | undefined`, and `findExerciseName(id, customExercises): string` to `src/domain/catalog.ts` — observe T004 tests failing then passing

**Checkpoint**: `pnpm test` green; foundation ready for user story implementation.

---

## Phase 3: User Story 1 — Create a Custom Exercise (Priority: P1) 🎯 MVP

**Goal**: User creates a custom exercise with a unique name and measurement type; it appears in the custom exercise list.

**Independent Test**: Navigate to `/plans`, open exercise manager, create "Cable Face Pull" (resistance) → entry visible in manager list; validation errors appear for empty/duplicate names.

### Tests for User Story 1 ⚠️

> **Write these tests FIRST and confirm they FAIL before implementing T009–T012**

- [x] T007 [P] [US1] Write failing domain unit tests for `validateCustomExercise` (empty name error, whitespace-only error, >50-char error, case-insensitive predefined duplicate, case-insensitive custom duplicate, rename-self allowed via `excludeId`) and `createCustomExercise` (valid draft appends active exercise, invalid draft returns unchanged state + errors, deterministic ID via `options.id`) in `tests/domain/customExercises.test.ts`
- [x] T008 [P] [US1] Write failing RTL journey tests C1–C5: C1 create "Cable Face Pull" → appears in list; C2 empty name → "Enter an exercise name." error; C3 whitespace-only name → same error; C4 "Bench press" → "An exercise with this name already exists."; C5 create "MyMove" then "mymove" → duplicate error in `tests/journeys/customExercises.test.tsx`

### Implementation for User Story 1

- [x] T009 [US1] Create `src/domain/customExercises.ts` implementing `validateCustomExercise` and `createCustomExercise` (import `EXERCISES` and `activeCatalogue` from `./catalog`; use `makeId` with `crypto.randomUUID()` fallback) — observe T007 tests going green
- [x] T010 [US1] Add `import` of `createCustomExercise` and `renameCustomExercise` placeholder (stub) from `./domain/customExercises`; add `case 'CREATE_CUSTOM_EXERCISE': return createCustomExercise(state, action.draft).state;` to `plannerReducer` in `src/context/PlannerContext.tsx`
- [x] T011 [US1] Create `src/components/CustomExerciseEditor.tsx` with props `{ customExercises: CustomExercise[]; onAction: React.Dispatch<PlannerAction> }` rendering: (a) a `<form>` with a labelled name `<input>` (`aria-invalid`, `aria-describedby`), a `<fieldset>` with two measurement radio inputs (`resistance` / `timed`, default `resistance`), an "Add exercise" `<button type="submit">`, and `<ErrorSummary>` for validation errors; (b) an empty-state paragraph "No custom exercises yet." when list is empty; (c) an active-exercise list skeleton (name + measurement display, no rename/retire buttons yet — added in US3/US4)
- [x] T012 [US1] Update `src/routes/plans.tsx`: add `useState(false)` for `showExerciseEditor`; import `CustomExerciseEditor` and `activeCatalogue`; add "Manage exercises" `<button>` to the page heading; render `<CustomExerciseEditor customExercises={state.customExercises} onAction={dispatch} />` when toggled — observe T008 journey tests going green

**Checkpoint**: `pnpm test` green; custom exercise creation and validation fully functional.

---

## Phase 4: User Story 2 — Select a Custom Exercise in a Routine (Priority: P1)

**Goal**: Custom exercises appear in the exercise picker inside the workout editor and can be added to a routine; sessions snapshot the custom exercise name correctly.

**Independent Test**: Create a custom exercise, open the workout editor, verify the custom exercise appears in the `<select>` dropdown; build a routine with it; start a session and confirm the session shows the custom exercise name.

### Tests for User Story 2 ⚠️

> **Write these tests FIRST and confirm they FAIL before implementing T015–T018**

- [x] T013 [P] [US2] Write failing domain test: `startSession` on a workout containing a custom exercise ID resolves `plannedExercises[n].exerciseName` from `state.customExercises` (not `'Unknown exercise'`) in `tests/domain/sessions.test.ts`
- [x] T014 [P] [US2] Write failing RTL journey test C6: create custom exercise "Cable Face Pull" → open new workout editor → picker shows "Cable Face Pull · custom" → select it → save workout → start session → session screen shows "Cable Face Pull" in `tests/journeys/customExercises.test.tsx`

### Implementation for User Story 2

- [x] T015 [US2] In `src/domain/sessions.ts`: replace `import { exerciseName } from './workouts'` with `import { findExerciseName } from './catalog'`; change `exerciseName: exerciseName(item.exerciseId)` to `exerciseName: findExerciseName(item.exerciseId, state.customExercises)` in `startSession` — observe T013 going green
- [x] T016 [US2] In `src/components/ExerciseRow.tsx`: add `catalogue: readonly Exercise[]` to `ExerciseRowProps`; remove `import { EXERCISES } from '../domain/catalog'`; replace all `EXERCISES` references with `catalogue` in the option render and `handleExerciseChange`; before the `<select>` options, check if `item.exerciseId` is absent from `catalogue` (retired custom) and inject a disabled `<option value={item.exerciseId}>{name} [retired]</option>` as the first option
- [x] T017 [US2] In `src/components/WorkoutEditor.tsx`: add `catalogue: readonly Exercise[]` to the component props interface; thread it down to each `<ExerciseRow catalogue={catalogue} ... />`
- [x] T018 [US2] In `src/routes/plans.tsx`: import `activeCatalogue` from `'../domain/catalog'`; derive `const catalogue = activeCatalogue(state.customExercises)` inside `PlansRoute`; pass `catalogue` to `<WorkoutEditor catalogue={catalogue} ...>`; update `newDraft()` to use `catalogue[0].id`; update `validateWorkout(draft, catalogue)` calls — observe T014 journey test going green

**Checkpoint**: `pnpm test` green; custom exercises selectable in routines and visible in sessions.

---

## Phase 5: User Story 3 — Rename a Custom Exercise (Priority: P2)

**Goal**: User renames an active custom exercise; new name appears in the manager list; completed session history retains the original name snapshot.

**Independent Test**: Create a custom exercise, rename it, verify new name shows in list; check that a session completed before the rename still records the original name in `plannedExercises`.

### Tests for User Story 3 ⚠️

> **Write these tests FIRST and confirm they FAIL before implementing T021–T023**

- [x] T019 [P] [US3] Write failing domain unit tests for `renameCustomExercise`: valid rename updates `name` and `updatedAt` only (`createdAt`, `id`, `measurement` unchanged); rename to own current name (with `excludeId`) → no error; rename to existing predefined name → duplicate error; rename to existing custom name → duplicate error; rename unknown ID → throws in `tests/domain/customExercises.test.ts`
- [x] T020 [P] [US3] Write failing RTL journey tests C7–C8: C7 create "Face Pull" → rename to "Cable Face Pull" → "Cable Face Pull" in list; C8 create "MyLift" → try rename to "Bench press" → inline error shown, name unchanged in `tests/journeys/customExercises.test.tsx`

### Implementation for User Story 3

- [x] T021 [US3] Implement `renameCustomExercise` in `src/domain/customExercises.ts`: validate new name with `validateCustomExercise(..., excludeId: id)`; on success update `name` and `updatedAt` on the matching exercise; return `{ state, exercise, errors }` — observe T019 going green
- [x] T022 [US3] Add `import { renameCustomExercise } from '../domain/customExercises'` and `case 'RENAME_CUSTOM_EXERCISE': return renameCustomExercise(state, action.id, action.name).state;` to `plannerReducer` in `src/context/PlannerContext.tsx`
- [x] T023 [US3] Update active exercise list items in `src/components/CustomExerciseEditor.tsx`: add a "Rename" button per active exercise that switches that item to an inline form (`<input>` pre-filled with current name, "Save" and "Cancel" `<button>` elements); on Save dispatch `RENAME_CUSTOM_EXERCISE` and show inline validation errors on failure; on Cancel restore display view; return focus to the Rename button on Cancel — observe T020 going green

**Checkpoint**: `pnpm test` green; rename with validation fully functional.

---

## Phase 6: User Story 4 — Retire a Custom Exercise (Priority: P2)

**Goal**: User retires a custom exercise; it leaves the active catalogue; existing routines remain readable; user can reactivate it.

**Independent Test**: Create exercise, add to a routine, retire it → no longer selectable for new exercises; edit the routine → picker shows retired label for the existing exercise; reactivate → selectable again.

### Tests for User Story 4 ⚠️

> **Write these tests FIRST and confirm they FAIL before implementing T026–T028**

- [x] T024 [P] [US4] Write failing domain unit tests for `retireCustomExercise` (sets `status: 'retired'` and updates `updatedAt`; throws on unknown ID) and `reactivateCustomExercise` (sets `status: 'active'` and updates `updatedAt`; throws on unknown ID); verify `activeCatalogue` excludes retired exercises and `findExercise` still finds them in `tests/domain/customExercises.test.ts`
- [x] T025 [P] [US4] Write failing RTL journey tests C9–C11: C9 create "FaceRow" → retire → gone from active list → appears as "[retired]" → no longer in new-exercise picker dropdown; C10 create routine with "FaceRow" → retire "FaceRow" → edit routine → picker shows "FaceRow [retired]" disabled option; C11 retire "FaceRow" → reactivate → returns to active list and picker in `tests/journeys/customExercises.test.tsx`

### Implementation for User Story 4

- [x] T026 [US4] Implement `retireCustomExercise` and `reactivateCustomExercise` in `src/domain/customExercises.ts`: each finds the exercise by ID (throws if not found), returns updated state with `status` and `updatedAt` changed — observe T024 going green
- [x] T027 [US4] Add `case 'RETIRE_CUSTOM_EXERCISE': return retireCustomExercise(state, action.id);` and `case 'REACTIVATE_CUSTOM_EXERCISE': return reactivateCustomExercise(state, action.id);` to `plannerReducer` in `src/context/PlannerContext.tsx`
- [x] T028 [US4] In `src/components/CustomExerciseEditor.tsx`: render active and retired exercises in the same list; active exercises get a "Retire" button (`aria-label="Retire {name}"`); retired exercises show a `[retired]` badge after the name and get a "Reactivate" button (`aria-label="Reactivate {name}"`) with no Rename button — observe T025 going green

**Checkpoint**: `pnpm test` green; retire/reactivate with existing-routine safety fully functional.

---

## Phase 7: User Story 5 — View and Distinguish Custom vs Predefined (Priority: P3)

**Goal**: Users can distinguish their custom exercises from predefined ones; retired exercises are visually distinct; predefined exercises expose no edit or retire controls anywhere in the exercise manager.

**Independent Test**: Open exercise manager → confirm only user-created exercises appear in the manager list; predefined catalogue exercises (e.g. "Bench press") show no Rename or Retire buttons; exercise picker shows `{name} · custom` label for custom exercises.

### Tests for User Story 5 ⚠️

> **Write this test FIRST and confirm it FAILS before implementing T030**

- [x] T029 [US5] Write failing RTL journey test C12: open exercise manager → search/scan for "Bench press" → confirm no Rename or Retire button exists for predefined entries; confirm custom exercise "CableFaceRow" does show Rename/Retire; confirm exercise picker labels custom exercise as containing "· custom" in `tests/journeys/customExercises.test.tsx`

### Implementation for User Story 5

- [x] T030 [US5] Confirm `src/components/CustomExerciseEditor.tsx` renders only `customExercises` prop entries (no predefined exercises bleed in); add empty-state message "No custom exercises yet." when `customExercises` is empty (if not already present from T011); verify `src/components/ExerciseRow.tsx` option labels include `· custom` for custom exercises via the `activeCatalogue` category field — observe T029 going green

**Checkpoint**: `pnpm test` green; all five user stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete implementation, fix any type or lint issues, and perform a manual end-to-end walkthrough.

- [x] T031 [P] Run `pnpm test` and confirm all tests pass (baseline + new domain tests in `tests/domain/customExercises.test.ts` and `tests/domain/catalog.test.ts` + extended `tests/domain/storage.test.ts` and `tests/domain/sessions.test.ts` + journey tests in `tests/journeys/customExercises.test.tsx`)
- [x] T032 [P] Run `pnpm lint` and resolve any TypeScript strict-mode errors across all modified files (`src/domain/types.ts`, `src/domain/storage.ts`, `src/domain/catalog.ts`, `src/domain/customExercises.ts`, `src/domain/sessions.ts`, `src/context/PlannerContext.tsx`, `src/components/ExerciseRow.tsx`, `src/components/WorkoutEditor.tsx`, `src/components/CustomExerciseEditor.tsx`, `src/routes/plans.tsx`)
- [ ] T033 Perform manual end-to-end walkthrough of all five user stories per `specs/004-custom-exercises/quickstart.md`: create, select in routine, start session, rename, retire with existing routine, reactivate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1 — Create)**: Depends on Phase 2 completion
- **Phase 4 (US2 — Select)**: Depends on Phase 3 completion (custom exercise must exist to be selected)
- **Phase 5 (US3 — Rename)**: Depends on Phase 3 completion (exercise must exist to rename)
- **Phase 6 (US4 — Retire)**: Depends on Phase 3 completion; benefits from Phase 4 (retire + existing routine test needs ExerciseRow updated)
- **Phase 7 (US5 — View)**: Depends on Phases 3–6 completion (visual distinction relies on list content built in prior phases)
- **Phase 8 (Polish)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (Create)**: Pure foundation consumer — no dependency on other stories
- **US2 (Select)**: Requires US1 complete (exercise must exist to be selected in a routine)
- **US3 (Rename)**: Requires US1 complete; independent of US2
- **US4 (Retire)**: Requires US1 complete; journey test C10 requires US2 complete (ExerciseRow retired-option handling)
- **US5 (View)**: Requires US1–US4 complete (all list states must be present to distinguish them)

### Within Each User Story

1. Write tests and confirm they fail (before any implementation)
2. Implement domain functions (domain layer before context/UI)
3. Wire context dispatch cases
4. Implement UI component / route changes
5. Confirm tests go green

### Parallel Opportunities

- **Phase 2**: T003 and T004 can be written in parallel (different test files, same dependency on T002)
- **Phase 3**: T007 and T008 can be written in parallel (different files: domain test vs. journey test)
- **Phase 5**: T019 and T020 can be written in parallel
- **Phase 6**: T024 and T025 can be written in parallel
- **Phase 8**: T031 and T032 can run in parallel (different commands, no shared outputs)

---

## Parallel Example: User Story 1

```
# Write both test files simultaneously (observe failures):
T007: tests/domain/customExercises.test.ts   ← domain test
T008: tests/journeys/customExercises.test.tsx ← RTL journey

# Then implement in order (each unlocks the next):
T009 → T010 → T011 → T012
```

## Parallel Example: User Story 3 (Rename)

```
# Write both test files simultaneously:
T019: tests/domain/customExercises.test.ts  ← rename domain tests
T020: tests/journeys/customExercises.test.tsx ← C7–C8 journey tests

# Implement in order:
T021 (domain) → T022 (context) → T023 (UI)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 only)

1. Complete Phase 1: Baseline verification
2. Complete Phase 2: Foundational schema (T002–T006) — **cannot skip**
3. Complete Phase 3: US1 Create (T007–T012)
4. Complete Phase 4: US2 Select in Routine (T013–T018)
5. **STOP and VALIDATE**: Both P1 stories independently functional; custom exercises usable in real workouts

### Full Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → custom exercise creation with full validation (MVP!)
3. US2 → custom exercise selectable in routines and visible in sessions
4. US3 → rename with history safety
5. US4 → retire/reactivate with existing-routine safety
6. US5 → visual distinction polish
7. Each phase adds value without breaking previous stories

---

## Notes

- [P] marks tasks with different target files and no blocking inter-task dependencies within the phase
- [Story] label maps every task to a spec.md user story for full traceability
- Tests MUST be written and observed failing before the corresponding implementation task starts
- Run `pnpm test` after every checkpoint to catch regressions before they compound
- `src/domain/customExercises.ts` is a new file; `tests/domain/customExercises.test.ts` and `tests/domain/catalog.test.ts` are new test files
- `tests/journeys/customExercises.test.tsx` accumulates journey tests across all phases — write each story's tests in the same file as they are developed
