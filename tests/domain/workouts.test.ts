import { describe, it, expect } from 'vitest';
import { EXERCISES } from '../../src/domain/catalog';
import {
  createWorkout,
  deleteWorkout,
  duplicateWorkout,
  updateWorkout,
  validateWorkout,
  defaultDraftForExercise,
  workoutToDraft,
} from '../../src/domain/workouts';
import { createDefaultState } from '../../src/domain/storage';
import { startSession } from '../../src/domain/sessions';

const validDraft = {
  id: null,
  name: 'Push day',
  exercises: [
    {
      kind: 'resistance' as const,
      exerciseId: 'bench-press',
      sets: 3,
      targetReps: 8,
      targetWeightKg: '',
      restBetweenSetsSecs: '',
      restBeforeNextSecs: '',
    },
    {
      kind: 'resistance' as const,
      exerciseId: 'overhead-press',
      sets: 3,
      targetReps: 10,
      targetWeightKg: '',
      restBetweenSetsSecs: '',
      restBeforeNextSecs: '',
    },
  ],
};

describe('createWorkout', () => {
  it('creates a trimmed workout while preserving exercise order', () => {
    const result = createWorkout(
      createDefaultState(),
      { ...validDraft, name: '  Push day  ' },
      { id: 'w1', now: '2026-07-13T10:00:00.000Z' },
    );
    expect(result.errors).toHaveLength(0);
    expect(result.workout?.name).toBe('Push day');
    expect(result.workout?.exercises.map((e) => e.exerciseId)).toEqual([
      'bench-press',
      'overhead-press',
    ]);
    expect(result.state.workouts).toHaveLength(1);
  });
});

describe('validateWorkout', () => {
  it('reports all invalid workout fields together', () => {
    const errors = validateWorkout(
      {
        id: null,
        name: ' ',
        exercises: [
          {
            kind: 'resistance' as const,
            exerciseId: 'missing',
            sets: 0,
            targetReps: 101,
            targetWeightKg: '',
            restBetweenSetsSecs: '',
            restBeforeNextSecs: '',
          },
          {
            kind: 'resistance' as const,
            exerciseId: 'missing',
            sets: 'x',
            targetReps: '',
            targetWeightKg: '',
            restBetweenSetsSecs: '',
            restBeforeNextSecs: '',
          },
        ],
      },
      EXERCISES,
    );
    const fields = new Set(errors.map((e) => e.field));
    expect(fields).toEqual(
      new Set([
        'name',
        'exercises.0.exerciseId',
        'exercises.0.sets',
        'exercises.0.targetReps',
        'exercises.1.exerciseId',
        'exercises.1.sets',
        'exercises.1.targetReps',
      ]),
    );
    expect(errors.some((e) => e.message.includes('only once'))).toBe(true);
  });

  it('requires at least one exercise', () => {
    const errors = validateWorkout({ id: null, name: 'Leg day', exercises: [] }, EXERCISES);
    expect(errors.some((e) => e.field === 'exercises')).toBe(true);
  });
});

describe('updateWorkout', () => {
  it('updates a workout without changing its identity or creation time', () => {
    const created = createWorkout(createDefaultState(), validDraft, {
      id: 'w1',
      now: '2026-07-13T10:00:00.000Z',
    });
    const reordered = { ...validDraft, exercises: [...validDraft.exercises].reverse() };
    const updated = updateWorkout(created.state, 'w1', reordered, {
      now: '2026-07-13T11:00:00.000Z',
    });
    expect(updated.workout?.id).toBe('w1');
    expect(updated.workout?.createdAt).toBe('2026-07-13T10:00:00.000Z');
    expect(updated.workout?.updatedAt).toBe('2026-07-13T11:00:00.000Z');
    expect(updated.workout?.exercises[0].exerciseId).toBe('overhead-press');
  });
});

describe('deleteWorkout', () => {
  it('prevents deletion while session is active', () => {
    const created = createWorkout(createDefaultState(), validDraft, { id: 'w1' });
    const started = startSession(created.state, 'w1');
    expect(() => deleteWorkout(started, 'w1')).toThrow(/active session/i);
  });
});

describe('duplicateWorkout', () => {
  it('adds an independent copy with a default name and matching exercises', () => {
    const state = createWorkout(createDefaultState(), validDraft, { id: 'w1' }).state;
    const { state: next, workout: copy } = duplicateWorkout(state, 'w1', { id: 'w2' });
    expect(next.workouts).toHaveLength(2);
    expect(copy.name).toBe('Copy of Push day');
    expect(copy.exercises.map((e) => e.exerciseId)).toEqual(
      state.workouts[0].exercises.map((e) => e.exerciseId),
    );
    expect(() => startSession(next, 'w2')).not.toThrow();
  });

  it('avoids name collisions with a numeric suffix', () => {
    let state = createWorkout(createDefaultState(), validDraft, { id: 'w1' }).state;
    ({ state } = duplicateWorkout(state, 'w1', { id: 'w2' }));
    const { workout: second } = duplicateWorkout(state, 'w1', { id: 'w3' });
    expect(second.name).toBe('Copy of Push day (2)');
  });
});

describe('validateWorkout - discriminated union types', () => {
  it('rejects invalid durationSecs for timed exercise', () => {
    const timedDraft = {
      id: null,
      name: 'Core day',
      exercises: [
        { kind: 'timed' as const, exerciseId: 'plank', sets: 3, durationSecs: 0, restBetweenSetsSecs: '', restBeforeNextSecs: '' },
      ],
    };
    const errors = validateWorkout(timedDraft, EXERCISES);
    expect(errors.some((e) => e.field === 'exercises.0.durationSecs')).toBe(true);
  });

  it('accepts optional empty targetWeightKg', () => {
    const resistanceDraft = {
      id: null,
      name: 'Push day',
      exercises: [
        {
          kind: 'resistance' as const,
          exerciseId: 'bench-press',
          sets: 3,
          targetReps: 8,
          targetWeightKg: '',
          restBetweenSetsSecs: '',
          restBeforeNextSecs: '',
        },
      ],
    };
    const errors = validateWorkout(resistanceDraft, EXERCISES);
    expect(errors).toHaveLength(0);
  });
});

describe('defaultDraftForExercise', () => {
  it('returns resistance kind for non-timed exercises', () => {
    const draft = defaultDraftForExercise('bench-press', EXERCISES);
    expect(draft.kind).toBe('resistance');
    expect(draft).toHaveProperty('targetReps');
  });

  it('returns timed kind for plank', () => {
    const draft = defaultDraftForExercise('plank', EXERCISES);
    expect(draft.kind).toBe('timed');
    expect(draft).toHaveProperty('durationSecs');
  });
});

describe('workoutToDraft', () => {
  it('round-trips a workout back to a compilable draft', () => {
    const state = createWorkout(createDefaultState(), validDraft, { id: 'w1' }).state;
    const workout = state.workouts[0];
    const draft = workoutToDraft(workout);
    expect(draft.name).toBe(workout.name);
    expect(draft.exercises.map((e: any) => e.exerciseId)).toEqual(
      workout.exercises.map((e) => e.exerciseId),
    );
  });
});

describe('validateWorkout - timed exercises', () => {
  it('rejects invalid durationSecs values', () => {
    const timedDraft = {
      id: null,
      name: 'Core day',
      exercises: [
        { kind: 'timed' as const, exerciseId: 'plank', sets: 3, durationSecs: 0, restBetweenSetsSecs: '', restBeforeNextSecs: '' },
      ],
    };
    const errors = validateWorkout(timedDraft, EXERCISES);
    expect(errors.some((e) => e.field === 'exercises.0.durationSecs')).toBe(true);
  });

  it('accepts valid durationSecs', () => {
    const timedDraft = {
      id: null,
      name: 'Core day',
      exercises: [
        { kind: 'timed' as const, exerciseId: 'plank', sets: 3, durationSecs: 60, restBetweenSetsSecs: '', restBeforeNextSecs: '' },
      ],
    };
    const errors = validateWorkout(timedDraft, EXERCISES);
    expect(errors.filter((e) => e.field.includes('exercises.0')).length).toBe(0);
  });

  it('createWorkout produces TimedWorkoutExercise from TimedWorkoutExerciseDraft', () => {
    const timedDraft = {
      id: null,
      name: 'Core day',
      exercises: [
        { kind: 'timed' as const, exerciseId: 'plank', sets: 3, durationSecs: 60, restBetweenSetsSecs: '', restBeforeNextSecs: '' },
      ],
    };
    const result = createWorkout(createDefaultState(), timedDraft, { id: 'w1' });
    expect(result.workout?.exercises[0].kind).toBe('timed');
    expect((result.workout?.exercises[0] as any).durationSecs).toBe(60);
  });
});
