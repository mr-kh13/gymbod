import type { PlannerState, Workout, WorkoutDraft, ValidationError, Exercise, WorkoutExerciseDraft } from './types';
import { EXERCISES, exerciseById, activeCatalogue } from './catalog';

const integerInRange = (value: string | number, min: number, max: number): boolean =>
  Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

const makeId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function validateWorkout(
  draft: WorkoutDraft,
  catalog = EXERCISES,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const name = String(draft?.name ?? '').trim();
  if (!name) errors.push({ field: 'name', message: 'Enter a workout name.' });
  else if (name.length > 50) errors.push({ field: 'name', message: 'Use 50 characters or fewer.' });

  const exercises = Array.isArray(draft?.exercises) ? draft.exercises : [];
  if (exercises.length === 0)
    errors.push({ field: 'exercises', message: 'Add at least one exercise.' });

  const seen = new Set<string>();
  exercises.forEach((item, index) => {
    const path = `exercises.${index}`;
    if (!catalog.some((e) => e.id === item.exerciseId)) {
      errors.push({ field: `${path}.exerciseId`, message: 'Choose an exercise from the catalogue.' });
    }
    if (seen.has(item.exerciseId)) {
      errors.push({ field: `${path}.exerciseId`, message: 'Use each exercise only once.' });
    }
    seen.add(item.exerciseId);
    if (!integerInRange(item.sets, 1, 10))
      errors.push({ field: `${path}.sets`, message: 'Sets must be from 1 to 10.' });

    if (item.kind === 'resistance') {
      if (!integerInRange(item.targetReps, 1, 100))
        errors.push({ field: `${path}.targetReps`, message: 'Repetitions must be from 1 to 100.' });
      if (item.targetWeightKg !== '') {
        const weight = Number(item.targetWeightKg);
        if (!Number.isFinite(weight) || weight < 0 || weight > 1000)
          errors.push({ field: `${path}.targetWeightKg`, message: 'Weight must be from 0 to 1,000 kg.' });
      }
    } else if (item.kind === 'timed') {
      if (!integerInRange(item.durationSecs, 1, 3600))
        errors.push({ field: `${path}.durationSecs`, message: 'Duration must be from 1 to 3,600 seconds.' });
    }

    if (item.restBetweenSetsSecs !== '') {
      if (!integerInRange(item.restBetweenSetsSecs, 0, 600))
        errors.push({ field: `${path}.restBetweenSetsSecs`, message: 'Rest between sets must be from 0 to 600 seconds.' });
    }
    if (item.restBeforeNextSecs !== '') {
      if (!integerInRange(item.restBeforeNextSecs, 0, 600))
        errors.push({ field: `${path}.restBeforeNextSecs`, message: 'Rest before next exercise must be from 0 to 600 seconds.' });
    }
  });
  return errors;
}

export function createWorkout(
  state: PlannerState,
  draft: WorkoutDraft,
  options: { id?: string; now?: string } = {},
): { state: PlannerState; workout: Workout | null; errors: ValidationError[] } {
  const errors = validateWorkout(draft, activeCatalogue(state.customExercises));
  if (errors.length) return { state, workout: null, errors };
  const now = options.now ?? new Date().toISOString();
  const workout: Workout = {
    id: options.id ?? makeId(),
    name: draft.name.trim(),
    exercises: draft.exercises.map((item) => {
      if (item.kind === 'resistance') {
        return {
          kind: 'resistance' as const,
          exerciseId: item.exerciseId,
          sets: Number(item.sets),
          targetReps: Number(item.targetReps),
          targetWeightKg: item.targetWeightKg ? Number(item.targetWeightKg) : undefined,
          restBetweenSetsSecs: item.restBetweenSetsSecs ? Number(item.restBetweenSetsSecs) : undefined,
          restBeforeNextSecs: item.restBeforeNextSecs ? Number(item.restBeforeNextSecs) : undefined,
        };
      } else {
        return {
          kind: 'timed' as const,
          exerciseId: item.exerciseId,
          sets: Number(item.sets),
          durationSecs: Number(item.durationSecs),
          restBetweenSetsSecs: item.restBetweenSetsSecs ? Number(item.restBetweenSetsSecs) : undefined,
          restBeforeNextSecs: item.restBeforeNextSecs ? Number(item.restBeforeNextSecs) : undefined,
        };
      }
    }),
    createdAt: now,
    updatedAt: now,
  };
  return { state: { ...state, workouts: [...state.workouts, workout] }, workout, errors: [] };
}

export function updateWorkout(
  state: PlannerState,
  workoutId: string,
  draft: WorkoutDraft,
  options: { now?: string } = {},
): { state: PlannerState; workout: Workout | null; errors: ValidationError[] } {
  const existing = state.workouts.find((w) => w.id === workoutId);
  if (!existing) throw new Error('Workout not found.');
  const errors = validateWorkout(draft, activeCatalogue(state.customExercises));
  if (errors.length) return { state, workout: null, errors };
  const workout: Workout = {
    ...existing,
    name: draft.name.trim(),
    exercises: draft.exercises.map((item) => {
      if (item.kind === 'resistance') {
        return {
          kind: 'resistance' as const,
          exerciseId: item.exerciseId,
          sets: Number(item.sets),
          targetReps: Number(item.targetReps),
          targetWeightKg: item.targetWeightKg ? Number(item.targetWeightKg) : undefined,
          restBetweenSetsSecs: item.restBetweenSetsSecs ? Number(item.restBetweenSetsSecs) : undefined,
          restBeforeNextSecs: item.restBeforeNextSecs ? Number(item.restBeforeNextSecs) : undefined,
        };
      } else {
        return {
          kind: 'timed' as const,
          exerciseId: item.exerciseId,
          sets: Number(item.sets),
          durationSecs: Number(item.durationSecs),
          restBetweenSetsSecs: item.restBetweenSetsSecs ? Number(item.restBetweenSetsSecs) : undefined,
          restBeforeNextSecs: item.restBeforeNextSecs ? Number(item.restBeforeNextSecs) : undefined,
        };
      }
    }),
    updatedAt: options.now ?? new Date().toISOString(),
  };
  return {
    state: { ...state, workouts: state.workouts.map((w) => (w.id === workoutId ? workout : w)) },
    workout,
    errors: [],
  };
}

export function deleteWorkout(state: PlannerState, workoutId: string): PlannerState {
  if (state.activeSession?.workoutId === workoutId)
    throw new Error('Finish or discard the active session before deleting this workout.');
  return { ...state, workouts: state.workouts.filter((w) => w.id !== workoutId) };
}

export function duplicateWorkout(
  state: PlannerState,
  workoutId: string,
  options: { id?: string; now?: string } = {},
): { state: PlannerState; workout: Workout } {
  const source = state.workouts.find((w) => w.id === workoutId);
  if (!source) throw new Error('Workout not found.');
  const existing = new Set(state.workouts.map((w) => w.name));
  const base = `Copy of ${source.name}`;
  let name = base.slice(0, 50);
  if (existing.has(name)) {
    for (let n = 2; ; n++) {
      const candidate = `${base} (${n})`.slice(0, 50);
      if (!existing.has(candidate)) { name = candidate; break; }
    }
  }
  const now = options.now ?? new Date().toISOString();
  const workout: Workout = {
    id: options.id ?? makeId(),
    name,
    exercises: source.exercises.map((item) => ({ ...item })),
    createdAt: now,
    updatedAt: now,
  };
  return { state: { ...state, workouts: [...state.workouts, workout] }, workout };
}

export function defaultDraftForExercise(
  exerciseId: string,
  catalog: readonly Exercise[] = EXERCISES,
): WorkoutExerciseDraft {
  const exercise = catalog.find((e) => e.id === exerciseId);
  if (!exercise) throw new Error(`Exercise ${exerciseId} not found.`);

  if (exercise.measurement === 'timed') {
    return {
      kind: 'timed',
      exerciseId,
      sets: 3,
      durationSecs: 30,
      restBetweenSetsSecs: '',
      restBeforeNextSecs: '',
    };
  }
  return {
    kind: 'resistance',
    exerciseId,
    sets: 3,
    targetReps: 8,
    targetWeightKg: '',
    restBetweenSetsSecs: '',
    restBeforeNextSecs: '',
  };
}

export function workoutToDraft(workout: Workout): WorkoutDraft {
  return {
    id: workout.id,
    name: workout.name,
    exercises: workout.exercises.map((item) => {
      if (item.kind === 'resistance') {
        return {
          kind: 'resistance' as const,
          exerciseId: item.exerciseId,
          sets: item.sets,
          targetReps: item.targetReps,
          targetWeightKg: item.targetWeightKg ?? '',
          restBetweenSetsSecs: item.restBetweenSetsSecs ?? '',
          restBeforeNextSecs: item.restBeforeNextSecs ?? '',
        };
      }
      return {
        kind: 'timed' as const,
        exerciseId: item.exerciseId,
        sets: item.sets,
        durationSecs: item.durationSecs,
        restBetweenSetsSecs: item.restBetweenSetsSecs ?? '',
        restBeforeNextSecs: item.restBeforeNextSecs ?? '',
      };
    }),
  };
}

export function workoutSummary(workout: Workout): { exerciseCount: number; totalSets: number } {
  return {
    exerciseCount: workout.exercises.length,
    totalSets: workout.exercises.reduce((sum, e) => sum + e.sets, 0),
  };
}

export function exerciseName(id: string): string {
  return exerciseById(id)?.name ?? 'Unknown exercise';
}
