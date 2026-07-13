---
description: "Dependency-ordered implementation tasks for the gym session planner"
---

# Tasks: Gym Session Planner

**Input**: Design documents from `/specs/001-gym-session-planner/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: Required by the project constitution and written before their story implementation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create a runnable, dependency-free static application and test harness.

- [x] T001 Create ES module metadata and Node test command in package.json
- [x] T002 [P] Create semantic application shell and view containers in index.html
- [x] T003 [P] Create responsive design tokens, layout, focus, and component foundations in src/styles.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish product data, state boundaries, and persistence required by every story.

- [x] T004 [P] Define the 12-exercise immutable catalogue in src/catalog.js
- [x] T005 [P] Write failing persistence and corrupted-data recovery tests in tests/storage.test.js
- [x] T006 Implement versioned planner repository, default state, load/save/reset, and recovery errors in src/storage.js
- [x] T007 Create central render/event bootstrap and live-status plumbing in src/app.js and src/ui.js

**Checkpoint**: The shell loads default local state and reports recoverable storage failures.

---

## Phase 3: User Story 1 - Plan a Workout (Priority: P1) 🎯 MVP

**Goal**: Create, validate, order, save, edit, and delete reusable workouts.

**Independent Test**: Create and save a three-exercise workout, reorder it, and receive complete
validation without losing valid inputs.

### Tests for User Story 1

- [x] T008 [US1] Write failing workout creation, validation, ordering, update, and deletion tests covering FR-001–FR-005 in tests/domain.test.js

### Implementation for User Story 1

- [x] T009 [US1] Implement workout validation and immutable create/update/delete transitions in src/domain.js
- [x] T010 [US1] Implement Plans empty/list states and workout editor markup in src/ui.js
- [x] T011 [US1] Connect exercise add/remove/reorder, validation summary, save/edit/delete, and persistence events in src/app.js
- [x] T012 [US1] Add workout cards, editor rows, validation, and responsive Plans styling in src/styles.css

**Checkpoint**: User Story 1 is an independently runnable and testable MVP.

---

## Phase 4: User Story 2 - Complete a Planned Session (Priority: P2)

**Goal**: Start one workout session, record set results, preserve progress, finish, or discard.

**Independent Test**: Start a saved workout, record and reload set progress, then finish a partial
session and receive the correct completion summary.

### Tests for User Story 2

- [x] T013 [US2] Write failing start, record-set, finish, discard, snapshot, and conflicting-session tests covering FR-006–FR-009 in tests/journeys.test.js

### Implementation for User Story 2

- [x] T014 [US2] Implement start, record-set, finish, and discard session transitions in src/domain.js
- [x] T015 [US2] Implement active-session empty state, exercise/set controls, and completion summary in src/ui.js
- [x] T016 [US2] Connect session start, immediate set persistence, finish, discard confirmation, and navigation in src/app.js
- [x] T017 [US2] Add session progress, set-row, summary, and narrow-screen styling in src/styles.css

**Checkpoint**: User Stories 1 and 2 work independently and persist across refreshes.

---

## Phase 5: User Story 3 - Review Recent Sessions (Priority: P3)

**Goal**: Review the 20 latest immutable completed sessions in newest-first order.

**Independent Test**: Open history with and without sessions, and inspect the immutable details and
completion ratio of a selected session.

### Tests for User Story 3

- [x] T018 [US3] Write failing history ordering, 20-record retention, immutable detail, and empty-state tests covering FR-010 in tests/journeys.test.js

### Implementation for User Story 3

- [x] T019 [US3] Implement history selection and immutable session-detail projections in src/domain.js
- [x] T020 [US3] Implement History empty/list/detail states and local date formatting in src/ui.js
- [x] T021 [US3] Connect history selection and navigation in src/app.js
- [x] T022 [US3] Add history list, completion badge, and detail styling in src/styles.css

**Checkpoint**: All three prioritized user stories are functional and independently testable.

---

## Phase 6: Polish and Cross-Cutting Concerns

**Purpose**: Validate accessibility, resilience, performance, and presentation readiness.

- [x] T023 [P] Add cross-story keyboard, semantic status, and recovery contract assertions in tests/journeys.test.js
- [x] T024 Implement corrupted-data recovery panel and explicit reset flow in src/ui.js and src/app.js
- [x] T025 Run all automated tests and document results in specs/001-gym-session-planner/validation.md
- [x] T026 Validate quickstart journeys at 375 px and 1440 px, correct visual/accessibility issues, and record evidence in specs/001-gym-session-planner/validation.md
- [x] T027 Create the ten-minute Spec Kit demonstration script in specs/001-gym-session-planner/demo-guide.md

---

## Dependencies and Execution Order

- Setup tasks T001–T003 can begin immediately; T002 and T003 are parallel.
- Foundation depends on T001; T004 and T005 can run in parallel, then T006 and T007 complete it.
- US1 depends on Foundation. Its test T008 precedes T009–T012.
- US2 depends on the saved-workout capability from US1. Its test T013 precedes T014–T017.
- US3 depends on completed sessions from US2. Its test T018 precedes T019–T022.
- Polish depends on all selected stories; T023 can begin alongside documentation preparation.

## Parallel Examples

- T002 application shell and T003 visual foundations touch different files.
- T004 catalogue and T005 persistence tests touch different files.
- During polish, T023 test assertions can be prepared separately from T027 demo documentation.

## Implementation Strategy

1. Deliver T001–T012 as the P1 MVP and validate workout planning independently.
2. Add T013–T017 as an in-gym completion increment.
3. Add T018–T022 as the history increment.
4. Complete T023–T027 as the convergence and presentation gate.

## Format Validation

All 27 tasks include a checkbox, sequential ID, story label where required, and concrete file path.
