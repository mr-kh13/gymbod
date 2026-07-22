import type { PlannerState } from './types';
import { EXERCISES } from './catalog';

export const STORAGE_KEY = 'form.planner.v1';
export const THEME_KEY = 'form.planner.theme.v1';
export const SCHEMA_VERSION = 3 as const;

export class StorageCorruptionError extends Error {
  constructor(message = 'Saved planner data could not be read.') {
    super(message);
    this.name = 'StorageCorruptionError';
  }
}

export function createDefaultState(): PlannerState {
  return { schemaVersion: 3, workouts: [], activeSession: null, history: [], customExercises: [] };
}

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

interface SessionV1 extends Omit<PlannerState extends { activeSession: infer S } ? S : never, 'plannedExercises'> {
  plannedExercises: SessionExerciseV1[];
}

interface PlannerStateV1 {
  schemaVersion: 1;
  workouts: Array<Omit<PlannerState extends { workouts: Array<infer W> } ? W : never, 'exercises'> & { exercises: WorkoutExerciseV1[] }>;
  activeSession: Omit<SessionV1, 'plannedExercises'> & { plannedExercises: SessionExerciseV1[] } | null;
  history: (Omit<SessionV1, 'plannedExercises'> & { plannedExercises: SessionExerciseV1[] })[];
}

export function migrateV1toV2(v1: PlannerStateV1): PlannerStateV2 {
  const migrateExercise = (item: WorkoutExerciseV1) => {
    const exercise = EXERCISES.find((e) => e.id === item.exerciseId);
    if (exercise?.measurement === 'timed') {
      return {
        kind: 'timed' as const,
        exerciseId: item.exerciseId,
        sets: item.sets,
        durationSecs: item.targetReps,
      };
    }
    return {
      kind: 'resistance' as const,
      exerciseId: item.exerciseId,
      sets: item.sets,
      targetReps: item.targetReps,
    };
  };

  const workouts = v1.workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map(migrateExercise),
  })) as PlannerState['workouts'];

  const activeSession = v1.activeSession
    ? {
        ...v1.activeSession,
        plannedExercises: v1.activeSession.plannedExercises.map((item) => ({
          ...migrateExercise(item),
          exerciseName: item.exerciseName,
        })),
      } as PlannerState extends { activeSession: infer S } ? S : never
    : null;

  const history = v1.history.map((session) => ({
    ...session,
    plannedExercises: session.plannedExercises.map((item) => ({
      ...migrateExercise(item),
      exerciseName: item.exerciseName,
    })),
  })) as PlannerState['history'];

  return { schemaVersion: 2, workouts, activeSession, history };
}

export function migrateV2toV3(v2: PlannerStateV2): PlannerState {
  return { ...v2, schemaVersion: 3, customExercises: [] };
}

function isPlannerState(value: unknown): value is PlannerState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as PlannerState).schemaVersion === SCHEMA_VERSION &&
      Array.isArray((value as PlannerState).workouts) &&
      ((value as PlannerState).activeSession === null ||
        typeof (value as PlannerState).activeSession === 'object') &&
      Array.isArray((value as PlannerState).history) &&
      Array.isArray((value as PlannerState).customExercises),
  );
}

export interface PlannerRepository {
  load(): PlannerState;
  save(state: PlannerState): void;
  reset(): void;
}

export function createPlannerRepository(storage: Storage): PlannerRepository {
  return {
    load() {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) return createDefaultState();
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isPlannerState(parsed)) return parsed;
        if ((parsed as any)?.schemaVersion === 2) {
          return migrateV2toV3(parsed as PlannerStateV2);
        }
        if ((parsed as any)?.schemaVersion === 1) {
          return migrateV2toV3(migrateV1toV2(parsed as PlannerStateV1));
        }
        throw new StorageCorruptionError();
      } catch (error) {
        if (error instanceof StorageCorruptionError) throw error;
        throw new StorageCorruptionError();
      }
    },
    save(state: PlannerState) {
      if (!isPlannerState(state))
        throw new TypeError('Planner state does not match schema version 3.');
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    reset() {
      storage.removeItem(STORAGE_KEY);
    },
  };
}
