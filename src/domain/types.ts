export type ExerciseCategory = 'upper' | 'lower' | 'core';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  targetReps: number;
}

export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionExercise extends WorkoutExercise {
  exerciseName: string;
}

export interface SetResult {
  exerciseId: string;
  setNumber: number;
  completed: boolean;
  actualWeightKg: number | null;
  actualReps: number | null;
}

export type SessionStatus = 'active' | 'completed';

export interface Session {
  id: string;
  workoutId: string;
  workoutName: string;
  plannedExercises: SessionExercise[];
  results: SetResult[];
  startedAt: string;
  finishedAt?: string;
  status: SessionStatus;
}

export interface PlannerState {
  schemaVersion: 1;
  workouts: Workout[];
  activeSession: Session | null;
  history: Session[];
}

export interface WorkoutExerciseDraft {
  exerciseId: string;
  sets: string | number;
  targetReps: string | number;
}

export interface WorkoutDraft {
  id: string | null;
  name: string;
  exercises: WorkoutExerciseDraft[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export type PlannerAction =
  | { type: 'CREATE_WORKOUT'; draft: WorkoutDraft }
  | { type: 'UPDATE_WORKOUT'; id: string; draft: WorkoutDraft }
  | { type: 'DELETE_WORKOUT'; id: string }
  | { type: 'DUPLICATE_WORKOUT'; id: string }
  | { type: 'START_SESSION'; workoutId: string }
  | { type: 'RECORD_SET'; exerciseId: string; setNumber: number; values: Partial<SetResult> }
  | { type: 'FINISH_SESSION' }
  | { type: 'DISCARD_SESSION' }
  | { type: 'RESET_DATA' };
