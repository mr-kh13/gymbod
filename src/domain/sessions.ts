import type { PlannerState, Session, SetResult } from './types';
import { findExerciseName } from './catalog';

const makeId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function startSession(
  state: PlannerState,
  workoutId: string,
  options: { id?: string; now?: string } = {},
): PlannerState {
  if (state.activeSession) throw new Error('A session is already active.');
  const workout = state.workouts.find((w) => w.id === workoutId);
  if (!workout) throw new Error('Workout not found.');
  const plannedExercises = workout.exercises.map((item) => ({
    ...item,
    exerciseName: findExerciseName(item.exerciseId, state.customExercises),
  }));
  const results: SetResult[] = plannedExercises.flatMap((item) =>
    Array.from({ length: item.sets }, (_, i) => ({
      exerciseId: item.exerciseId,
      setNumber: i + 1,
      completed: false,
      actualWeightKg: null,
      actualReps: null,
    })),
  );
  return {
    ...state,
    activeSession: {
      id: options.id ?? makeId(),
      workoutId,
      workoutName: workout.name,
      plannedExercises,
      results,
      startedAt: options.now ?? new Date().toISOString(),
      status: 'active',
    },
  };
}

function optionalNumber(
  value: unknown,
  opts: { integer?: boolean; max: number; label: string },
): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > opts.max || (opts.integer && !Number.isInteger(n))) {
    throw new Error(`${opts.label} must be between 0 and ${opts.max}.`);
  }
  return n;
}

export function recordSet(
  state: PlannerState,
  exerciseId: string,
  setNumber: number,
  values: Partial<SetResult>,
): PlannerState {
  if (!state.activeSession) throw new Error('No session is active.');
  const found = state.activeSession.results.some(
    (r) => r.exerciseId === exerciseId && r.setNumber === Number(setNumber),
  );
  if (!found) throw new Error('Planned set not found.');
  const actualWeightKg = optionalNumber(values.actualWeightKg, { max: 1000, label: 'Weight' });
  const actualReps = optionalNumber(values.actualReps, {
    integer: true,
    max: 100,
    label: 'Repetitions',
  });
  const results = state.activeSession.results.map((r) =>
    r.exerciseId === exerciseId && r.setNumber === Number(setNumber)
      ? { ...r, completed: Boolean(values.completed), actualWeightKg, actualReps }
      : r,
  );
  return { ...state, activeSession: { ...state.activeSession, results } };
}

export function sessionSummary(session: Session): { completedSets: number; plannedSets: number } {
  return {
    completedSets: session.results.filter((r) => r.completed).length,
    plannedSets: session.results.length,
  };
}

export function finishSession(
  state: PlannerState,
  options: { now?: string } = {},
): { state: PlannerState; summary: { completedSets: number; plannedSets: number } } {
  if (!state.activeSession) throw new Error('No session is active.');
  const summary = sessionSummary(state.activeSession);
  if (summary.completedSets === 0)
    throw new Error('Complete at least one set before finishing.');
  const completed: Session = {
    ...state.activeSession,
    status: 'completed',
    finishedAt: options.now ?? new Date().toISOString(),
  };
  return {
    state: { ...state, activeSession: null, history: [completed, ...state.history].slice(0, 20) },
    summary,
  };
}

export function discardSession(state: PlannerState): PlannerState {
  if (!state.activeSession) throw new Error('No session is active.');
  return { ...state, activeSession: null };
}

export function historyItems(state: PlannerState) {
  return [...state.history]
    .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime())
    .slice(0, 20)
    .map((session) => ({
      id: session.id,
      workoutName: session.workoutName,
      finishedAt: session.finishedAt!,
      summary: sessionSummary(session),
    }));
}

export function sessionDetail(state: PlannerState, sessionId: string): Session | null {
  const session = state.history.find((s) => s.id === sessionId);
  return session ? structuredClone(session) : null;
}
