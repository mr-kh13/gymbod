export const STORAGE_KEY = "form.planner.v1";
export const SCHEMA_VERSION = 1;

export class StorageCorruptionError extends Error {
  constructor(message = "Saved planner data could not be read.") {
    super(message);
    this.name = "StorageCorruptionError";
  }
}

export function createDefaultState() {
  return { schemaVersion: SCHEMA_VERSION, workouts: [], activeSession: null, history: [] };
}

function isPlannerState(value) {
  return Boolean(
    value &&
    value.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(value.workouts) &&
    (value.activeSession === null || typeof value.activeSession === "object") &&
    Array.isArray(value.history)
  );
}

export function createPlannerRepository(storage) {
  return {
    load() {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) return createDefaultState();
      try {
        const parsed = JSON.parse(raw);
        if (!isPlannerState(parsed)) throw new StorageCorruptionError();
        return parsed;
      } catch (error) {
        if (error instanceof StorageCorruptionError) throw error;
        throw new StorageCorruptionError();
      }
    },
    save(state) {
      if (!isPlannerState(state)) throw new TypeError("Planner state does not match schema version 1.");
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    reset() {
      storage.removeItem(STORAGE_KEY);
    }
  };
}
