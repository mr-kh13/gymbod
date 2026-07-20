import { describe, it, expect } from 'vitest';
import { createWorkout } from '../../src/domain/workouts';
import {
  startSession,
  recordSet,
  finishSession,
  discardSession,
  historyItems,
  sessionDetail,
} from '../../src/domain/sessions';
import { createDefaultState } from '../../src/domain/storage';
import type { PlannerState } from '../../src/domain/types';

function withWorkout(): PlannerState {
  return createWorkout(
    createDefaultState(),
    {
      id: null,
      name: 'Push day',
      exercises: [
        { exerciseId: 'bench-press', sets: 2, targetReps: 8 },
        { exerciseId: 'overhead-press', sets: 1, targetReps: 10 },
      ],
    },
    { id: 'w1', now: '2026-07-13T10:00:00.000Z' },
  ).state;
}

describe('startSession', () => {
  it('starts one active session with an immutable workout snapshot', () => {
    const started = startSession(withWorkout(), 'w1', { id: 's1', now: '2026-07-13T11:00:00.000Z' });
    expect(started.activeSession?.workoutName).toBe('Push day');
    expect(started.activeSession?.results).toHaveLength(3);
    expect(started.activeSession?.plannedExercises.map((e) => e.exerciseName)).toEqual([
      'Bench press',
      'Overhead press',
    ]);
    expect(() => startSession(started, 'w1')).toThrow(/already active/i);
  });
});

describe('recordSet', () => {
  it('records a completed set without mutating the prior state', () => {
    const started = startSession(withWorkout(), 'w1', { id: 's1', now: '2026-07-13T11:00:00.000Z' });
    const updated = recordSet(started, 'bench-press', 1, {
      completed: true,
      actualWeightKg: 80,
      actualReps: 8,
    });
    expect(started.activeSession?.results[0].completed).toBe(false);
    expect(updated.activeSession?.results[0]).toEqual({
      exerciseId: 'bench-press',
      setNumber: 1,
      completed: true,
      actualWeightKg: 80,
      actualReps: 8,
    });
  });

  it('rejects invalid actual results', () => {
    const started = startSession(withWorkout(), 'w1', { id: 's1', now: '2026-07-13T11:00:00.000Z' });
    expect(() =>
      recordSet(started, 'bench-press', 1, { completed: true, actualWeightKg: -1, actualReps: 101 }),
    ).toThrow(/weight/i);
  });
});

describe('finishSession', () => {
  it('finishes a partial session and archives its completion summary', () => {
    const started = startSession(withWorkout(), 'w1', { id: 's1', now: '2026-07-13T11:00:00.000Z' });
    const recorded = recordSet(started, 'bench-press', 1, {
      completed: true,
      actualWeightKg: 80,
      actualReps: 8,
    });
    const result = finishSession(recorded, { now: '2026-07-13T11:30:00.000Z' });
    expect(result.state.activeSession).toBeNull();
    expect(result.state.history[0].status).toBe('completed');
    expect(result.summary).toEqual({ completedSets: 1, plannedSets: 3 });
  });

  it('requires one completed set before finishing', () => {
    const started = startSession(withWorkout(), 'w1', { id: 's1', now: '2026-07-13T11:00:00.000Z' });
    expect(() => finishSession(started)).toThrow(/at least one set/i);
  });
});

describe('discardSession', () => {
  it('discards without creating history', () => {
    const started = startSession(withWorkout(), 'w1', { id: 's1', now: '2026-07-13T11:00:00.000Z' });
    const discarded = discardSession(started);
    expect(discarded.activeSession).toBeNull();
    expect(discarded.history).toHaveLength(0);
  });
});

describe('historyItems', () => {
  it('lists completed history newest first with completion ratios', () => {
    const base = withWorkout();
    const older = {
      id: 'older',
      workoutId: 'w1',
      workoutName: 'Push day',
      startedAt: '2026-07-11T10:00:00.000Z',
      finishedAt: '2026-07-11T11:00:00.000Z',
      status: 'completed' as const,
      plannedExercises: [],
      results: [{ exerciseId: 'bench-press', setNumber: 1, completed: true, actualWeightKg: null, actualReps: null }],
    };
    const newer = {
      ...older,
      id: 'newer',
      finishedAt: '2026-07-12T11:00:00.000Z',
      results: [
        { exerciseId: 'bench-press', setNumber: 1, completed: true, actualWeightKg: null, actualReps: null },
        { exerciseId: 'bench-press', setNumber: 2, completed: false, actualWeightKg: null, actualReps: null },
      ],
    };
    const items = historyItems({ ...base, history: [older, newer] });
    expect(items.map((i) => i.id)).toEqual(['newer', 'older']);
    expect(items[0].summary).toEqual({ completedSets: 1, plannedSets: 2 });
  });

  it('retains only the latest 20 completed sessions', () => {
    let state = withWorkout();
    for (let i = 0; i < 21; i++) {
      state = startSession(state, 'w1', {
        id: `s${i}`,
        now: new Date(Date.UTC(2026, 6, 1, i)).toISOString(),
      });
      state = recordSet(state, 'bench-press', 1, { completed: true });
      state = finishSession(state, {
        now: new Date(Date.UTC(2026, 6, 1, i, 30)).toISOString(),
      }).state;
    }
    expect(state.history).toHaveLength(20);
    expect(state.history[0].id).toBe('s20');
    expect(state.history[state.history.length - 1].id).toBe('s1');
  });

  it('returns empty array when no sessions completed', () => {
    expect(historyItems(createDefaultState())).toEqual([]);
  });
});

describe('sessionDetail', () => {
  it('returns an immutable projection', () => {
    let state = startSession(withWorkout(), 'w1', { id: 's1', now: '2026-07-13T11:00:00.000Z' });
    state = recordSet(state, 'bench-press', 1, { completed: true, actualWeightKg: 80, actualReps: 8 });
    state = finishSession(state, { now: '2026-07-13T11:30:00.000Z' }).state;
    const detail = sessionDetail(state, 's1')!;
    detail.results[0].actualWeightKg = 999;
    expect(state.history[0].results[0].actualWeightKg).toBe(80);
    expect(detail.workoutName).toBe('Push day');
  });
});
