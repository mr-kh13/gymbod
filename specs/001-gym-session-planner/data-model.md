# Data Model: Gym Session Planner

## Planner State

- `schemaVersion`: integer, currently `1`
- `workouts`: ordered collection of zero to 20 Workout records
- `activeSession`: zero or one Session with status `active`
- `history`: newest-first collection of up to 20 Sessions with status `completed`

## Exercise

- `id`: stable unique string
- `name`: unique display name
- `category`: `upper`, `lower`, or `core`

Exercises are seeded product data and are not user-editable.

## Workout

- `id`: stable unique string
- `name`: trimmed string, 1–60 characters
- `exercises`: ordered list of Planned Exercise records, at least one
- `createdAt`: ISO date-time
- `updatedAt`: ISO date-time

Workout names need not be unique. Deletion is rejected when the active session references the
workout. Editing a workout never changes an existing session snapshot.

## Planned Exercise

- `exerciseId`: reference to one catalogue Exercise; unique within its Workout
- `sets`: integer from 1 through 10
- `targetReps`: integer from 1 through 100

List position defines exercise order.

## Session

- `id`: stable unique string
- `workoutId`: source Workout identifier
- `workoutName`: immutable name snapshot
- `plannedExercises`: immutable ordered snapshot of planned exercises plus exercise names
- `results`: one Set Result per planned set
- `startedAt`: ISO date-time
- `finishedAt`: ISO date-time for completed sessions; absent while active
- `status`: `active` or `completed`

State transitions: `absent → active → completed`. Discarding removes the active session without
creating history. Completed sessions are immutable. Finishing adds the session to the front of
history and trims history to 20 entries.

## Set Result

- `exerciseId`: identifier matching a session snapshot exercise
- `setNumber`: one-based integer within the planned set count
- `completed`: boolean
- `actualWeightKg`: optional number from 0 through 1000
- `actualReps`: optional integer from 0 through 100

The pair `(exerciseId, setNumber)` is unique inside a Session.

## Validation and Recovery

Validation errors use field paths plus plain-language messages. Persistence accepts only a document
with the supported schema version and valid top-level shapes. Unreadable data produces a recoverable
error state; reset requires an explicit user action.
