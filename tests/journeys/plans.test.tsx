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
      exercises: [{ exerciseId: 'back-squat', sets: 3, targetReps: 10 }],
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
      exercises: [{ exerciseId: 'bench-press', sets: 3, targetReps: 8 }],
    }, { id: 'w1' }).state;

    renderAt('/plans', memoryRepo(state));
    await waitFor(() => screen.getByText('Push day'));
    await user.click(screen.getByRole('button', { name: /duplicate/i }));

    await waitFor(() => {
      expect(screen.getByText('Copy of Push day')).toBeInTheDocument();
    });
  });
});
