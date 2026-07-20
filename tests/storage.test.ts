import { describe, it, expect } from 'vitest';
import {
  createDefaultState,
  createPlannerRepository,
  StorageCorruptionError,
} from '../src/domain/storage';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    clear: () => { data.clear(); },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() { return data.size; },
  };
}

describe('PlannerRepository', () => {
  it('loads a fresh versioned planner state', () => {
    const repository = createPlannerRepository(memoryStorage());
    expect(repository.load()).toEqual(createDefaultState());
  });

  it('round-trips saved planner state', () => {
    const repository = createPlannerRepository(memoryStorage());
    const state = { ...createDefaultState(), workouts: [{ id: 'w1' } as never] };
    repository.save(state as never);
    expect(repository.load()).toEqual(state);
  });

  it('reports malformed stored data without silently deleting it', () => {
    const repository = createPlannerRepository(memoryStorage({ 'form.planner.v1': '{' }));
    expect(() => repository.load()).toThrow(StorageCorruptionError);
  });

  it('reset removes malformed data and returns a fresh state', () => {
    const storage = memoryStorage({ 'form.planner.v1': '{' });
    const repository = createPlannerRepository(storage);
    repository.reset();
    expect(repository.load()).toEqual(createDefaultState());
  });
});
