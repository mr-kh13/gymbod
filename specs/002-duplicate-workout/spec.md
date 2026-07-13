# Feature Specification: Duplicate Workout

**Feature Branch**: `002-duplicate-workout`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Allow users to duplicate a saved workout."

## Clarifications

### Session 2026-07-13

- Q: What is the maximum workout name length? → A: 50 characters.
- Q: Where is the duplication action exposed in the UI? → A: As an action on each workout list item (button or overflow menu per row).
- Q: Is the inline rename after duplication optional or mandatory? → A: Optional — name field is pre-focused for convenience but the user can dismiss and keep the default name.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Duplicate a Saved Workout (Priority: P1)

As a gym-goer, I want to duplicate an existing saved workout so that I can quickly create a
variation of a plan I already built without starting from scratch.

**Why this priority**: Duplication is the core capability; every other story depends on or extends
this action. Without it, no duplicate exists.

**Independent Test**: A user with at least one saved workout can activate the duplicate action on
a list item without opening the workout editor, and a new independent workout immediately appears
in the list with a default name and the same exercises, sets, and repetitions as the original.

**Acceptance Scenarios**:

1. **Given** at least one saved workout, **When** the user chooses to duplicate it, **Then** a new
   workout appears in the list with the name "Copy of [Original Name]", containing the same
   exercises in the same order with the same set and repetition targets.
2. **Given** a duplicated workout, **When** the user opens the original, **Then** the original is
   unchanged and shows no link or reference to the duplicate.
3. **Given** a saved workout that has been duplicated multiple times, **When** duplication is
   triggered again, **Then** each new copy receives a unique default name (e.g., "Copy of X",
   "Copy of X (2)", "Copy of X (3)") and all previous copies are unaffected.

---

### User Story 2 - Rename the Duplicate Immediately (Priority: P2)

As a gym-goer, I want to give the duplicated workout a meaningful name right after duplicating
so that my workout list stays organised and I can tell the variation from the original at a glance.

**Why this priority**: A default name is functional but risks a cluttered list; inline rename
directly after duplication removes friction and is independently valuable once Story 1 exists.

**Independent Test**: Immediately after duplication, the new workout's name field is pre-focused;
the user can either enter a new name and confirm it, or dismiss to keep the default name — in both
cases the duplicate is usable immediately without navigating away.

**Acceptance Scenarios**:

1. **Given** a workout has just been duplicated, **When** the duplicate entry appears in the list,
   **Then** its name field is active for editing so the user can rename it without an extra
   navigation step.
2. **Given** an active rename on the duplicate, **When** the user confirms an empty name, **Then**
   the rename is rejected with guidance, and the default name is preserved.
3. **Given** an active rename on the duplicate, **When** the user cancels without typing anything,
   **Then** the default name is kept and no changes are made.

---

### User Story 3 - Edit the Duplicate Independently (Priority: P3)

As a gym-goer, I want changes I make to a duplicated workout to be completely independent of the
original so that I can safely iterate on variations without risking my existing plans.

**Why this priority**: Independence is implicit in duplication but must be verifiable as a
distinct story since some users will only discover it matters after editing.

**Independent Test**: With an original and its duplicate both saved, editing exercises, sets, or
repetitions in one and saving produces no visible change in the other.

**Acceptance Scenarios**:

1. **Given** an original workout and its duplicate, **When** the user adds, removes, or reorders
   exercises in the duplicate and saves, **Then** the original workout remains identical to its
   pre-duplication state.
2. **Given** an original workout and its duplicate, **When** the user edits set or repetition
   targets in the original and saves, **Then** the duplicate retains the values it had at the time
   of duplication.
3. **Given** a duplicate workout, **When** the user deletes the original, **Then** the duplicate
   is unaffected and continues to be usable for new sessions.

### Edge Cases

- A workout involved in an active session can still be duplicated; the ongoing session and its
  recorded progress are not affected.
- If the default name "Copy of [Original Name]" would exceed 50 characters, the name is truncated
  to 50 characters.
- Duplicating a workout that is itself a previously created duplicate follows the same rules as
  duplicating any other workout.
- The duplicate count suffix (e.g., "(2)", "(3)") increments only when the default name without
  suffix would collide with an existing workout name.
- Duplication with no saved workouts present is not possible; the action is not exposed when the
  list is empty.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to trigger duplication directly from each workout's list item
  (via a dedicated button or overflow menu on the row) without opening the workout editor.
- **FR-002**: Triggering duplication MUST immediately create a new, independent workout containing
  the same exercises in the same order with the same set and repetition targets as the source.
- **FR-003**: The duplicate MUST be assigned a default name of "Copy of [Original Name]"; if that
  name already exists, the system MUST append an incrementing suffix (e.g., "(2)", "(3)") to
  produce a unique name.
- **FR-004**: The duplicate's name field MUST be pre-focused immediately after creation so the
  user can rename without extra navigation; dismissing without typing MUST leave the default name
  intact and make the duplicate immediately usable.
- **FR-005**: Renaming the duplicate MUST enforce the same name validation rules as creating a new
  workout (non-blank, maximum 50 characters).
- **FR-006**: Saving any change to the duplicate MUST NOT alter the source workout's name,
  exercises, order, set targets, or repetition targets.
- **FR-007**: Deleting the source workout MUST NOT delete or modify any of its duplicates.
- **FR-008**: A workout participating in an active session MUST still be duplicatable; the active
  session MUST NOT be interrupted or invalidated.
- **FR-009**: The duplicate MUST be immediately usable for starting a new session once it appears
  in the workout list.
- **FR-010**: The planner MUST persist the duplicate across page refreshes on the same device,
  consistent with how all other workouts are stored.

### Key Entities

- **Workout** (extended from existing spec): A user-named, ordered collection of planned exercises.
  A duplicate is a fully independent Workout with no retained reference to its source.
- **Planned Exercise** (inherited): Each exercise in the duplicate is an independent copy of the
  source's planned exercises — same exercise, order, set target, and repetition target at the
  moment of duplication.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can duplicate any saved workout in three or fewer interactions from the
  workout list screen.
- **SC-002**: The duplicated workout appears in the list within one second of the user confirming
  duplication on a typical modern device with a local dataset of up to 20 workouts.
- **SC-003**: All exercise entries — including order, set targets, and repetition targets — from
  the source are present and correct in the duplicate in 100% of duplication scenarios.
- **SC-004**: Editing and saving either the original or the duplicate produces no observable change
  in the other across all exercise, set, and repetition fields.
- **SC-005**: The duplication action on each list item is keyboard accessible and can be completed
  without a pointer device at both 375 px and 1440 px viewport widths.

## Assumptions

- A single copy is sufficient for most users; bulk duplication (selecting multiple workouts at
  once) is out of scope for this feature.
- The exercise catalogue itself is not duplicated or modified; duplicates reference the same
  catalogue entries as the source.
- There is no explicit limit on how many times the same workout can be duplicated, consistent with
  the broader assumption of no hard cap on saved workouts.
- Default name generation ("Copy of X") is deterministic; the inline rename step is optional —
  the name field is pre-focused for convenience but the duplicate is valid and usable if dismissed.
- Cross-device synchronisation remains out of scope; the duplicate is stored locally on the same
  device, consistent with the existing planner assumptions.
- The feature applies only to saved, fully valid workouts; partially edited unsaved drafts cannot
  be duplicated.
