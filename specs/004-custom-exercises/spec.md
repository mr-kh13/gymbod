# Feature Specification: Custom Exercise Management

**Feature Branch**: `004-custom-exercises`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Allow users to create custom exercises when the supplied exercise catalogue does not contain the movement they need. A custom exercise has a valid unique name and a measurement type suitable for resistance or timed tracking. Custom exercises can be selected in routines exactly like predefined exercises. Users can rename or retire custom exercises, but changes must not rewrite completed workout history or make existing routines unreadable. Predefined catalogue exercises cannot be edited or deleted. Include useful empty, duplicate-name, validation, and referenced-exercise behaviour. Exclude catalogue sharing, cloud synchronization, AI suggestions, and importing public exercise libraries."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Custom Exercise (Priority: P1)

A user browses the exercise catalogue to build a new routine but cannot find "Cable Face Pull" or another movement they regularly perform. They create a custom exercise by giving it a name and selecting whether it tracks resistance (weight and reps) or time. The new exercise immediately appears in the catalogue and can be added to routines.

**Why this priority**: This is the core value of the feature. Without the ability to create a custom exercise, no other story in this feature is reachable.

**Independent Test**: Can be fully tested by navigating to the catalogue, creating one custom exercise, and confirming it appears alongside predefined exercises as a selectable option.

**Acceptance Scenarios**:

1. **Given** the exercise catalogue is open, **When** the user creates a new exercise named "Cable Face Pull" with measurement type "resistance", **Then** "Cable Face Pull" appears in the catalogue and can be added to a routine.
2. **Given** the exercise catalogue is open, **When** the user creates a new exercise named "Dead Hang" with measurement type "timed", **Then** "Dead Hang" appears in the catalogue and can be added to a routine.
3. **Given** the user attempts to create an exercise with an empty name, **When** they submit the form, **Then** the system displays a clear validation message and does not create the exercise.
4. **Given** an exercise named "Cable Face Pull" already exists (predefined or custom), **When** the user attempts to create another exercise with the same name (any capitalisation), **Then** the system displays a duplicate-name message and does not create the exercise.
5. **Given** an exercise with a very long name is submitted, **When** the form is submitted, **Then** the system applies and communicates any name length limit clearly.

---

### User Story 2 - Select a Custom Exercise in a Routine (Priority: P1)

A user opens a routine to add exercises. Custom exercises appear in the same catalogue list as predefined exercises and can be selected without any distinction in the selection flow.

**Why this priority**: Tied to P1 in value — a custom exercise that cannot be used in a routine delivers no workout benefit. Ranked alongside creation as an essential pair.

**Independent Test**: Can be fully tested by selecting an existing custom exercise when editing a routine and confirming it saves and displays identically to predefined exercises.

**Acceptance Scenarios**:

1. **Given** a custom exercise exists, **When** the user opens the exercise picker while editing a routine, **Then** the custom exercise appears in the list alongside predefined exercises.
2. **Given** a custom exercise has been added to a routine, **When** the user opens that routine, **Then** the exercise appears with its name and measurement type correctly displayed.
3. **Given** a routine contains both predefined and custom exercises, **When** the user logs a workout using that routine, **Then** both exercise types are tracked according to their respective measurement types.

---

### User Story 3 - Rename a Custom Exercise (Priority: P2)

A user decides to rename a custom exercise they previously created (e.g., correcting a typo or using a preferred name). After renaming, the exercise appears under the new name in the catalogue and in any routines that include it. Completed workout history is not altered — historical records remain intact under the name that was in use at the time of recording.

**Why this priority**: Important for long-term usability and data hygiene but not blocking initial use of the feature.

**Independent Test**: Can be fully tested by renaming a custom exercise, then verifying the new name appears in the catalogue and routines, and that a completed workout session logged before the rename still shows the original name.

**Acceptance Scenarios**:

1. **Given** a custom exercise named "Face Pull" exists, **When** the user renames it to "Cable Face Pull", **Then** the catalogue and all routines that include it display "Cable Face Pull".
2. **Given** a workout was completed with "Face Pull" before the rename, **When** the user views that completed workout, **Then** the session record still shows "Face Pull" (the name at time of recording).
3. **Given** the user attempts to rename a custom exercise to a name already used by another exercise (predefined or custom), **When** they confirm the rename, **Then** the system shows a duplicate-name error and does not apply the rename.
4. **Given** the user attempts to rename a custom exercise to an empty string, **When** they submit, **Then** the system shows a validation error and does not apply the rename.
5. **Given** a predefined catalogue exercise is displayed, **When** the user views its detail, **Then** no rename control is visible or accessible.

---

### User Story 4 - Retire a Custom Exercise (Priority: P2)

A user no longer performs a movement they previously created as a custom exercise. They retire it to remove it from active selection without losing any historical data or breaking existing routines. Routines that reference the retired exercise remain fully readable, showing the exercise name clearly marked as retired. The exercise can be reactivated if the user changes their mind.

**Why this priority**: Needed for catalogue hygiene as custom exercise lists grow, but the feature works fully without it for initial use.

**Independent Test**: Can be fully tested by retiring a custom exercise and verifying: it no longer appears as a selection option in new routines, existing routines remain readable, and historical workout sessions still show the exercise data.

**Acceptance Scenarios**:

1. **Given** an active custom exercise exists, **When** the user retires it, **Then** it no longer appears as a selectable option when adding exercises to new or existing routines.
2. **Given** a routine contains a custom exercise that has since been retired, **When** the user opens that routine, **Then** the routine displays fully, with the retired exercise clearly labelled as retired but its name and measurement type still visible.
3. **Given** a completed workout session includes a retired exercise, **When** the user reviews that session, **Then** all exercise data (name, sets, reps or duration) is displayed without error.
4. **Given** a retired custom exercise, **When** the user chooses to reactivate it, **Then** it returns to the active catalogue and can be selected in routines again.
5. **Given** a predefined catalogue exercise is displayed, **When** the user views its detail, **Then** no retire control is visible or accessible.

---

### User Story 5 - View and Distinguish Custom vs Predefined Exercises (Priority: P3)

A user wants to know which exercises in the catalogue they created themselves versus those supplied with the app, and to see the status (active or retired) of their custom exercises.

**Why this priority**: Useful context for catalogue management but not required for the core create/use/retire flows.

**Independent Test**: Can be fully tested by checking that the catalogue provides a visible indicator for custom exercises distinct from predefined ones, and that retired exercises are distinguishable from active ones.

**Acceptance Scenarios**:

1. **Given** the exercise catalogue is displayed, **When** the user views it, **Then** custom exercises are visually distinguished from predefined exercises (e.g., labelled or grouped).
2. **Given** retired custom exercises exist, **When** the user accesses a view of all custom exercises, **Then** retired exercises are distinguishable from active ones.
3. **Given** a predefined exercise detail is open, **When** the user inspects available actions, **Then** no edit or delete actions are present.

---

### Edge Cases

- What happens when the user submits a custom exercise name containing only whitespace? The system treats it as empty and shows a required-name validation error.
- What happens when a custom exercise name matches a predefined exercise name exactly (case-insensitive)? The system shows a duplicate-name error; uniqueness spans both predefined and custom exercises.
- What happens when a routine that contains a retired exercise is used to start a new workout? The retired exercise appears in the routine view with a retired indicator; the user can proceed with the workout but is informed the exercise is retired.
- What happens when the user tries to retire an exercise that appears in many routines? The system may warn that the exercise is referenced in N routines; the retire action still succeeds but routines are not modified.
- What happens when two custom exercise names differ only in capitalisation (e.g., "squat" vs "Squat")? The system treats them as duplicates and rejects the second.
- What happens if the user closes the create form midway without submitting? No exercise is created and no partial data is saved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to create a new custom exercise by providing a name and selecting a measurement type (resistance or timed).
- **FR-002**: Custom exercise names MUST be non-empty after trimming leading and trailing whitespace.
- **FR-003**: Custom exercise names MUST be unique across all exercises (predefined and custom, compared case-insensitively).
- **FR-004**: System MUST display a clear validation message when a name is empty or contains only whitespace.
- **FR-005**: System MUST display a clear duplicate-name message when the submitted name matches an existing exercise name (case-insensitive).
- **FR-006**: A custom exercise MUST have exactly one measurement type — either resistance (tracks weight and repetitions) or timed (tracks duration) — selected at creation time.
- **FR-007**: Measurement type MUST NOT be changeable after a custom exercise has been created, to preserve the integrity of logged workout data.
- **FR-008**: Custom exercises MUST appear in the exercise catalogue alongside predefined exercises and be selectable in routines without any additional steps.
- **FR-009**: Users MUST be able to rename an active custom exercise, subject to the same name validation rules (non-empty, unique).
- **FR-010**: Renaming a custom exercise MUST NOT alter any completed workout session records; historical records MUST retain the exercise name that was in use at the time of recording.
- **FR-011**: Renaming a custom exercise MUST update the exercise name displayed in all routines that include it, ensuring no routine becomes unreadable.
- **FR-012**: Users MUST be able to retire a custom exercise, changing its status from active to retired.
- **FR-013**: Retired exercises MUST NOT appear as selectable options when the user adds exercises to new or existing routines.
- **FR-014**: Routines that already contain a retired exercise MUST remain fully accessible and display the exercise name and measurement type with a retired status indicator.
- **FR-015**: Completed workout session records that include a retired exercise MUST remain fully readable without any data loss.
- **FR-016**: Users MUST be able to reactivate a retired custom exercise, returning it to active status.
- **FR-017**: Predefined catalogue exercises MUST NOT expose any edit, rename, or delete controls to the user.
- **FR-018**: The system MUST provide a way for users to view their custom exercises separately from or distinctly within the full catalogue.
- **FR-019**: Retired custom exercises MUST be visually distinguishable from active exercises in all views where they appear.

### Key Entities

- **Custom Exercise**: A user-created exercise entry with a unique name, a fixed measurement type (resistance or timed), and a status (active or retired). Created, renamed, and retired by the user.
- **Predefined Exercise**: A system-supplied exercise entry with a name and measurement type. Read-only; cannot be modified or deleted by the user.
- **Measurement Type**: A classification of how an exercise is tracked — "resistance" records weight and repetitions per set; "timed" records duration per set or bout.
- **Routine**: An ordered collection of exercise references (predefined or custom) forming a reusable workout plan.
- **Completed Workout Session**: An immutable historical record of a performed workout, containing exercise names and measurements captured at the time of the session.
- **Exercise Status**: Active (selectable, editable) or retired (not selectable for new use, but existing references remain readable).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a custom exercise and have it ready for use in a routine in under 60 seconds from opening the creation flow.
- **SC-002**: 100% of validation errors (empty name, whitespace-only name, duplicate name) display a user-facing message that identifies the specific issue without technical jargon.
- **SC-003**: Zero completed workout session records are modified or lost as a result of renaming or retiring a custom exercise.
- **SC-004**: Zero existing routines become unreadable (crash, blank, or missing exercise entries) as a result of renaming or retiring a custom exercise.
- **SC-005**: Custom exercises appear in the exercise catalogue and routine picker within the same session as creation, requiring no refresh or navigation restart.
- **SC-006**: No edit, rename, or retire controls are visible on predefined catalogue exercises.
- **SC-007**: 100% of routines referencing a retired exercise remain openable and display the exercise name with a retired status indicator.

## Assumptions

- A single user profile is assumed; there are no roles or permissions distinguishing who can create or modify custom exercises.
- "Retired" is a soft-delete: exercise data is preserved in storage; the exercise is simply removed from active selection lists.
- Completed workout sessions store the exercise name as a snapshot at the time of recording; renaming a custom exercise does not retroactively update those snapshots.
- Custom exercise name uniqueness is enforced case-insensitively (e.g., "squat" and "Squat" are treated as the same name).
- Measurement type is immutable after creation to avoid invalidating historical workout data logged under the original type.
- An exercise may have only one measurement type.
- There is no enforced upper limit on the number of custom exercises a user may create.
- Catalogue sharing, cloud synchronisation, AI suggestions, and importing public exercise libraries are explicitly out of scope.
- The feature integrates with the existing exercise catalogue and routine management flows; no changes to how predefined exercises are stored or displayed are required beyond adding custom exercises alongside them.
