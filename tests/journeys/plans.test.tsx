import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt, memoryRepo } from './helpers';
import { createWorkout } from '../../src/domain/workouts';
import { createDefaultState } from '../../src/domain/storage';

describe('Plans — US1: Plan a workout', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the empty state when no workouts exist', async () => {
    renderAt('/plans');
    await waitFor(() => {
      expect(screen.getByText(/build your first session/i)).toBeInTheDocument();
    });
  });

  it('creates a workout and shows it in the card grid', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await waitFor(() => screen.getByText(/build your first session/i));
    await user.click(screen.getByRole('button', { name: /create workout/i }));

    const nameInput = await screen.findByPlaceholderText(/e\.g\. push day/i);
    await user.type(nameInput, 'Push day');

    // Exercise row should already have a default exercise selected
    await user.click(screen.getByRole('button', { name: /save workout/i }));

    await waitFor(() => {
      expect(screen.getByText('Push day')).toBeInTheDocument();
    });
  });

  it('shows validation errors without losing entered values', async () => {
    const user = userEvent.setup();
    renderAt('/plans');
    await waitFor(() => screen.getByText(/build your first session/i));
    await user.click(screen.getByRole('button', { name: /create workout/i }));

    // Submit with no name
    await user.click(screen.getByRole('button', { name: /save workout/i }));
    expect(await screen.findByText(/enter a workout name/i)).toBeInTheDocument();
  });

  it('shows workout cards when workouts exist', async () => {
    const state = createWorkout(createDefaultState(), {
      id: null,
      name: 'Leg day',
      exercises: [{
        kind: 'resistance' as const,
        exerciseId: 'back-squat',
        sets: 3,
        targetReps: 10,
        targetWeightKg: '',
        restBetweenSetsSecs: '',
        restBeforeNextSecs: '',
      }],
    }, { id: 'w1' }).state;

    renderAt('/plans', memoryRepo(state));
    await waitFor(() => {
      expect(screen.getByText('Leg day')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('duplicates a workout and shows rename input', async () => {
    const user = userEvent.setup();
    const state = createWorkout(createDefaultState(), {
      id: null,
      name: 'Push day',
      exercises: [{
        kind: 'resistance' as const,
        exerciseId: 'bench-press',
        sets: 3,
        targetReps: 8,
        targetWeightKg: '',
        restBetweenSetsSecs: '',
        restBeforeNextSecs: '',
      }],
    }, { id: 'w1' }).state;

    renderAt('/plans', memoryRepo(state));
    await waitFor(() => screen.getByText('Push day'));
    await user.click(screen.getByRole('button', { name: /duplicate/i }));

    await waitFor(() => {
      expect(screen.getByText('Copy of Push day')).toBeInTheDocument();
    });
  });

  it('[T010] sets optional weight on resistance exercise and persists through edit cycle', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await waitFor(() => screen.getByText(/build your first session/i));
    await user.click(screen.getByRole('button', { name: /create workout/i }));

    const nameInput = await screen.findByPlaceholderText(/e\.g\. push day/i);
    await user.type(nameInput, 'Push day');

    // Verify weight input is visible and enter weight
    const weightInput = await screen.findByLabelText(/target weight/i) as HTMLInputElement;
    await user.type(weightInput, '60');

    await user.click(screen.getByRole('button', { name: /save workout/i }));

    await waitFor(() => {
      expect(screen.getByText('Push day')).toBeInTheDocument();
    });

    // Edit the workout and verify weight is still there
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editWeightInput = await screen.findByLabelText(/target weight/i) as HTMLInputElement;
    expect(editWeightInput.value).toBe('60');
  });

  it('[T011] opens workout with no weight target without error (backward compatibility)', async () => {
    const state = createWorkout(createDefaultState(), {
      id: null,
      name: 'Legacy workout',
      exercises: [{
        kind: 'resistance' as const,
        exerciseId: 'bench-press',
        sets: 3,
        targetReps: 8,
        targetWeightKg: '', // empty string = not set (backward compat scenario)
        restBetweenSetsSecs: '',
        restBeforeNextSecs: '',
      }],
    }, { id: 'w1' }).state;

    renderAt('/plans', memoryRepo(state));
    await waitFor(() => {
      expect(screen.getByText('Legacy workout')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /edit/i }));

    // Weight input should be visible but empty
    const weightInput = await screen.findByLabelText(/target weight/i) as HTMLInputElement;
    expect(weightInput.value).toBe('');
  });

  it('[T018] plank shows duration input not reps input', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await waitFor(() => screen.getByText(/build your first session/i));
    await user.click(screen.getByRole('button', { name: /create workout/i }));

    // Change exercise to plank
    const exerciseSelect = await screen.findByRole('combobox', { name: /exercise/i }) as HTMLSelectElement;
    await user.selectOptions(exerciseSelect, 'plank');

    // Verify duration input is present and reps input is not
    await waitFor(() => {
      expect(screen.queryByLabelText(/target reps/i)).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();

    // Enter duration and save
    const durationInput = screen.getByLabelText(/duration/i);
    await user.clear(durationInput);
    await user.type(durationInput, '60');

    const nameInput = screen.getByPlaceholderText(/e\.g\. push day/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Core day');

    await user.click(screen.getByRole('button', { name: /save workout/i }));

    await waitFor(() => {
      expect(screen.getByText('Core day')).toBeInTheDocument();
    });

    // Edit and verify duration persists
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editDurationInput = screen.getByLabelText(/duration/i) as HTMLInputElement;
    expect(editDurationInput.value).toBe('60');
  });

  it('[T026] sets rest times on exercise and persists through edit cycle', async () => {
    const user = userEvent.setup();
    renderAt('/plans');

    await waitFor(() => screen.getByText(/build your first session/i));
    await user.click(screen.getByRole('button', { name: /create workout/i }));

    const nameInput = await screen.findByPlaceholderText(/e\.g\. push day/i);
    await user.type(nameInput, 'Push day');

    // Enter rest times
    const restBetweenInput = await screen.findByLabelText(/rest between sets/i) as HTMLInputElement;
    await user.type(restBetweenInput, '90');

    const restBeforeInput = await screen.findByLabelText(/rest before next/i) as HTMLInputElement;
    await user.type(restBeforeInput, '120');

    await user.click(screen.getByRole('button', { name: /save workout/i }));

    await waitFor(() => {
      expect(screen.getByText('Push day')).toBeInTheDocument();
    });

    // Edit and verify rest times persist
    await user.click(screen.getByRole('button', { name: /edit/i }));
    const editRestBetweenInput = await screen.findByLabelText(/rest between sets/i) as HTMLInputElement;
    const editRestBeforeInput = await screen.findByLabelText(/rest before next/i) as HTMLInputElement;
    expect(editRestBetweenInput.value).toBe('90');
    expect(editRestBeforeInput.value).toBe('120');
  });
});
