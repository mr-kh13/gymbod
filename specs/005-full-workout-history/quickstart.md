# Quickstart: Full Workout History

**Feature**: 005-full-workout-history | **Date**: 2026-07-23

## What this feature changes

| File | Change |
|------|--------|
| `src/domain/sessions.ts` | Remove `.slice(0, 20)` from `finishSession` (line 100) and `historyItems` (line 113); add `sessionDurationMs()`; extend `historyItems` return shape |
| `src/routes/history.index.tsx` | Update lede text; pass `durationMs` through to `HistoryItem` |
| `src/routes/history.$sessionId.tsx` | Replace inline set count with `sessionSummary()`; add `formatDuration()`; display `startedAt` and duration |
| `tests/domain/sessions.test.ts` | Replace 20-cap assertion; add duration, ordering, and partial-session unit tests |
| `tests/journeys/history.test.tsx` | Add >20-session list journey, duration display journey, partial-session clarity journey |

No new dependencies. No new source files. No schema migration.

## Running the tests

```bash
npm test
```

Runs all Vitest tests (unit + RTL journeys). All existing tests must remain green.

To run only the history-related tests:

```bash
npm test -- sessions history
```

## Key domain functions

### `sessionDurationMs(session: Session): number | null`

```typescript
import { sessionDurationMs } from './src/domain/sessions';

const ms = sessionDurationMs(session);
// null if finishedAt is absent
// e.g. 5400000 for a 90-minute session
```

### `historyItems(state: PlannerState)`

Returns all sessions newest-first. Each item now includes:

```typescript
{
  id: string;
  workoutName: string;
  startedAt: string;         // ISO string
  finishedAt: string;        // ISO string
  durationMs: number | null; // derived
  summary: { completedSets: number; plannedSets: number };
}
```

## Generating test data (manual dev testing)

The `memoryRepo` helper in `tests/journeys/helpers.tsx` accepts any `PlannerState`. To manually test with 25 sessions in the browser during development, inject state through the `PlannerProvider` `repository` prop or use browser DevTools to write a JSON payload to `localStorage` key `form.planner.v1`.

A quick helper to build multi-session state:

```typescript
import { createDefaultState } from './src/domain/storage';
import { createWorkout } from './src/domain/workouts';
import { startSession, recordSet, finishSession } from './src/domain/sessions';

function buildNSessions(n: number) {
  let state = createWorkout(createDefaultState(), {
    id: null, name: 'Test workout',
    exercises: [{ kind: 'resistance', exerciseId: 'bench-press', sets: 1, targetReps: 5,
                  targetWeightKg: '', restBetweenSetsSecs: '', restBeforeNextSecs: '' }],
  }, { id: 'w1' }).state;

  for (let i = 0; i < n; i++) {
    const start = new Date(Date.UTC(2026, 0, i + 1, 9)).toISOString();
    const end   = new Date(Date.UTC(2026, 0, i + 1, 10, 30)).toISOString();
    state = startSession(state, 'w1', { id: `s${i}`, now: start });
    state = recordSet(state, 'bench-press', 1, { completed: true });
    state = finishSession(state, { now: end }).state;
  }
  return state;
}
```

## Acceptance check

After implementation, verify manually:

1. **Cap gone**: With 21+ sessions stored, all 21 appear in `/history` without any "load more".
2. **Duration**: Opening a session detail shows a human-readable duration (e.g. "1h 30m").
3. **Snapshot**: Rename a workout after completing a session — the history entry still shows the original name.
4. **Partial**: Finish a session with some sets unchecked — the list shows a ratio less than 100% and the detail clearly marks incomplete sets with `○`.
5. **Empty state**: With no history, `/history` shows "Nothing logged yet" and a link to plans.
6. **Read-only**: No input or edit control appears anywhere on the history routes.
