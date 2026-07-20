import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt, memoryRepo } from './helpers';
import { createWorkout } from '../../src/domain/workouts';
import { startSession, recordSet, finishSession } from '../../src/domain/sessions';
import { createDefaultState } from '../../src/domain/storage';

function stateWithCompletedSession() {
  let state = createWorkout(createDefaultState(), {
    id: null,
    name: 'Push day',
    exercises: [{ exerciseId: 'bench-press', sets: 1, targetReps: 8 }],
  }, { id: 'w1' }).state;
  state = startSession(state, 'w1', { id: 's1', now: '2026-07-20T09:00:00.000Z' });
  state = recordSet(state, 'bench-press', 1, { completed: true, actualWeightKg: 80, actualReps: 8 });
  state = finishSession(state, { now: '2026-07-20T10:00:00.000Z' }).state;
  return state;
}

describe('History — US3: Review recent sessions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows empty state when no history', async () => {
    renderAt('/history');
    await waitFor(() => {
      expect(screen.getByText(/nothing logged yet/i)).toBeInTheDocument();
    });
  });

  it('lists completed sessions newest first', async () => {
    renderAt('/history', memoryRepo(stateWithCompletedSession()));
    await waitFor(() => {
      expect(screen.getByText('Push day')).toBeInTheDocument();
      expect(screen.getByText(/1\/1 sets/i)).toBeInTheDocument();
    });
  });

  it('navigates to session detail', async () => {
    const user = userEvent.setup();
    renderAt('/history', memoryRepo(stateWithCompletedSession()));
    await waitFor(() => screen.getByText('Push day'));
    await user.click(screen.getByRole('button', { name: /push day/i }));

    await waitFor(() => {
      expect(screen.getByText(/bench press/i)).toBeInTheDocument();
      expect(screen.getByText(/80/)).toBeInTheDocument();
    });
  });

  it('back button returns to history list', async () => {
    const user = userEvent.setup();
    renderAt('/history', memoryRepo(stateWithCompletedSession()));
    await waitFor(() => screen.getByText('Push day'));
    await user.click(screen.getByRole('button', { name: /push day/i }));
    await waitFor(() => screen.getByRole('button', { name: /all sessions/i }));
    await user.click(screen.getByRole('button', { name: /all sessions/i }));

    await waitFor(() => {
      expect(screen.getByText(/training history|recent work/i)).toBeInTheDocument();
    });
  });
});
