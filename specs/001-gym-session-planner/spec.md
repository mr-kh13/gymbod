# Feature Specification: Gym Session Planner

**Feature Branch**: `001-gym-session-planner`

**Created**: 2026-07-13

**Status**: Draft

**Input**: User description: "Build a small gym planner project with Spec Kit that covers most or all of the workflow."

## Clarifications

### Session 2026-07-13

- Q: Should the planner focus on reusable workouts, weekly scheduling, or both? → A: Reusable workouts, active-session tracking, and recent history; weekly scheduling is out of scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Plan a Workout (Priority: P1)

As a gym-goer, I want to create a workout from a small exercise catalogue and set a target
number of sets and repetitions so that I arrive at the gym with a clear session plan.

**Why this priority**: A saved, actionable workout is the minimum useful planner experience.

**Independent Test**: A user can create, name, review, and save a workout containing at least
one exercise without using any other story.

**Acceptance Scenarios**:

1. **Given** no saved workouts, **When** the user names a workout, adds exercises, supplies valid
   set and repetition targets, and saves, **Then** the workout appears in the plan list with its
   exercise count and estimated total sets.
2. **Given** a workout being edited, **When** the user reorders or removes an exercise, **Then** the
   preview immediately reflects the intended exercise order.
3. **Given** an incomplete or invalid workout, **When** the user attempts to save it, **Then** the
   planner identifies each problem and preserves the entered values for correction.

---

### User Story 2 - Complete a Planned Session (Priority: P2)

As a gym-goer, I want to start a saved workout and record completed sets so that I can follow the
plan without remembering every target or result.

**Why this priority**: Completion turns a static plan into a useful in-gym workflow while remaining
independently demonstrable with any saved workout.

**Independent Test**: Starting one saved workout allows every planned set to be marked complete,
optionally records actual weight and repetitions, and produces a completed-session summary.

**Acceptance Scenarios**:

1. **Given** a saved workout, **When** the user starts it, **Then** every planned exercise and set is
   presented in the planned order with its target repetitions.
2. **Given** an active session, **When** the user records a set, **Then** its completed state and any
   entered weight and repetitions remain available after leaving and returning to the page.
3. **Given** at least one recorded set, **When** the user finishes the session, **Then** a summary
   shows completion time, completed sets, and planned sets before the session is archived.

---

### User Story 3 - Review Recent Sessions (Priority: P3)

As a gym-goer, I want to review recent completed sessions so that I can see what I previously did
when preparing for my next workout.

**Why this priority**: History adds continuity but is not required to create or complete a workout.

**Independent Test**: With completed session records present, a user can open the history view and
inspect the date, workout name, completion ratio, and recorded results for any recent session.

**Acceptance Scenarios**:

1. **Given** completed sessions, **When** the user opens history, **Then** sessions appear newest first
   with date, workout name, and completed-versus-planned set totals.
2. **Given** a history entry, **When** the user opens it, **Then** each exercise shows its recorded
   weight and repetitions without allowing the archived result to be edited.
3. **Given** no completed sessions, **When** the user opens history, **Then** an empty state explains
   how a session becomes part of history and provides a route back to workout plans.

### Edge Cases

- A workout cannot be saved without a non-blank name and at least one valid exercise.
- Exercise targets accept 1–10 sets and 1–100 repetitions per set; out-of-range or non-numeric
  values produce field-level guidance without losing other inputs.
- Exercise names in the supplied catalogue are unique; a workout may include an exercise only once.
- A workout being used by an active session cannot be deleted until that session is finished or
  discarded.
- Refreshing or closing the page during an active session preserves recorded progress on that device.
- Finishing a partially completed session archives the recorded work and clearly reports the gap.
- If stored planner data is unreadable, the user receives a recovery option that resets planner data
  only after explicit confirmation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The planner MUST provide a catalogue of at least 12 common exercises covering upper
  body, lower body, and core categories.
- **FR-002**: Users MUST be able to create a named workout by selecting one or more unique catalogue
  exercises and arranging them in a chosen order.
- **FR-003**: Users MUST be able to set a target of 1–10 sets and 1–100 repetitions for each selected
  exercise.
- **FR-004**: The planner MUST validate workout names, exercise selection, sets, and repetitions and
  MUST preserve valid input when reporting errors.
- **FR-005**: Users MUST be able to view, edit, and delete saved workouts when no active session
  depends on them.
- **FR-006**: Users MUST be able to start one active session from a saved workout and see all planned
  exercises, sets, and repetition targets in order.
- **FR-007**: Users MUST be able to mark planned sets complete and optionally record actual weight
  and repetitions for each set.
- **FR-008**: The planner MUST preserve saved workouts, the active session, and completed session
  history between visits on the same device without requiring an account.
- **FR-009**: Users MUST be able to finish or explicitly discard an active session; finishing MUST
  archive a summary while discarding MUST require confirmation and MUST NOT create history.
- **FR-010**: Users MUST be able to review the 20 most recent completed sessions in newest-first order
  and inspect immutable set results for each session.
- **FR-011**: Every core operation MUST be keyboard accessible, expose meaningful labels and status
  announcements, and retain a visible focus indicator.
- **FR-012**: The planner MUST remain usable at viewport widths from 375 px through 1440 px without
  horizontal scrolling in core journeys.
- **FR-013**: When saved data cannot be read, the planner MUST explain the problem and require explicit
  confirmation before resetting local planner data.

### Key Entities

- **Exercise**: A catalogue movement with a unique identifier, name, and body-area category.
- **Workout**: A user-named, ordered collection of planned exercises with set and repetition targets.
- **Planned Exercise**: A workout's reference to one exercise plus its order, target sets, and target
  repetitions.
- **Session**: One attempt at a saved workout with start time, optional finish time, status, and a
  snapshot of the workout plan.
- **Set Result**: The completion state and optional actual weight and repetitions for one planned set.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can create and save a three-exercise workout in under two minutes.
- **SC-002**: A user can record a completed set in no more than three interactions from the active
  session screen.
- **SC-003**: All three primary journeys can be completed using keyboard input alone at 375 px and
  1440 px viewport widths.
- **SC-004**: Saved workouts and active-session progress remain intact after a page refresh in all
  supported journey tests.
- **SC-005**: Every invalid workout field is identified in a single save attempt, and correcting the
  identified fields permits saving without re-entering valid information.
- **SC-006**: The planner presents its interactive state within one second for a local dataset of
  20 workouts and 20 completed sessions on a typical modern device.

## Assumptions

- The first release serves one person on one browser and device; cross-device synchronization is
  outside scope.
- The exercise catalogue is supplied by the product and cannot be edited in the first release.
- Weight is optional, accepts non-negative values up to 1,000, and uses kilograms.
- A single active session is sufficient; starting another requires finishing or discarding the first.
- Dates and times follow the device locale, while all product copy is English-only in the first release.
- Reusable workout templates, active-session tracking, and recent history define the first-release
  product boundary. Workout scheduling by calendar date, rest timers, medical guidance, nutrition, social sharing,
  coaching, authentication, cloud storage, and wearable integrations are outside scope.
