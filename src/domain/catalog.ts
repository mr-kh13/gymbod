import type { Exercise } from './types';

export const EXERCISES: readonly Exercise[] = Object.freeze([
  { id: 'bench-press', name: 'Bench press', category: 'upper', measurement: 'resistance' },
  { id: 'overhead-press', name: 'Overhead press', category: 'upper', measurement: 'resistance' },
  { id: 'lat-pulldown', name: 'Lat pulldown', category: 'upper', measurement: 'resistance' },
  { id: 'seated-row', name: 'Seated row', category: 'upper', measurement: 'resistance' },
  { id: 'biceps-curl', name: 'Biceps curl', category: 'upper', measurement: 'resistance' },
  { id: 'triceps-pushdown', name: 'Triceps pushdown', category: 'upper', measurement: 'resistance' },
  { id: 'back-squat', name: 'Back squat', category: 'lower', measurement: 'resistance' },
  { id: 'deadlift', name: 'Deadlift', category: 'lower', measurement: 'resistance' },
  { id: 'leg-press', name: 'Leg press', category: 'lower', measurement: 'resistance' },
  { id: 'romanian-deadlift', name: 'Romanian deadlift', category: 'lower', measurement: 'resistance' },
  { id: 'plank', name: 'Plank', category: 'core', measurement: 'timed' },
  { id: 'cable-crunch', name: 'Cable crunch', category: 'core', measurement: 'resistance' },
]);

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
