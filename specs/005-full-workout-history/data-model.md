# Data Model: Full Workout History

**Feature**: 005-full-workout-history | **Date**: 2026-07-23

## Stored Entities (unchanged)

No stored schema changes. Schema remains at version 3. The entities below exist today and require no modification.

### `Session` (`src/domain/types.ts`)

```
Session
├── id: string                     — UUID
├── workoutId: string              — reference to source Workout (informational only; history does not depend on it)
├── workoutName: string            — SNAPSHOT: name as it existed when the session was started
├── plannedExercises: SessionExercise[]  — SNAPSHOT: ordered exercises with names and targets as captured at start
├── results: SetResult[]           — one entry per planned set, updated as sets are recorded
├── startedAt: string              — ISO 8601 UTC timestamp
├── finishedAt?: string            — ISO 8601 UTC timestamp; always present on completed sessions
└── status: 'active' | 'completed'
```

**Snapshot guarantee**: `workoutName` and every `plannedExercise.exerciseName` are copied at `startSession` time from the live workout and exercise catalogue. Subsequent edits or deletions of routines or custom exercises do not affect archived sessions.

### `SessionExercise` (discriminated union)

```
ResistanceSessionExercise
├── kind: 'resistance'
├── exerciseId: string
├── exerciseName: string           — SNAPSHOT from catalogue/custom exercises at start time
├── sets: number
├── targetReps: number
├── targetWeightKg?: number
├── restBetweenSetsSecs?: number
└── restBeforeNextSecs?: number

TimedSessionExercise
├── kind: 'timed'
├── exerciseId: string
├── exerciseName: string           — SNAPSHOT
├── sets: number
├── durationSecs: number
├── restBetweenSetsSecs?: number
└── restBeforeNextSecs?: number
```

### `SetResult` (`src/domain/types.ts`)

```
SetResult
├── exerciseId: string
├── setNumber: number              — 1-based index within the exercise
├── completed: boolean
├── actualWeightKg: number | null  — null when not recorded
└── actualReps: number | null      — null when not recorded; absent for timed exercises
```

### `PlannerState` (`src/domain/types.ts`)

```
PlannerState
├── schemaVersion: 3               — UNCHANGED
├── workouts: Workout[]
├── activeSession: Session | null
├── history: Session[]             — NOW: no length limit enforced at finishSession time
└── customExercises: CustomExercise[]
```

## Domain Selectors (src/domain/sessions.ts)

### Existing selectors — no change to signatures

| Selector | Signature | Notes |
|----------|-----------|-------|
| `sessionSummary` | `(session: Session) → { completedSets: number; plannedSets: number }` | Used in list and detail; already exists |
| `sessionDetail` | `(state, sessionId) → Session \| null` | Returns `structuredClone`; already read-only |

### Modified selector

**`historyItems`** — return shape extended (no signature incompatibility with callers; all callers destructure the result object):

```typescript
// Before
{
  id: string;
  workoutName: string;
  finishedAt: string;
  summary: { completedSets: number; plannedSets: number };
}

// After
{
  id: string;
  workoutName: string;
  startedAt: string;          // added — needed for duration display and accessibility
  finishedAt: string;
  durationMs: number | null;  // added — derived from finishedAt - startedAt
  summary: { completedSets: number; plannedSets: number };
}
```

Cap removal: the `.slice(0, 20)` call on the sorted array is deleted.

### New selector

**`sessionDurationMs`**:

```typescript
(session: Session): number | null
```

- Returns `null` when `session.finishedAt` is absent (defensive; should not occur for completed sessions).
- Returns `new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()` otherwise.
- Used by `historyItems` (inline) and available to `history.$sessionId.tsx` for detail-level duration display.

## Derived Presentation Values (route-level, not stored)

| Value | Source | Location |
|-------|--------|----------|
| Training duration string | `sessionDurationMs` → `formatDuration` | `history.$sessionId.tsx` module scope |
| Completion ratio string | `sessionSummary` → `{completedSets}/{plannedSets} sets completed` | `history.$sessionId.tsx` render |
| List-item duration string | `historyItems().durationMs` → `formatDuration` | `history.index.tsx` render via `HistoryItem` |

`formatDuration(ms: number): string` — module-level pure function in `history.$sessionId.tsx`:
- `ms < 3600000`: returns `"${Math.floor(ms / 60000)}m"`
- `ms >= 3600000` with remainder minutes: returns `"${h}h ${m}m"`
- `ms >= 3600000` on the hour exactly: returns `"${h}h"`

## Migration

No migration. Schema version stays at 3. Existing stored sessions are fully compatible — all snapshot fields (`workoutName`, `plannedExercises`, `results`, `startedAt`, `finishedAt`) have been present since schema v1.
