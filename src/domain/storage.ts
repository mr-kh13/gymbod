import type { PlannerState } from './types';

export const STORAGE_KEY = 'form.planner.v1';
export const THEME_KEY = 'form.planner.theme.v1';
export const SCHEMA_VERSION = 1 as const;

export class StorageCorruptionError extends Error {
  constructor(message = 'Saved planner data could not be read.') {
    super(message);
    this.name = 'StorageCorruptionError';
  }
}

export function createDefaultState(): PlannerState {
  return { schemaVersion: 1, workouts: [], activeSession: null, history: [] };
}

function isPlannerState(value: unknown): value is PlannerState {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as PlannerState).schemaVersion === SCHEMA_VERSION &&
      Array.isArray((value as PlannerState).workouts) &&
      ((value as PlannerState).activeSession === null ||
        typeof (value as PlannerState).activeSession === 'object') &&
      Array.isArray((value as PlannerState).history),
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
        if (!isPlannerState(parsed)) throw new StorageCorruptionError();
        return parsed;
      } catch (error) {
        if (error instanceof StorageCorruptionError) throw error;
        throw new StorageCorruptionError();
      }
    },
    save(state: PlannerState) {
      if (!isPlannerState(state))
        throw new TypeError('Planner state does not match schema version 1.');
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    reset() {
      storage.removeItem(STORAGE_KEY);
    },
  };
}
