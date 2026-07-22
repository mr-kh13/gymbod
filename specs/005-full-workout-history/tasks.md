# Tasks: Full Workout History

**Input**: Design documents from `/specs/005-full-workout-history/`

**Prerequisites**: plan.md ✓ · spec.md ✓ · research.md ✓ · data-model.md ✓ · contracts/ui-contract.md ✓ · quickstart.md ✓

**Tests**: Required by constitution (Principle IV). Every user-story phase places behavioral test tasks before implementation tasks. Tests must be observed failing before implementation proceeds.

**Organization**: Grouped by user story. All domain-layer changes are in Phase 2 (Foundational) because `src/domain/sessions.ts` is shared across US1 and US2. Route and component changes are per user story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependency on an incomplete task)
- **[Story]**: Which user story (US1–US4 maps to spec.md priorities P1–P3)

---

## Phase 1: Setup

No new dependencies, configuration, or source files required. All runtime packages are already installed.

- [x] T001 Confirm `npm test` passes with zero failures before any changes (baseline)

---

## Phase 2: Foundational — Domain Selector Layer

**Purpose**: All changes to `src/domain/sessions.ts` that serve multiple user stories. Must complete before any route or component tasks.

**⚠️ CRITICAL**: Phases 3–6 cannot begin until this phase is complete.

### Unit Tests — write first, confirm failing before implementing

- [x] T002 Replace the existing "retains only the latest 20 completed sessions" assertion with a test that verifies `finishSession` accumulates all sessions without a cap when called 21 times, in `tests/domain/sessions.test.ts`
- [x] T003 [P] Add unit test: `historyItems` with 21 stored sessions returns all 21 items sorted newest-first (no slice), in `tests/domain/sessions.test.ts`
- [x] T004 [P] Add unit test: `sessionDurationMs(session)` returns the correct millisecond value when both `startedAt` and `finishedAt` are set (e.g. 5400000 for a 90-minute gap), in `tests/domain/sessions.test.ts`
- [x] T005 [P] Add unit test: `sessionDurationMs(session)` returns `null` when `finishedAt` is absent, in `tests/domain/sessions.test.ts`
- [x] T006 [P] Add unit test: each item returned by `historyItems` contains `startedAt` (ISO string) and `durationMs` (number or null) fields, in `tests/domain/sessions.test.ts`
- [x] T007 [P] Add unit test: `sessionSummary` correctly reports `completedSets` and `plannedSets` for a fully completed session, a partial session, and a session with zero completed sets, in `tests/domain/sessions.test.ts`

### Implementation — make the failing tests pass

- [x] T008 Remove `.slice(0, 20)` from `finishSession()` at line 100 in `src/domain/sessions.ts` (makes T002 pass)
- [x] T009 [P] Add `sessionDurationMs(session: Session): number | null` pure selector to `src/domain/sessions.ts` — returns `null` when `finishedAt` is absent, otherwise returns `new Date(finishedAt).getTime() - new Date(startedAt).getTime()` (makes T004 and T005 pass)
- [x] T010 Remove `.slice(0, 20)` from `historyItems()` and extend each returned item with `startedAt: session.startedAt` and `durationMs: sessionDurationMs(session)` in `src/domain/sessions.ts` (makes T003 and T006 pass)

**Checkpoint**: Run `npm test` — T002–T007 must pass; all pre-existing tests must still pass before continuing.

---

## Phase 3: User Story 1 — Browse Complete Training History (Priority: P1) 🎯 MVP

**Goal**: Every locally stored completed session appears in the history list, newest first, with no 20-session ceiling. The lede text no longer implies a "latest N" cap. List items show training duration alongside the date and completion ratio.

**Independent Test**: With 21 sessions stored, open `/history` and confirm all 21 appear without scrolling past a cutoff or pressing "load more".

### Tests for User Story 1 ⚠️

> Write these tests FIRST and confirm they FAIL before implementing T012–T014

- [x] T011 [US1] Write RTL journey test: build state with 21 completed sessions, render `/history`, assert all 21 session names appear in the document, in `tests/journeys/history.test.tsx`

### Implementation for User Story 1

- [x] T012 [P] [US1] Update the lede paragraph in `src/routes/history.index.tsx` from `"Your latest {items.length} completed sessions, stored only on this device."` to `"All your completed sessions, stored only on this device."`
- [x] T013 [P] [US1] Add an optional `durationMs: number | null` prop to `src/components/HistoryItem.tsx` and render formatted duration (e.g. `"1h 30m"`, `"45m"`) below the date when the value is not null
- [x] T014 [US1] Pass `item.durationMs` from the `historyItems()` result into each `<HistoryItem>` in `src/routes/history.index.tsx` (depends on T013)

**Checkpoint**: Run journey test suite — T011 must pass; existing history journey tests must still pass.

---

## Phase 4: User Story 2 — Inspect a Session's Preserved Snapshot (Priority: P1)

**Goal**: Opening any history entry shows the workout name as it existed at session time, the start time, finish time, formatted training duration, and the correct completed/planned set ratio — even if the source routine or exercise was later renamed or removed.

**Independent Test**: Finish a session under workout name "Push day"; rename the workout; open the history entry — it still displays "Push day" alongside the start time and a human-readable duration.

### Tests for User Story 2 ⚠️

> Write these tests FIRST and confirm they FAIL before implementing T017

- [x] T015 [P] [US2] Write RTL journey test: render a session detail where `startedAt` is `"2026-07-20T09:00:00.000Z"` and `finishedAt` is `"2026-07-20T10:30:00.000Z"`; assert the page contains `"1h 30m"` (or equivalent formatted duration), in `tests/journeys/history.test.tsx`
- [x] T016 [P] [US2] Write RTL journey test: complete a session on workout "Push day", rename the workout to "Push day v2", navigate to the session detail, assert the heading still reads "Push day" (not "Push day v2"), in `tests/journeys/history.test.tsx`

### Implementation for User Story 2

- [x] T017 [US2] In `src/routes/history.$sessionId.tsx`: add module-level `formatDuration(ms: number): string` helper (mirrors the existing `formatDate` pattern); replace the inline `completedSets`/`plannedSets` calculation with a `sessionSummary(session)` call; add a sub-lede or meta row displaying `startedAt` (formatted) and training duration via `formatDuration(sessionDurationMs(session))` — omit duration when null (makes T015 pass; T016 already passes via existing snapshot behaviour)

**Checkpoint**: Run journey test suite — T015 and T016 must pass; all prior tests must still pass.

---

## Phase 5: User Story 3 — Understand Incomplete and Partial Sessions (Priority: P2)

**Goal**: Sessions finished with uncompleted sets are clearly distinguishable from fully completed sessions at both list and detail level. The list item shows the ratio (e.g. "3/9 sets") and the detail view marks each incomplete set with `○`.

**Independent Test**: Finish a session with 2 of 6 sets checked; the list item shows `"2/6 sets"`; opening the detail shows `○` for the four unchecked sets and `✓` for the two checked ones.

### Tests for User Story 3 ⚠️

> Write this test FIRST and confirm it describes the correct behaviour before verifying implementation

- [x] T018 [US3] Write RTL journey test: build state with a session where 2 of 6 sets are completed; render `/history` and assert the list item contains `"2/6 sets"`; navigate to the detail and assert at least one `"○"` marker and one `"✓"` marker are present in the document, in `tests/journeys/history.test.tsx`

### Implementation for User Story 3

- [x] T019 [US3] Review set-row rendering in `src/routes/history.$sessionId.tsx` and completion badge in `src/components/HistoryItem.tsx` against T018; apply any fixes needed to ensure T018 passes — expected to require no code change since both display patterns already exist

**Checkpoint**: T018 must pass. If it required changes, re-run the full suite to confirm no regressions.

---

## Phase 6: User Story 4 — Navigate Empty History Meaningfully (Priority: P3)

**Goal**: A user with no completed sessions sees an informative empty state and a direct route to start a workout — no dead end.

**Independent Test**: With default (empty) state, render `/history` and confirm the empty-state copy and "View plans" navigation link are present.

### Tests for User Story 4 ⚠️

- [x] T020 [US4] Write RTL journey test: render `/history` with no completed sessions; assert the document contains text matching `/nothing logged yet/i` and a link or button navigating to `/plans`, in `tests/journeys/history.test.tsx`

### Implementation for User Story 4

- [x] T021 [US4] Confirm T020 passes against the existing `src/routes/history.index.tsx` empty-state branch — no code change expected; the `"Nothing logged yet"` heading and `<Link to="/plans">` already satisfy the requirement

**Checkpoint**: T020 must pass. All 20 tasks to this point must have a green test suite.

---

## Phase 7: Polish & Cross-Cutting

- [x] T022 [P] Run `npm run typecheck` — zero errors across all changed files (`src/domain/sessions.ts`, `src/components/HistoryItem.tsx`, `src/routes/history.index.tsx`, `src/routes/history.$sessionId.tsx`)
- [x] T023 Run the manual acceptance checklist in `specs/005-full-workout-history/quickstart.md` (6 items: cap gone, duration visible, snapshot after rename, partial session display, empty state, read-only constraint)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — confirm baseline
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 2 completion; independent of Phase 3
- **Phase 5 (US3)**: Depends on Phase 4 (uses `sessionSummary` in route); independent of Phase 3
- **Phase 6 (US4)**: Depends on Phase 3 (lede text update touches same file); independent of Phase 4–5
- **Phase 7 (Polish)**: Depends on all story phases complete

### Within Phase 2 (Foundational)

```
T002 → T008   (unit test for cap → remove cap from finishSession)
T003 → T010   (unit test for historyItems count → remove historyItems slice)
T004 → T009   (unit test for sessionDurationMs ms → add selector)
T005 → T009   (unit test for sessionDurationMs null → add selector)
T006 → T010   (unit test for return shape → extend historyItems shape)
T007 → (verifies sessionSummary, no new impl needed)
```

T003–T007 can all be written in parallel (different `describe` blocks, same file). T008 and T009 can be implemented in parallel (different functions, same file). T010 depends on T009 (uses `sessionDurationMs` inline).

### Within User Story Phases

- Tests must be written and **observed failing** before implementation starts
- T013 (HistoryItem prop) before T014 (route passes prop)
- T017 (detail route) has no dependency on T012–T014

### Parallel Opportunities

```bash
# Phase 2 test writing (all different describe blocks, same file):
Write T002, T003, T004, T005, T006, T007 in one session

# Phase 2 implementation:
T008 and T009 in parallel (different functions)
T010 after T009

# Phase 3 and 4 can proceed in parallel after Phase 2:
Phase 3: T011 → T012, T013 → T014
Phase 4: T015, T016 → T017

# Phase 5 journey test and Phase 6 journey test in parallel:
T018 and T020 (different test cases, same file)
```

---

## Implementation Strategy

### MVP (Phase 2 + Phase 3 only)

1. Confirm baseline — T001
2. Write and fail domain unit tests — T002–T007
3. Implement domain changes — T008–T010
4. Write and fail US1 journey test — T011
5. Implement US1 route changes — T012–T014
6. **STOP and VALIDATE**: `npm test` green + manual spot-check of >20 sessions in list

This delivers the headline requirement (unlimited history list) and is independently demoable.

### Full Delivery (all phases)

After MVP validation:
- Add Phase 4 (US2) for detail-view improvements
- Add Phase 5 (US3) to lock in partial-session display
- Add Phase 6 (US4) to protect empty-state behaviour
- Finish with Phase 7 polish and lint

---

## Notes

- `[P]` tasks operate on different files or different functions within the same file with no shared incomplete dependency
- Each phase ends with a named checkpoint — do not advance until it is green
- T019 and T021 are verification tasks expected to require no code change; if they do require changes, treat the fix as the implementation and note the delta
- All 5 affected source paths are listed in `specs/005-full-workout-history/quickstart.md`
- No new runtime dependencies introduced across any task
