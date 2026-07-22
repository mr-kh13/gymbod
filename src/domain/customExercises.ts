import type {
  PlannerState,
  CustomExercise,
  CustomExerciseDraft,
  ValidationError,
} from './types';
import type { Exercise } from './types';
import { activeCatalogue } from './catalog';

export function validateCustomExercise(
  draft: CustomExerciseDraft,
  allExercises: readonly Exercise[],
  currentCustom: readonly CustomExercise[],
  excludeId?: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const trimmed = draft.name.trim();

  if (trimmed.length === 0) {
    errors.push({ field: 'name', message: 'Enter an exercise name.' });
    return errors;
  }

  if (trimmed.length > 50) {
    errors.push({ field: 'name', message: 'Use 50 characters or fewer.' });
  }

  const lower = trimmed.toLowerCase();

  const duplicateInExercises = allExercises
    .filter((e) => e.id !== excludeId)
    .some((e) => e.name.toLowerCase() === lower);

  const duplicateInCustom = currentCustom
    .filter((e) => e.id !== excludeId)
    .some((e) => e.name.toLowerCase() === lower);

  if (duplicateInExercises || duplicateInCustom) {
    errors.push({ field: 'name', message: 'An exercise with this name already exists.' });
  }

  return errors;
}

export function createCustomExercise(
  state: PlannerState,
  draft: CustomExerciseDraft,
  options?: { id?: string; now?: string },
): { state: PlannerState; exercise: CustomExercise | null; errors: ValidationError[] } {
  const catalogue = activeCatalogue(state.customExercises);
  const errors = validateCustomExercise(draft, catalogue, state.customExercises);
  if (errors.length) {
    return { state, exercise: null, errors };
  }

  const now = options?.now ?? new Date().toISOString();
  const id = options?.id ?? crypto.randomUUID();
  const exercise: CustomExercise = {
    id,
    name: draft.name.trim(),
    measurement: draft.measurement,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  return {
    state: { ...state, customExercises: [...state.customExercises, exercise] },
    exercise,
    errors: [],
  };
}

export function renameCustomExercise(
  state: PlannerState,
  id: string,
  name: string,
  options?: { now?: string },
): { state: PlannerState; exercise: CustomExercise | null; errors: ValidationError[] } {
  const existing = state.customExercises.find((e) => e.id === id);
  if (!existing) throw new Error(`Custom exercise "${id}" not found.`);

  const catalogue = activeCatalogue(state.customExercises);
  const errors = validateCustomExercise(
    { name, measurement: existing.measurement },
    catalogue,
    state.customExercises,
    id,
  );
  if (errors.length) {
    return { state, exercise: null, errors };
  }

  const now = options?.now ?? new Date().toISOString();
  const updated: CustomExercise = { ...existing, name: name.trim(), updatedAt: now };
  return {
    state: {
      ...state,
      customExercises: state.customExercises.map((e) => (e.id === id ? updated : e)),
    },
    exercise: updated,
    errors: [],
  };
}

export function retireCustomExercise(
  state: PlannerState,
  id: string,
  options?: { now?: string },
): PlannerState {
  const existing = state.customExercises.find((e) => e.id === id);
  if (!existing) throw new Error(`Custom exercise "${id}" not found.`);
  const now = options?.now ?? new Date().toISOString();
  return {
    ...state,
    customExercises: state.customExercises.map((e) =>
      e.id === id ? { ...e, status: 'retired', updatedAt: now } : e,
    ),
  };
}

export function reactivateCustomExercise(
  state: PlannerState,
  id: string,
  options?: { now?: string },
): PlannerState {
  const existing = state.customExercises.find((e) => e.id === id);
  if (!existing) throw new Error(`Custom exercise "${id}" not found.`);
  const now = options?.now ?? new Date().toISOString();
  return {
    ...state,
    customExercises: state.customExercises.map((e) =>
      e.id === id ? { ...e, status: 'active', updatedAt: now } : e,
    ),
  };
}
