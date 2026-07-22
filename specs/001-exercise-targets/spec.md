# Feature Specification: Exercise Performance Targets

**Feature Branch**: `001-exercise-targets`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Extend planned workout exercises so users can define how each exercise should be performed. Resistance exercises support target sets, repetitions, and optional weight in kilograms. Timed exercises support target sets and duration. Each planned exercise can also define rest time between sets and, where applicable, before the next exercise. Users can edit these targets without changing previously completed sessions. Existing workouts and completed-session history must remain readable. Do not implement the running rest timer, custom exercises, AI-generated plans, scheduling, or cloud synchronization in this feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define Targets for a Resistance Exercise (Priority: P1)

A user opens a planned workout and selects a resistance exercise (e.g., "Bench Press"). They specify how many sets to perform, how many repetitions per set, and optionally what weight to use in kilograms. Saving these values makes them visible whenever the user views or starts that workout.

**Why this priority**: This is the core value of the feature — without the ability to record targets for at least one exercise type, the feature delivers no value to users.

**Independent Test**: Can be fully tested by opening any planned workout, selecting a resistance exercise, entering sets/reps/optional weight, saving, and confirming the values display correctly on the workout detail screen.

**Acceptance Scenarios**:

1. **Given** a planned workout containing at least one resistance exercise, **When** the user opens the exercise detail and enters 3 sets, 10 repetitions, and 60 kg, **Then** the exercise displays "3 × 10 @ 60 kg" (or equivalent) on the workout screen.
2. **Given** a planned workout containing at least one resistance exercise, **When** the user enters sets and repetitions but leaves weight blank, **Then** the exercise is saved with no weight target and displays without a weight value.
3. **Given** a resistance exercise with previously saved targets, **When** the user edits the targets and saves, **Then** the new targets are reflected without affecting any previously recorded session that used the old targets.

---

### User Story 2 - Define Targets for a Timed Exercise (Priority: P2)

A user opens a planned workout and selects a timed exercise (e.g., "Plank"). They specify how many sets to perform and the duration of each set (e.g., 3 sets of 60 seconds). Saving these values makes them visible whenever the user views or starts that workout.

**Why this priority**: Timed exercises are a distinct exercise type in the system and must be handled separately from resistance exercises; without this, the feature only serves half of users' exercise types.

**Independent Test**: Can be fully tested by opening any planned workout, selecting a timed exercise, entering sets and duration, saving, and confirming the values display on the workout detail screen.

**Acceptance Scenarios**:

1. **Given** a planned workout containing at least one timed exercise, **When** the user opens the exercise detail and enters 3 sets and 60 seconds duration, **Then** the exercise displays "3 sets × 60 s" (or equivalent) on the workout screen.
2. **Given** a timed exercise with no targets set, **When** the user views the workout, **Then** the exercise is visible with no targets shown rather than an error or placeholder text.

---

### User Story 3 - Define Rest Times for a Planned Exercise (Priority: P3)

A user opens a planned workout exercise and specifies how long to rest between sets and, optionally, how long to rest before the next exercise begins. These rest values are stored alongside the other targets and displayed when the user views the workout plan.

**Why this priority**: Rest periods are a standard component of structured training plans and are explicitly required; however, the feature delivers planning value even without them, so this is secondary to the exercise targets themselves.

**Independent Test**: Can be fully tested by editing any planned exercise (resistance or timed), entering a rest-between-sets value and an optional before-next-exercise rest value, saving, and verifying both values appear on the workout detail view.

**Acceptance Scenarios**:

1. **Given** a planned resistance exercise, **When** the user sets rest between sets to 90 seconds and rest before the next exercise to 120 seconds, **Then** both values are saved and displayed on the workout plan.
2. **Given** a planned timed exercise, **When** the user sets rest between sets to 30 seconds but leaves rest before next exercise empty, **Then** only the between-sets rest is displayed; the before-next-exercise field is blank without causing an error.
3. **Given** a planned exercise with rest times saved, **When** the user edits only the rest values and saves, **Then** only the rest values change; sets, reps/duration, and weight remain unchanged.

---

### User Story 4 - Backward Compatibility: Existing Data Remains Readable (Priority: P1)

A user who already has saved workouts and completed-session history upgrades to the version of the app that includes exercise targets. All previously saved workouts and completed sessions continue to open and display correctly without any manual migration step.

**Why this priority**: Data loss or unreadable history would be a critical regression that breaks existing users' trust in the app; this must be guaranteed alongside the new feature.

**Independent Test**: Can be fully tested by loading a data set created before this feature was introduced and verifying all workouts and completed sessions open without errors, display the correct exercise names and historical data, and show no target information (since none was previously stored).

**Acceptance Scenarios**:

1. **Given** a workout saved before exercise targets existed, **When** the user opens that workout, **Then** all exercises are listed without any target fields rather than showing errors or empty mandatory fields.
2. **Given** a completed-session record saved before exercise targets existed, **When** the user opens that session in history, **Then** all historical data (exercises, performance recorded at the time) is displayed accurately without any reference to the new target fields.

---

### Edge Cases

- What happens when a user sets sets to zero or a negative number?
- What happens when a user sets a duration of zero seconds for a timed exercise?
- How does the system handle weight values entered with fractional kilograms (e.g., 2.5 kg)?
- What happens when the user removes all targets from an exercise that previously had targets?
- What happens if an exercise has no type classification (neither resistance nor timed)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For each resistance exercise in a planned workout, the system MUST allow users to set a target number of sets (positive integer).
- **FR-002**: For each resistance exercise in a planned workout, the system MUST allow users to set a target number of repetitions per set (positive integer).
- **FR-003**: For each resistance exercise in a planned workout, the system MUST allow users to optionally set a target weight in kilograms (positive number; may be fractional).
- **FR-004**: For each timed exercise in a planned workout, the system MUST allow users to set a target number of sets (positive integer).
- **FR-005**: For each timed exercise in a planned workout, the system MUST allow users to set a target duration per set (positive value expressed in seconds or a minutes-seconds format).
- **FR-006**: For each planned exercise (resistance or timed), the system MUST allow users to set an optional rest duration between sets.
- **FR-007**: For each planned exercise (resistance or timed), the system MUST allow users to set an optional rest duration before the next exercise.
- **FR-008**: The system MUST display all saved exercise targets (sets, reps/duration, weight, rest times) when the user views the planned workout.
- **FR-009**: When a user edits exercise targets in a planned workout, the system MUST save only the new targets going forward without altering any previously completed sessions that referenced the earlier targets.
- **FR-010**: The system MUST load and display existing workout plans that were saved before this feature existed, without requiring any user action and without showing errors.
- **FR-011**: The system MUST load and display completed-session history records saved before this feature existed, without any loss of historical data.
- **FR-012**: The system MUST NOT implement a running rest timer, custom exercise creation, AI-generated plans, scheduling, or cloud synchronization as part of this feature.

### Key Entities

- **Planned Exercise**: An exercise slot within a planned workout. Now carries an optional block of performance targets (type-dependent) and optional rest configuration.
- **Resistance Exercise Targets**: The target values specific to resistance exercises — sets (required), repetitions per set (required), weight in kg (optional).
- **Timed Exercise Targets**: The target values specific to timed exercises — sets (required), duration per set (required).
- **Rest Configuration**: The optional rest periods associated with any planned exercise — rest between sets (optional), rest before the next exercise (optional).
- **Completed Session**: A historical record of a workout that has been performed. Contains the state of the workout at the time it was completed and is never mutated by changes to the planned workout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open any planned exercise and set all applicable targets (sets, reps or duration, weight, rest times) in under 60 seconds.
- **SC-002**: All previously saved workouts and completed-session records open without errors after the feature is introduced — 0% regression in existing data readability.
- **SC-003**: Editing exercise targets in a planned workout does not alter any value in any completed session — 100% isolation between planned targets and historical records.
- **SC-004**: All target fields for both exercise types are visible to the user when viewing the workout plan, with no target requiring the user to navigate to a separate screen beyond the exercise's own detail view.
- **SC-005**: Users can clear (remove) previously set targets from an exercise, and the cleared state is persisted and displayed correctly.

## Assumptions

- Exercise types (resistance vs. timed) are already classified and stored for each exercise in the system; this feature does not introduce type classification.
- Duration for timed exercises is stored and displayed in seconds, with the UI optionally formatting it as minutes and seconds for readability.
- Weight is stored as a decimal number in kilograms; no unit conversion (e.g., pounds) is required for this feature.
- Rest times are stored and displayed in seconds with optional minutes-seconds formatting, consistent with duration handling.
- Completed sessions store a snapshot of the workout state (including any targets that existed at session time); the snapshot is never back-filled with new target data.
- All target fields are optional at the exercise level — a planned exercise with no targets set is fully valid and must display without error.
- The feature applies only to exercises within manually created planned workouts; exercises within AI-generated or scheduled workouts are out of scope per the explicit exclusions.
- Mobile responsiveness is expected to the same standard as the rest of the application.
