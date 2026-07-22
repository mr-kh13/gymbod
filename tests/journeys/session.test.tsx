import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt, memoryRepo } from './helpers';
import { createWorkout } from '../../src/domain/workouts';
import { startSession, recordSet } from '../../src/domain/sessions';
import { createDefaultState } from '../../src/domain/storage';

function stateWithWorkout() {
  return createWorkout(createDefaultState(), {
    id: null,
    name: 'Push day',
    exercises: [
      {
        kind: 'resistance' as const,
        exerciseId: 'bench-press',
        sets: 2,
        targetReps: 8,
        targetWeightKg: '',
        restBetweenSetsSecs: '',
        restBeforeNextSecs: '',
      },
    ],
  }, { id: 'w1' }).state;
}

describe('Session — US2: Complete a planned session', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows empty state when no active session', async () => {
    renderAt('/session');
    await waitFor(() => {
      expect(screen.getByText(/start a workout from plans/i)).toBeInTheDocument();
    });
  });

  it('displays planned exercises and sets when session is active', async () => {
    const withSession = startSession(stateWithWorkout(), 'w1', {
      id: 's1',
      now: '2026-07-20T10:00:00.000Z',
    });
    renderAt('/session', memoryRepo(withSession));

    await waitFor(() => {
      expect(screen.getByText('Push day')).toBeInTheDocument();
      expect(screen.getByText(/bench press/i)).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    });
  });

  it('finishes a session and shows summary', async () => {
    const user = userEvent.setup();
    let state = stateWithWorkout();
    state = startSession(state, 'w1', { id: 's1', now: '2026-07-20T10:00:00.000Z' });
    state = recordSet(state, 'bench-press', 1, { completed: true });

    renderAt('/session', memoryRepo(state));
    await waitFor(() => screen.getByRole('button', { name: /finish session/i }));

    const finishBtn = screen.getByRole('button', { name: /finish session/i });
    await user.click(finishBtn);

    await waitFor(() => {
      expect(screen.getByText(/session saved|nice work/i)).toBeInTheDocument();
    });
  });

  it('discard requires confirmation', async () => {
    const user = userEvent.setup();
    const withSession = startSession(stateWithWorkout(), 'w1', {
      id: 's1',
      now: '2026-07-20T10:00:00.000Z',
    });
    renderAt('/session', memoryRepo(withSession));
    await waitFor(() => screen.getByRole('button', { name: /discard/i }));

    window.confirm = () => false;
    await user.click(screen.getByRole('button', { name: /discard/i }));
    // Session should still be active (confirm was cancelled)
    expect(screen.getByRole('button', { name: /finish session/i })).toBeInTheDocument();
  });

  it('[T012] displays weight in eyebrow when set', async () => {
    const state = createWorkout(createDefaultState(), {
      id: null,
      name: 'Push day',
      exercises: [
        {
          kind: 'resistance' as const,
          exerciseId: 'bench-press',
          sets: 2,
          targetReps: 8,
          targetWeightKg: 80,
          restBetweenSetsSecs: '',
          restBeforeNextSecs: '',
        },
      ],
    }, { id: 'w1' }).state;

    const withSession = startSession(state, 'w1', {
      id: 's1',
      now: '2026-07-20T10:00:00.000Z',
    });
    renderAt('/session', memoryRepo(withSession));

    await waitFor(() => {
      expect(screen.getByText(/@ 80 kg/)).toBeInTheDocument();
    });
  });

  it('[T019] displays duration for timed exercises', async () => {
    const state = createWorkout(createDefaultState(), {
      id: null,
      name: 'Core day',
      exercises: [
        {
          kind: 'timed' as const,
          exerciseId: 'plank',
          sets: 3,
          durationSecs: 60,
          restBetweenSetsSecs: '',
          restBeforeNextSecs: '',
        },
      ],
    }, { id: 'w1' }).state;

    const withSession = startSession(state, 'w1', {
      id: 's1',
      now: '2026-07-20T10:00:00.000Z',
    });
    renderAt('/session', memoryRepo(withSession));

    await waitFor(() => {
      expect(screen.getByText(/plank/i)).toBeInTheDocument();
      expect(screen.getByText(/sets · 60s/)).toBeInTheDocument();
    });
  });
});
