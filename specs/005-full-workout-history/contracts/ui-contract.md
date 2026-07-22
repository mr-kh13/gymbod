# UI Contract: Full Workout History

**Feature**: 005-full-workout-history | **Date**: 2026-07-23

## Route: `/history` — History List

### Data source

`historyItems(state)` from `src/domain/sessions.ts`. Returns all completed sessions sorted newest-first with no length cap.

### Empty state (zero sessions)

| Element | Value |
|---------|-------|
| Eyebrow | `"Training history"` |
| `<h1>` | `"Nothing logged yet"` |
| Lede paragraph | `"Finish a session and it will appear here."` |
| Call-to-action | `<Link to="/plans">` button labelled `"View plans"` |

### Populated state (one or more sessions)

| Element | Value |
|---------|-------|
| Eyebrow | `"Your history"` |
| `<h1>` | `"Recent work."` |
| Lede paragraph | `"All your completed sessions, stored only on this device."` |
| Session list | `<div class="history-list">` containing one `HistoryItem` per entry |

### `HistoryItem` component contract

Each item renders as a `<button>` (keyboard focusable, triggers navigation to `/history/$id`).

| Slot | Content | Notes |
|------|---------|-------|
| Primary label | `session.workoutName` | Text accessible as button label |
| Date | `session.finishedAt` formatted as locale long date | e.g. `"20 July 2026"` |
| Duration | `formatDuration(session.durationMs)` | Omitted when `durationMs` is `null` |
| Completion badge | `"{completedSets}/{plannedSets} sets"` | Partial sessions visually distinguishable (e.g. different badge colour or text) |

**Ordering**: newest `finishedAt` first. No pagination, no filters.

**Accessibility**: `<ul>`/`<li>` or `role="list"` semantics around items; each button has a visible focus ring; session name is the accessible name of the button.

---

## Route: `/history/$sessionId` — Session Detail

### Data source

`sessionDetail(state, sessionId)` from `src/domain/sessions.ts`. Returns a `structuredClone` of the stored `Session` (read-only).

### Not-found state

| Element | Value |
|---------|-------|
| Eyebrow | `"Session detail"` |
| `<h1>` | `"Not found"` |
| Lede | `"This session no longer exists or was never recorded."` |
| Back button | `"All sessions"` → navigates to `/history` |

### Session detail state

#### Page header

| Element | Content |
|---------|---------|
| Eyebrow | `"Session detail"` |
| `<h1>` | `session.workoutName` (snapshot name) |
| Lede | `"{finishedAt formatted} · {completedSets}/{plannedSets} sets completed"` |
| Sub-lede / meta row | `"Started {startedAt formatted} · Duration {formatDuration(durationMs)}"` — omit duration when `null` |
| Back button | `"← All sessions"` → navigates to `/history` |

`completedSets` and `plannedSets` MUST come from `sessionSummary(session)` in the domain, not computed inline in JSX.

#### Exercise sections

One `<section class="session-exercise">` per entry in `session.plannedExercises`, rendered in order.

| Element | Content |
|---------|---------|
| Eyebrow | `"{sets} sets · {target}"` where target is `"{targetReps} reps@ {targetWeightKg} kg"` for resistance (omit weight part if null) or `"{durationSecs}s"` for timed |
| `<h2>` | `exercise.exerciseName` (snapshot name) |
| Set list | One row per `SetResult` whose `exerciseId` matches |

#### Set row contract

| Slot | Completed set | Incomplete set |
|------|---------------|----------------|
| Status icon | `"✓"` | `"○"` |
| Label | `"Set {setNumber}"` | `"Set {setNumber}"` |
| Target (resistance) | `"Target {targetReps} reps"` | `"Target {targetReps} reps"` |
| Actual weight | `"{actualWeightKg} kg"` (omit when null) | — |
| Actual reps | `"{actualReps} reps"` (omit when null) | — |
| Timed target | `"{durationSecs}s"` | `"{durationSecs}s"` |

Completed rows: `class="set-row completed"`. Incomplete rows: `class="set-row"`.

#### Rest information

Shown when `exercise.restBetweenSetsSecs` or `exercise.restBeforeNextSecs` is set:

```
Rest between sets: {N} s
Rest before next: {N} s
```

#### Read-only constraint

No input, checkbox, or form element appears anywhere on this route. All data is display-only.

#### Accessibility

- `<section>` per exercise with `<h2>` heading.
- Timestamps wrapped in `<time datetime="{ISO string}">` elements.
- Duration value wrapped in `<time>` with `datetime="PT{minutes}M"` or ISO 8601 duration format.
- Visible focus ring on the back button.
- Responsive from 375 px; no horizontal scroll.
