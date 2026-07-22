# Feature Specification: Full Workout History

**Feature Branch**: `005-full-workout-history`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Expand workout history from the 20 most recent sessions to the user's complete locally stored training history. Completed sessions appear newest first and preserve the workout name, start and finish times, total training duration, exercises, completed and planned sets, repetitions, weight, timed results, and incomplete-set information as they existed during that session. History is read-only and must remain accurate if a routine or custom exercise is later edited or removed. Empty history and partially completed workouts must be understandable. Exclude advanced analytics, calendar scheduling, social sharing, and cloud synchronization."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Complete Training History (Priority: P1)

As a gym-goer, I want to scroll back through all the workouts I have ever completed so that I can see my full training record and understand how I have progressed over time.

**Why this priority**: Removing the 20-session cap is the core ask; without this, no other story in this feature delivers its stated value.

**Independent Test**: With more than 20 completed sessions present, a user can open the history screen and scroll to sessions older than the 20th, verifying that all sessions are listed newest first without pagination cutoff.

**Acceptance Scenarios**:

1. **Given** more than 20 completed sessions stored on the device, **When** the user opens the history screen, **Then** all sessions appear in newest-first order with no cap or "load more" required to reach older sessions.
2. **Given** a large number of stored sessions, **When** the user scrolls through the list, **Then** performance remains smooth and all sessions remain reachable.
3. **Given** exactly 20 sessions stored, **When** the user views history, **Then** all 20 appear, confirming the previous limit no longer silently truncates the list.

---

### User Story 2 - Inspect a Session's Preserved Snapshot (Priority: P1)

As a gym-goer, I want to open any past session and see exactly what I did — workout name, start and finish times, total duration, every exercise with its planned and completed sets, repetitions, and weight — so that I can use that record to plan my next session accurately.

**Why this priority**: The preserved-snapshot guarantee is as fundamental as the cap removal; without it, the history list delivers no meaningful training intelligence.

**Independent Test**: A user opens a single archived session and verifies that the workout name, timestamps, duration, planned targets, and every set result match what was entered during the session, even after the source routine or exercise has since been renamed or removed.

**Acceptance Scenarios**:

1. **Given** a completed session archived from a routine that was later renamed, **When** the user opens that session in history, **Then** the workout name shown is the name used during the session, not the current name of the routine.
2. **Given** a completed session referencing a custom exercise that was subsequently removed, **When** the user opens that session, **Then** the exercise name and all its set results are still visible.
3. **Given** a completed session with a recorded start time and finish time, **When** the user opens it, **Then** both timestamps and the total training duration are displayed.
4. **Given** a completed session containing sets where actual weight or repetitions were recorded, **When** the user opens it, **Then** each set shows the planned target alongside the actual result.

---

### User Story 3 - Understand Incomplete and Partial Sessions (Priority: P2)

As a gym-goer, I want sessions that were finished early or only partially completed to be clearly labelled so that I can distinguish genuine training records from abandoned attempts.

**Why this priority**: Partial sessions are natural training events and must be interpretable; the feature description explicitly requires this.

**Independent Test**: A session finished with at least one uncompleted set can be opened, and the uncompleted sets are clearly distinguished from completed ones; a summary ratio (e.g. "8 of 12 sets completed") is present.

**Acceptance Scenarios**:

1. **Given** a session finished with some sets incomplete, **When** the user opens it in history, **Then** incomplete sets are visually distinguished from completed sets, and a summary count shows how many sets were completed versus planned.
2. **Given** a fully completed session and a partially completed session side by side in the list, **When** the user views the history list, **Then** the list-level summary makes the completion status of each session distinguishable at a glance.
3. **Given** a partially completed session that references exercises since edited, **When** the user opens it, **Then** the snapshot data for incomplete sets (planned targets) is still shown as it existed at session time.

---

### User Story 4 - Navigate Empty History Meaningfully (Priority: P3)

As a first-time user or someone who has just reset their data, I want the history screen to explain clearly why it is empty and guide me to start a session so that I understand what to do next.

**Why this priority**: Empty-state handling is lower priority than the core history capabilities but is required by the feature description.

**Independent Test**: With no completed sessions stored, a user opens the history screen and sees an explanation and a route to begin a workout session.

**Acceptance Scenarios**:

1. **Given** no completed or partial sessions stored, **When** the user opens the history screen, **Then** an empty-state message explains that finished workouts will appear here, and a call-to-action guides the user toward starting a session.
2. **Given** the history is empty, **When** the user completes their first session, **Then** the history screen now shows that session and the empty state is no longer displayed.

---

### Edge Cases

- What happens when a session's source routine has been deleted? The session snapshot must display the workout name and all exercise data as recorded; no dependency on the current routine list.
- What happens when a custom exercise referenced in a session has been renamed or retired? The session shows the name and data as captured at session time.
- What happens if a session has a start time but no finish time (e.g. app was closed before finishing)? Such sessions are excluded from history — only explicitly finished sessions appear.
- What happens when timed-exercise results are present (duration rather than reps)? The session detail shows the timed result in the format recorded (e.g. duration in seconds or minutes).
- What happens when a planned set has no weight recorded? Weight field is absent or shown as "—" rather than zero.
- What happens when local storage contains a very large number of sessions? The history list still loads and remains scrollable without errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The history screen MUST display all locally stored completed sessions, with no upper limit on the number shown.
- **FR-002**: Sessions MUST appear in newest-first order, determined by the session finish time.
- **FR-003**: Each session in the list MUST show the workout name as it existed at the time of the session, the finish date, the total training duration, and the ratio of completed sets to planned sets.
- **FR-004**: The system MUST store a snapshot of all session data at the time of session completion, so that subsequent edits or deletions of routines and custom exercises do not alter historical records.
- **FR-005**: A session detail view MUST show the session's start time, finish time, total training duration, the workout name as recorded, and each exercise with its planned set targets alongside the actual recorded results (weight, repetitions, or timed result) for every set.
- **FR-006**: Incomplete sets within a finished session MUST be visually distinguished from completed sets, and a completion summary (completed sets vs. planned sets) MUST be present at both the list and detail levels.
- **FR-007**: All history views MUST be read-only; no set result, exercise name, or timing may be edited through the history screen.
- **FR-008**: When no completed sessions exist, the history screen MUST display an empty-state message that explains the purpose of the screen and provides a navigable route to start a workout.
- **FR-009**: Timed exercise results MUST be displayed in a human-readable time format in the session detail view.
- **FR-010**: Sets where no weight was recorded MUST be presented clearly as unweighted rather than displaying a zero weight.

### Key Entities

- **Session Snapshot**: An immutable record capturing, at the moment of session completion, the workout name, start time, finish time, total duration, the ordered list of exercises (names as used), and each set's planned targets and actual results.
- **Set Result**: The completion state, optional recorded weight, optional recorded repetitions or timed duration, and the original planned target for one set within a session snapshot.
- **Exercise Record**: Within a snapshot, the name of the exercise as it existed at session time, its body-area category, and its ordered list of set results.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with more than 20 completed sessions can scroll to any session beyond the 20th in history without additional loading steps.
- **SC-002**: Opening any session detail displays the correct workout name, timestamps, duration, and all set results in under one second for a history of up to 200 sessions on a typical modern device.
- **SC-003**: After renaming or deleting a routine, every existing session in history continues to display the original workout name and exercise data unchanged.
- **SC-004**: A user can distinguish partially completed sessions from fully completed sessions in the history list without opening individual session details.
- **SC-005**: A first-time user who opens the empty history screen can navigate to starting a workout within two interactions.
- **SC-006**: History remains fully readable and scrollable on viewport widths from 375 px to 1440 px without horizontal scrolling.

## Assumptions

- Only explicitly finished sessions (via the "finish session" action) appear in history; sessions that were discarded or never explicitly finished are excluded.
- The existing session completion flow already captures start time and finish time; total duration is derived from these two values.
- Timed exercise results are already recorded in the set result data when a timed exercise type is used; this feature presents that data rather than introducing a new recording mechanism.
- Weight is stored and displayed in kilograms; no unit conversion is required.
- The number of stored sessions is constrained only by the device's available local storage; no artificial limit is imposed by this feature.
- All product copy is English-only.
- Cross-device synchronization, cloud backup, advanced analytics, social sharing, and calendar scheduling remain outside scope.
- The schema migration needed to store snapshot data alongside existing sessions will be handled as part of implementation; older sessions without a full snapshot may display available fields and omit fields that were not captured.
