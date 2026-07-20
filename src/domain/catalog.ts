import type { Exercise } from './types';

export const EXERCISES: readonly Exercise[] = Object.freeze([
  { id: 'bench-press', name: 'Bench press', category: 'upper' },
  { id: 'overhead-press', name: 'Overhead press', category: 'upper' },
  { id: 'lat-pulldown', name: 'Lat pulldown', category: 'upper' },
  { id: 'seated-row', name: 'Seated row', category: 'upper' },
  { id: 'biceps-curl', name: 'Biceps curl', category: 'upper' },
  { id: 'triceps-pushdown', name: 'Triceps pushdown', category: 'upper' },
  { id: 'back-squat', name: 'Back squat', category: 'lower' },
  { id: 'deadlift', name: 'Deadlift', category: 'lower' },
  { id: 'leg-press', name: 'Leg press', category: 'lower' },
  { id: 'romanian-deadlift', name: 'Romanian deadlift', category: 'lower' },
  { id: 'plank', name: 'Plank', category: 'core' },
  { id: 'cable-crunch', name: 'Cable crunch', category: 'core' },
]);

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
