export type ExerciseCategory = 'upper' | 'lower' | 'core';
export type ExerciseMeasurement = 'resistance' | 'timed';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  measurement: ExerciseMeasurement;
}

export interface ResistanceWorkoutExercise {
  kind: 'resistance';
  exerciseId: string;
  sets: number;
  targetReps: number;
  targetWeightKg?: number;
  restBetweenSetsSecs?: number;
  restBeforeNextSecs?: number;
}

export interface TimedWorkoutExercise {
  kind: 'timed';
  exerciseId: string;
  sets: number;
  durationSecs: number;
  restBetweenSetsSecs?: number;
  restBeforeNextSecs?: number;
}

export type WorkoutExercise = ResistanceWorkoutExercise | TimedWorkoutExercise;

export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
}

export type ResistanceSessionExercise = ResistanceWorkoutExercise & { exerciseName: string };
export type TimedSessionExercise = TimedWorkoutExercise & { exerciseName: string };
export type SessionExercise = ResistanceSessionExercise | TimedSessionExercise;

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
  schemaVersion: 2;
  workouts: Workout[];
  activeSession: Session | null;
  history: Session[];
}

export interface ResistanceWorkoutExerciseDraft {
  kind: 'resistance';
  exerciseId: string;
  sets: string | number;
  targetReps: string | number;
  targetWeightKg: string | number;
  restBetweenSetsSecs: string | number;
  restBeforeNextSecs: string | number;
}

export interface TimedWorkoutExerciseDraft {
  kind: 'timed';
  exerciseId: string;
  sets: string | number;
  durationSecs: string | number;
  restBetweenSetsSecs: string | number;
  restBeforeNextSecs: string | number;
}

export type WorkoutExerciseDraft = ResistanceWorkoutExerciseDraft | TimedWorkoutExerciseDraft;

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
