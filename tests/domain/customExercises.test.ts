import { describe, it, expect } from 'vitest';
import {
  validateCustomExercise,
  createCustomExercise,
  renameCustomExercise,
  retireCustomExercise,
  reactivateCustomExercise,
} from '../../src/domain/customExercises';
import { activeCatalogue, findExercise } from '../../src/domain/catalog';
import { EXERCISES } from '../../src/domain/catalog';
import { createDefaultState } from '../../src/domain/storage';
import type { CustomExercise, CustomExerciseDraft } from '../../src/domain/types';

const resistanceDraft: CustomExerciseDraft = { name: 'Cable Face Pull', measurement: 'resistance' };

function makeCustom(overrides: Partial<CustomExercise> = {}): CustomExercise {
  return {
    id: 'c1',
    name: 'Dragon Flag',
    measurement: 'timed',
    status: 'active',
    createdAt: '2026-07-22T10:00:00.000Z',
    updatedAt: '2026-07-22T10:00:00.000Z',
    ...overrides,
  };
}

describe('validateCustomExercise', () => {
  it('returns error for empty name', () => {
    const errors = validateCustomExercise({ name: '', measurement: 'resistance' }, EXERCISES, []);
    expect(errors).toContainEqual({ field: 'name', message: 'Enter an exercise name.' });
  });

  it('returns error for whitespace-only name', () => {
    const errors = validateCustomExercise({ name: '   ', measurement: 'resistance' }, EXERCISES, []);
    expect(errors).toContainEqual({ field: 'name', message: 'Enter an exercise name.' });
  });

  it('returns error for name over 50 characters', () => {
    const longName = 'A'.repeat(51);
    const errors = validateCustomExercise({ name: longName, measurement: 'resistance' }, EXERCISES, []);
    expect(errors).toContainEqual({ field: 'name', message: 'Use 50 characters or fewer.' });
  });

  it('returns duplicate error for case-insensitive match with predefined exercise', () => {
    const errors = validateCustomExercise({ name: 'bench press', measurement: 'resistance' }, EXERCISES, []);
    expect(errors).toContainEqual({ field: 'name', message: 'An exercise with this name already exists.' });
  });

  it('returns duplicate error for case-insensitive match with existing custom exercise', () => {
    const existing = [makeCustom({ name: 'Dragon Flag' })];
    const errors = validateCustomExercise({ name: 'dragon flag', measurement: 'timed' }, EXERCISES, existing);
    expect(errors).toContainEqual({ field: 'name', message: 'An exercise with this name already exists.' });
  });

  it('allows rename to own current name when excludeId is provided', () => {
    const existing = [makeCustom({ id: 'c1', name: 'Dragon Flag' })];
    const errors = validateCustomExercise({ name: 'Dragon Flag', measurement: 'timed' }, EXERCISES, existing, 'c1');
    expect(errors).toHaveLength(0);
  });

  it('returns no errors for a valid unique name', () => {
    const errors = validateCustomExercise(resistanceDraft, EXERCISES, []);
    expect(errors).toHaveLength(0);
  });
});

describe('retireCustomExercise', () => {
  it('sets status to retired and updates updatedAt', () => {
    const base = createDefaultState();
    const created = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1', now: '2026-07-22T10:00:00.000Z' });
    const retired = retireCustomExercise(created.state, 'c1', { now: '2026-07-22T11:00:00.000Z' });
    expect(retired.customExercises[0].status).toBe('retired');
    expect(retired.customExercises[0].updatedAt).toBe('2026-07-22T11:00:00.000Z');
    expect(retired.customExercises[0].createdAt).toBe('2026-07-22T10:00:00.000Z');
  });

  it('throws when exercise id is not found', () => {
    expect(() => retireCustomExercise(createDefaultState(), 'nonexistent')).toThrow();
  });

  it('retired exercise is excluded from activeCatalogue', () => {
    const base = createDefaultState();
    const created = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1' });
    const retired = retireCustomExercise(created.state, 'c1');
    const catalogue = activeCatalogue(retired.customExercises);
    expect(catalogue.find((e) => e.id === 'c1')).toBeUndefined();
  });

  it('retired exercise is still found by findExercise', () => {
    const base = createDefaultState();
    const created = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1' });
    const retired = retireCustomExercise(created.state, 'c1');
    const found = findExercise('c1', retired.customExercises);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Dragon Flag');
  });
});

describe('reactivateCustomExercise', () => {
  it('sets status to active and updates updatedAt', () => {
    const base = createDefaultState();
    const created = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1', now: '2026-07-22T10:00:00.000Z' });
    const retired = retireCustomExercise(created.state, 'c1', { now: '2026-07-22T11:00:00.000Z' });
    const reactivated = reactivateCustomExercise(retired, 'c1', { now: '2026-07-22T12:00:00.000Z' });
    expect(reactivated.customExercises[0].status).toBe('active');
    expect(reactivated.customExercises[0].updatedAt).toBe('2026-07-22T12:00:00.000Z');
  });

  it('throws when exercise id is not found', () => {
    expect(() => reactivateCustomExercise(createDefaultState(), 'nonexistent')).toThrow();
  });

  it('reactivated exercise appears in activeCatalogue again', () => {
    const base = createDefaultState();
    const created = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1' });
    const retired = retireCustomExercise(created.state, 'c1');
    const reactivated = reactivateCustomExercise(retired, 'c1');
    const catalogue = activeCatalogue(reactivated.customExercises);
    expect(catalogue.find((e) => e.id === 'c1')).toBeDefined();
  });
});

describe('renameCustomExercise', () => {
  it('updates name and updatedAt, leaves other fields unchanged', () => {
    const base = createDefaultState();
    const created = createCustomExercise(base, { name: 'Face Pull', measurement: 'resistance' }, { id: 'c1', now: '2026-07-22T10:00:00.000Z' });
    const { state, exercise, errors } = renameCustomExercise(created.state, 'c1', 'Cable Face Pull', { now: '2026-07-22T11:00:00.000Z' });
    expect(errors).toHaveLength(0);
    expect(exercise?.name).toBe('Cable Face Pull');
    expect(exercise?.updatedAt).toBe('2026-07-22T11:00:00.000Z');
    expect(exercise?.createdAt).toBe('2026-07-22T10:00:00.000Z');
    expect(exercise?.id).toBe('c1');
    expect(exercise?.measurement).toBe('resistance');
    expect(state.customExercises[0].name).toBe('Cable Face Pull');
  });

  it('allows rename to own current name (excludeId skips self)', () => {
    const base = createDefaultState();
    const created = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1' });
    const { errors } = renameCustomExercise(created.state, 'c1', 'Dragon Flag');
    expect(errors).toHaveLength(0);
  });

  it('returns duplicate error when renaming to a predefined exercise name', () => {
    const base = createDefaultState();
    const created = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1' });
    const { errors, exercise } = renameCustomExercise(created.state, 'c1', 'Bench press');
    expect(errors).toContainEqual({ field: 'name', message: 'An exercise with this name already exists.' });
    expect(exercise).toBeNull();
  });

  it('returns duplicate error when renaming to another custom exercise name', () => {
    const base = createDefaultState();
    const s1 = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1' });
    const s2 = createCustomExercise(s1.state, { name: 'Face Pull', measurement: 'resistance' }, { id: 'c2' });
    const { errors } = renameCustomExercise(s2.state, 'c2', 'Dragon Flag');
    expect(errors).toContainEqual({ field: 'name', message: 'An exercise with this name already exists.' });
  });

  it('throws when exercise id is not found', () => {
    expect(() => renameCustomExercise(createDefaultState(), 'nonexistent', 'New Name')).toThrow();
  });
});

describe('createCustomExercise', () => {
  it('appends a new active exercise to state with deterministic id from options', () => {
    const state = createDefaultState();
    const result = createCustomExercise(state, resistanceDraft, { id: 'fixed-id', now: '2026-07-22T10:00:00.000Z' });
    expect(result.errors).toHaveLength(0);
    expect(result.exercise).not.toBeNull();
    expect(result.exercise?.id).toBe('fixed-id');
    expect(result.exercise?.name).toBe('Cable Face Pull');
    expect(result.exercise?.measurement).toBe('resistance');
    expect(result.exercise?.status).toBe('active');
    expect(result.exercise?.createdAt).toBe('2026-07-22T10:00:00.000Z');
    expect(result.state.customExercises).toHaveLength(1);
  });

  it('trims whitespace from name before saving', () => {
    const state = createDefaultState();
    const result = createCustomExercise(
      state,
      { name: '  Cable Face Pull  ', measurement: 'resistance' },
      { id: 'c1' },
    );
    expect(result.exercise?.name).toBe('Cable Face Pull');
  });

  it('returns unchanged state and validation errors for empty name', () => {
    const state = createDefaultState();
    const result = createCustomExercise(state, { name: '', measurement: 'resistance' });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.exercise).toBeNull();
    expect(result.state.customExercises).toHaveLength(0);
    expect(result.state).toBe(state);
  });

  it('returns unchanged state and validation errors for duplicate name', () => {
    const base = createDefaultState();
    const first = createCustomExercise(base, { name: 'Dragon Flag', measurement: 'timed' }, { id: 'c1' });
    const second = createCustomExercise(first.state, { name: 'dragon flag', measurement: 'timed' });
    expect(second.errors.length).toBeGreaterThan(0);
    expect(second.state.customExercises).toHaveLength(1);
  });
});
