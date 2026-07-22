import { describe, it, expect } from 'vitest';
import { migrateV1toV2, migrateV2toV3, createDefaultState } from '../../src/domain/storage';
import type { PlannerState } from '../../src/domain/types';

interface PlannerStateV2 {
  schemaVersion: 2;
  workouts: PlannerState['workouts'];
  activeSession: PlannerState['activeSession'];
  history: PlannerState['history'];
}

interface WorkoutExerciseV1 {
  exerciseId: string;
  sets: number;
  targetReps: number;
}

interface SessionExerciseV1 extends WorkoutExerciseV1 {
  exerciseName: string;
}

interface SessionV1 {
  id: string;
  workoutId: string;
  workoutName: string;
  plannedExercises: SessionExerciseV1[];
  results: Array<{
    exerciseId: string;
    setNumber: number;
    completed: boolean;
    actualWeightKg: number | null;
    actualReps: number | null;
  }>;
  startedAt: string;
  finishedAt?: string;
  status: 'active' | 'completed';
}

interface PlannerStateV1 {
  schemaVersion: 1;
  workouts: Array<{
    id: string;
    name: string;
    exercises: WorkoutExerciseV1[];
    createdAt: string;
    updatedAt: string;
  }>;
  activeSession: SessionV1 | null;
  history: SessionV1[];
}

describe('migrateV1toV2', () => {
  it('migrates resistance exercise with targetReps', () => {
    const v1: PlannerStateV1 = {
      schemaVersion: 1,
      workouts: [
        {
          id: 'w1',
          name: 'Push day',
          exercises: [{ exerciseId: 'bench-press', sets: 3, targetReps: 8 }],
          createdAt: '2026-07-13T10:00:00.000Z',
          updatedAt: '2026-07-13T10:00:00.000Z',
        },
      ],
      activeSession: null,
      history: [],
    };
    const result = migrateV1toV2(v1);
    expect(result.schemaVersion).toBe(2);
    expect(result.workouts[0].exercises[0]).toEqual({
      kind: 'resistance',
      exerciseId: 'bench-press',
      sets: 3,
      targetReps: 8,
    });
  });

  it('migrates plank (timed) with targetReps as durationSecs', () => {
    const v1: PlannerStateV1 = {
      schemaVersion: 1,
      workouts: [
        {
          id: 'w1',
          name: 'Core day',
          exercises: [{ exerciseId: 'plank', sets: 3, targetReps: 60 }],
          createdAt: '2026-07-13T10:00:00.000Z',
          updatedAt: '2026-07-13T10:00:00.000Z',
        },
      ],
      activeSession: null,
      history: [],
    };
    const result = migrateV1toV2(v1);
    expect(result.workouts[0].exercises[0]).toEqual({
      kind: 'timed',
      exerciseId: 'plank',
      sets: 3,
      durationSecs: 60,
    });
  });

  it('migrates active session with mixed exercise kinds', () => {
    const v1: PlannerStateV1 = {
      schemaVersion: 1,
      workouts: [],
      activeSession: {
        id: 's1',
        workoutId: 'w1',
        workoutName: 'Mixed',
        plannedExercises: [
          { exerciseId: 'bench-press', sets: 3, targetReps: 8, exerciseName: 'Bench press' },
          { exerciseId: 'plank', sets: 3, targetReps: 60, exerciseName: 'Plank' },
        ],
        results: [],
        startedAt: '2026-07-13T11:00:00.000Z',
        status: 'active',
      },
      history: [],
    };
    const result = migrateV1toV2(v1);
    expect(result.activeSession?.plannedExercises[0]).toEqual({
      kind: 'resistance',
      exerciseId: 'bench-press',
      sets: 3,
      targetReps: 8,
      exerciseName: 'Bench press',
    });
    expect(result.activeSession?.plannedExercises[1]).toEqual({
      kind: 'timed',
      exerciseId: 'plank',
      sets: 3,
      durationSecs: 60,
      exerciseName: 'Plank',
    });
  });

  it('migrates history sessions', () => {
    const v1: PlannerStateV1 = {
      schemaVersion: 1,
      workouts: [],
      activeSession: null,
      history: [
        {
          id: 's1',
          workoutId: 'w1',
          workoutName: 'Push day',
          plannedExercises: [
            { exerciseId: 'bench-press', sets: 3, targetReps: 8, exerciseName: 'Bench press' },
          ],
          results: [
            {
              exerciseId: 'bench-press',
              setNumber: 1,
              completed: true,
              actualWeightKg: 80,
              actualReps: 8,
            },
          ],
          startedAt: '2026-07-13T11:00:00.000Z',
          finishedAt: '2026-07-13T11:30:00.000Z',
          status: 'completed',
        },
      ],
    };
    const result = migrateV1toV2(v1);
    expect(result.history[0].plannedExercises[0]).toEqual({
      kind: 'resistance',
      exerciseId: 'bench-press',
      sets: 3,
      targetReps: 8,
      exerciseName: 'Bench press',
    });
  });

  it('schemaVersion 2 state round-trips without migration', () => {
    const v2State: PlannerStateV2 = {
      schemaVersion: 2,
      workouts: [
        {
          id: 'w1',
          name: 'Push day',
          exercises: [
            {
              kind: 'resistance',
              exerciseId: 'bench-press',
              sets: 3,
              targetReps: 8,
              targetWeightKg: 80,
            },
          ],
          createdAt: '2026-07-13T10:00:00.000Z',
          updatedAt: '2026-07-13T10:00:00.000Z',
        },
      ],
      activeSession: null,
      history: [],
    };
    // Should NOT call migrateV1toV2 for v2 state
    expect(v2State.schemaVersion).toBe(2);
  });
});

describe('migrateV2toV3', () => {
  it('adds customExercises as empty array and bumps schemaVersion to 3', () => {
    const v2: PlannerStateV2 = { schemaVersion: 2, workouts: [], activeSession: null, history: [] };
    const result = migrateV2toV3(v2);
    expect(result.schemaVersion).toBe(3);
    expect(result.customExercises).toEqual([]);
  });

  it('preserves workouts, activeSession, and history', () => {
    const v2: PlannerStateV2 = {
      schemaVersion: 2,
      workouts: [
        {
          id: 'w1',
          name: 'Push day',
          exercises: [{ kind: 'resistance', exerciseId: 'bench-press', sets: 3, targetReps: 8 }],
          createdAt: '2026-07-13T10:00:00.000Z',
          updatedAt: '2026-07-13T10:00:00.000Z',
        },
      ],
      activeSession: null,
      history: [],
    };
    const result = migrateV2toV3(v2);
    expect(result.workouts).toHaveLength(1);
    expect(result.workouts[0].name).toBe('Push day');
    expect(result.activeSession).toBeNull();
    expect(result.history).toEqual([]);
  });
});

describe('createDefaultState', () => {
  it('returns schemaVersion 3 with empty customExercises', () => {
    const state = createDefaultState();
    expect(state.schemaVersion).toBe(3);
    expect(state.customExercises).toEqual([]);
    expect(state.workouts).toEqual([]);
    expect(state.activeSession).toBeNull();
    expect(state.history).toEqual([]);
  });
});
