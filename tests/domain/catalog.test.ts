import { describe, it, expect } from 'vitest';
import { EXERCISES, activeCatalogue, findExercise, findExerciseName } from '../../src/domain/catalog';
import type { CustomExercise } from '../../src/domain/types';

const makeCustom = (overrides: Partial<CustomExercise> = {}): CustomExercise => ({
  id: 'custom-1',
  name: 'Dragon flag',
  measurement: 'timed',
  status: 'active',
  createdAt: '2026-07-22T10:00:00.000Z',
  updatedAt: '2026-07-22T10:00:00.000Z',
  ...overrides,
});

describe('activeCatalogue', () => {
  it('returns all predefined exercises when no custom exercises provided', () => {
    const catalogue = activeCatalogue([]);
    expect(catalogue).toHaveLength(EXERCISES.length);
    EXERCISES.forEach((e) => expect(catalogue).toContainEqual(e));
  });

  it('appends active custom exercises mapped to Exercise shape with category custom', () => {
    const custom = makeCustom({ id: 'c1', name: 'Dragon flag', measurement: 'timed', status: 'active' });
    const catalogue = activeCatalogue([custom]);
    expect(catalogue).toHaveLength(EXERCISES.length + 1);
    expect(catalogue.find((e) => e.id === 'c1')).toEqual({
      id: 'c1',
      name: 'Dragon flag',
      category: 'custom',
      measurement: 'timed',
    });
  });

  it('excludes retired custom exercises', () => {
    const retired = makeCustom({ id: 'c2', name: 'Old move', status: 'retired' });
    const catalogue = activeCatalogue([retired]);
    expect(catalogue).toHaveLength(EXERCISES.length);
    expect(catalogue.find((e) => e.id === 'c2')).toBeUndefined();
  });

  it('includes active and excludes retired when both present', () => {
    const active = makeCustom({ id: 'c1', name: 'Active move', status: 'active' });
    const retired = makeCustom({ id: 'c2', name: 'Retired move', status: 'retired' });
    const catalogue = activeCatalogue([active, retired]);
    expect(catalogue).toHaveLength(EXERCISES.length + 1);
    expect(catalogue.find((e) => e.id === 'c1')).toBeDefined();
    expect(catalogue.find((e) => e.id === 'c2')).toBeUndefined();
  });
});

describe('findExercise', () => {
  it('finds a predefined exercise by id', () => {
    const result = findExercise('bench-press', []);
    expect(result).toEqual({
      id: 'bench-press',
      name: 'Bench press',
      category: 'upper',
      measurement: 'resistance',
    });
  });

  it('finds an active custom exercise', () => {
    const custom = makeCustom({ id: 'c1', name: 'Dragon flag', measurement: 'timed', status: 'active' });
    const result = findExercise('c1', [custom]);
    expect(result).toEqual({ id: 'c1', name: 'Dragon flag', category: 'custom', measurement: 'timed' });
  });

  it('finds a retired custom exercise (findExercise searches all, not just active)', () => {
    const retired = makeCustom({ id: 'c1', name: 'Retired move', status: 'retired' });
    const result = findExercise('c1', [retired]);
    expect(result).toBeDefined();
    expect(result?.name).toBe('Retired move');
  });

  it('returns undefined for an unknown id', () => {
    expect(findExercise('does-not-exist', [])).toBeUndefined();
  });
});

describe('findExerciseName', () => {
  it('returns name for a predefined exercise', () => {
    expect(findExerciseName('bench-press', [])).toBe('Bench press');
  });

  it('returns name for an active custom exercise', () => {
    const custom = makeCustom({ id: 'c1', name: 'Dragon flag' });
    expect(findExerciseName('c1', [custom])).toBe('Dragon flag');
  });

  it('returns name for a retired custom exercise', () => {
    const retired = makeCustom({ id: 'c1', name: 'Old move', status: 'retired' });
    expect(findExerciseName('c1', [retired])).toBe('Old move');
  });

  it('returns Unknown exercise for an unknown id', () => {
    expect(findExerciseName('does-not-exist', [])).toBe('Unknown exercise');
  });
});
