---
description: "Dependency-ordered implementation tasks for the duplicate workout feature"
---

# Tasks: Duplicate Workout

**Input**: Design documents from `/specs/002-duplicate-workout/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: Required by the project constitution. Behavioral tests are written first and observed
failing before each story's implementation begins.

---

## Phase 1: Foundational (Blocking Prerequisite)

**Purpose**: Align the name length constraint across the codebase before any new code or tests
are written. All new feature tests assume a 50-character limit; this task makes the existing app
consistent with that assumption.

**⚠️ CRITICAL**: Complete before any story work begins.

- [x] T001 Update workout name maximum from 60 to 50 characters: change `> 60` to `> 50` in
  `validateWorkout` in `src/domain.js` and change `maxlength="60"` to `maxlength="50"` in the
  name input in `renderEditor` in `src/ui.js`; run `node --test` and confirm existing tests
  still pass

**Checkpoint**: `node --test` is green; both files enforce the 50-character limit.

---

## Phase 2: User Story 1 — Duplicate a Saved Workout (Priority: P1) 🎯 MVP

**Goal**: A Duplicate action appears on each workout list-item card; triggering it immediately
creates a new independent copy with the same exercises and a deterministic default name.

**Independent Test**: With at least one saved workout, triggering duplication adds a second
workout to `state.workouts` whose exercises match the source's exactly and whose name is
`"Copy of [Original Name]"`. The source workout is identical before and after.

### Tests for User Story 1

> **Write these tests FIRST. Run `node --test` and confirm they FAIL before moving to T004.**

- [x] T002 [P] [US1] Write failing `duplicateWorkout` unit tests in `tests/domain.test.js`:
  (a) creates copy with identical exercises in the same order; (b) assigns default name
  `"Copy of [Name]"`; (c) generates unique suffix `"(2)"`, `"(3)"` when the default name
  collides with an existing workout; (d) truncates the full candidate string (including suffix)
  to 50 characters; (e) throws `"Workout not found."` when the source ID does not exist;
  (f) the source workout is unmodified after duplication

- [x] T003 [P] [US1] Write failing P1 journey test in `tests/journeys.test.js`: duplicating a
  workout increases `state.workouts.length` by 1, the new entry's exercises deep-equal the
  source's, and the new entry can be passed to `startSession` without error

### Implementation for User Story 1

- [x] T004 [US1] Implement `duplicateWorkout(state, workoutId, options = {})` in `src/domain.js`
  returning `{ state, workout }`: deep-copy source exercises; build default name
  `"Copy of " + source.name` then suffix `" (2)"`, `" (3)"` on collision, each candidate
  truncated to 50 characters; assign new id via `makeId()`; set `createdAt`/`updatedAt` to
  `options.now ?? new Date().toISOString()`; append to `state.workouts`; export the function

- [x] T005 [P] [US1] Add a Duplicate button to each workout card in `renderPlans` in `src/ui.js`:
  `<button type="button" class="secondary" data-action="duplicate-workout" data-id="${workout.id}"
  aria-label="Duplicate ${escapeHtml(workout.name)}">Duplicate</button>` alongside the existing
  Start / Edit / Delete buttons

- [x] T006 [US1] Wire the duplicate-workout action in `src/app.js`: (a) add
  `let renamingId = null` module-level state; (b) import `duplicateWorkout` from `./domain.js`;
  (c) handle `action === "duplicate-workout"`: call `duplicateWorkout(state, id)`, assign result
  to `state`, set `renamingId = workout.id`, call `persist("Workout duplicated.")`, call
  `render()`, then focus and select the rename input via
  `app.querySelector('[data-rename-input][data-id="${renamingId}"]')`; (d) pass `renamingId`
  as a parameter through `renderApp` and `renderPlans` so the rename card state can be rendered
  in the next phase

**Checkpoint**: `node --test` passes T002 and T003; clicking Duplicate in the browser adds a
"Copy of …" card to the list and stores it in localStorage.

---

## Phase 3: User Story 2 — Rename the Duplicate Immediately (Priority: P2)

**Goal**: When a duplicate is created its name field is pre-focused; the user can type a new
name and confirm it, or dismiss the field to keep the default name.

**Independent Test**: After duplication, the rendered card for `renamingId` contains a text
input pre-filled with the default name; confirming an empty value is rejected with an
announcement; confirming a valid name persists the rename; cancelling leaves the default name.

### Tests for User Story 2

> **Write this test FIRST. Run `node --test` and confirm it FAILS before moving to T008.**

- [x] T007 [US2] Write failing P2 journey test in `tests/journeys.test.js`: (a) after
  `duplicateWorkout`, calling `updateWorkout` with the new id and a custom name succeeds and
  the renamed workout appears in `state.workouts`; (b) calling `updateWorkout` with an empty
  name returns a non-empty `errors` array; (c) calling `updateWorkout` with the default name
  (cancel scenario) leaves the workout unchanged

### Implementation for User Story 2

- [x] T008 [US2] Update `renderPlans` in `src/ui.js` to accept `renamingId` and render an
  inline-rename card when `workout.id === renamingId`: replace the name heading with
  `<input data-rename-input data-id="${workout.id}" type="text" maxlength="50"
  aria-label="Workout name" value="${escapeHtml(workout.name)}">` and show two buttons —
  `<button data-action="confirm-rename" data-id="${workout.id}">Save name</button>` and
  `<button data-action="cancel-rename" data-id="${workout.id}">Keep default</button>` — hiding
  Start / Edit / Delete / Duplicate for that card while renaming; update `renderApp` signature
  to accept and forward `renamingId`

- [x] T009 [US2] Handle inline rename actions and navigation in `src/app.js`: (a)
  `action === "confirm-rename"`: read the input value, call
  `updateWorkout(state, id, { name: inputValue, exercises: workout.exercises })`, if errors
  announce the first error message and return, else assign new state, set `renamingId = null`,
  call `persist("Workout renamed.")`, call `render()`; (b) `action === "cancel-rename"`: set
  `renamingId = null`, call `render()`; (c) in the `hashchange` listener, add
  `renamingId = null` alongside the existing resets; (d) pass `renamingId` to `renderApp` in
  the `render()` call

- [x] T010 [P] [US2] Add inline-rename layout styles in `src/styles.css` if the pre-focused
  input and Save/Keep buttons require layout adjustments beyond the existing `.card-actions`
  and `.field` rules (e.g., full-width name input with adjacent button row)

**Checkpoint**: `node --test` passes T007; in the browser, the newly duplicated card has a
focused name input; Save name and Keep default both work without navigating away.

---

## Phase 4: User Story 3 — Edit the Duplicate Independently (Priority: P3)

**Goal**: Any change made to either the original or the duplicate is invisible to the other;
deleting the original leaves the duplicate fully intact and startable.

**Independent Test**: After duplication, editing and saving the duplicate's exercises via
`updateWorkout` produces no change in the source's exercises; after deleting the source via
`deleteWorkout` the duplicate remains in `state.workouts` and can start a session.

> **Note — no new implementation tasks**: Independence is guaranteed by the deep-copy in T004.
> These tests confirm that guarantee and will pass once T004 is correctly implemented.

### Tests for User Story 3

> **Write these tests FIRST. Run `node --test` and confirm they FAIL (or remain pending)
> before moving on; they will pass once T004 is complete.**

- [x] T011 [P] [US3] Write failing independence tests in `tests/domain.test.js`: (a) updating
  the duplicate's exercises via `updateWorkout` leaves the source's `exercises` array identical
  to its pre-duplication state; (b) updating the source via `updateWorkout` leaves the
  duplicate's `exercises` identical to the values at duplication time; (c) `deleteWorkout` on
  the source does not remove the duplicate from `state.workouts`

- [x] T012 [P] [US3] Write failing P3 journey test in `tests/journeys.test.js`: duplicate a
  workout, edit the duplicate (add a set to one exercise), save, then call `deleteWorkout` on
  the source; verify the duplicate is still present, its exercises reflect the edit, and it can
  be passed to `startSession` without error

**Checkpoint**: `node --test` passes T011 and T012; all three user stories are independently
functional and the full test suite is green.

---

## Phase 5: Polish and Cross-Cutting Concerns

**Purpose**: Confirm all automated tests pass, validate keyboard operability and responsive
layout, and close the spec validation loop.

- [x] T013 [P] Run `node --test` and confirm the full suite (domain.test.js, journeys.test.js,
  storage.test.js) passes with zero failures; record any failures and trace to their task

- [ ] T014 Validate `specs/002-duplicate-workout/quickstart.md` P1, P2, and P3 acceptance
  walkthroughs at 375 px and 1440 px viewport widths using keyboard-only navigation: confirm
  the Duplicate button is Tab-reachable with a visible focus indicator, the rename input
  receives focus automatically after duplication, and Save name / Keep default are operable
  without a pointer; correct any CSS issues found in `src/styles.css`

---

## Dependencies and Execution Order

- **T001** has no dependencies; complete before all story work.
- **T002 and T003** (US1 tests) depend on T001 and can run in parallel with each other.
- **T004** (domain implementation) depends on T002 being written and observed failing.
- **T005** (Duplicate button in UI) depends on T001 and can run in parallel with T004.
- **T006** (app wiring) depends on T004 and T005.
- **T007** (US2 test) depends on T006 (rename state must be wirable to write the test) and can
  be written immediately after T006 is understood.
- **T008** (inline-rename render) depends on T007 being written and observed failing.
- **T009** (rename action handlers) depends on T008.
- **T010** (styles) can run in parallel with T008 and T009.
- **T011 and T012** (US3 tests) depend on T004 and can run in parallel with each other; they
  may already pass once T004 is complete.
- **T013 and T014** (polish) depend on all story phases being complete.

## Parallel Opportunities

- T002 (domain tests) and T003 (journey test) write to different files → run in parallel.
- T004 (domain) and T005 (UI button) write to different files → run in parallel.
- T010 (styles) writes to a different file from T008 and T009 → run in parallel.
- T011 (domain independence tests) and T012 (journey independence test) write to different
  files → run in parallel.
- T013 (test run) and preparation for T014 (manual walkthrough setup) can run in parallel.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 (foundational alignment)
2. Write T002 and T003 (failing tests)
3. Complete T004, T005, T006 (implementation)
4. **STOP and validate**: Duplicate button works, card appears, localStorage updated → P1 MVP

### Incremental Delivery

1. T001 → foundation aligned
2. T002–T006 → P1 MVP: duplication works
3. T007–T010 → P2: inline rename works
4. T011–T012 → P3: independence confirmed (no implementation needed)
5. T013–T014 → all tests green, keyboard/responsive acceptance passed

---

## Format Validation

All 14 tasks include a checkbox, sequential ID, story label where required, and a concrete file
path. Tasks T002, T003, T005, T010, T011, T012, and T013 carry the [P] marker for parallel
execution.
