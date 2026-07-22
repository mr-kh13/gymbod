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
    exercises: [{
      kind: 'resistance' as const,
      exerciseId: 'bench-press',
      sets: 1,
      targetReps: 8,
      targetWeightKg: '',
      restBetweenSetsSecs: '',
      restBeforeNextSecs: '',
    }],
  }, { id: 'w1' }).state;
  state = startSession(state, 'w1', { id: 's1', now: '2026-07-20T09:00:00.000Z' });
  state = recordSet(state, 'bench-press', 1, { completed: true, actualWeightKg: 80, actualReps: 8 });
  state = finishSession(state, { now: '2026-07-20T10:00:00.000Z' }).state;
  return state;
}

function buildMultiSessionState(n: number) {
  let state = createWorkout(createDefaultState(), {
    id: null,
    name: 'Push day',
    exercises: [{
      kind: 'resistance' as const,
      exerciseId: 'bench-press',
      sets: 1,
      targetReps: 8,
      targetWeightKg: '',
      restBetweenSetsSecs: '',
      restBeforeNextSecs: '',
    }],
  }, { id: 'w1' }).state;

  for (let i = 0; i < n; i++) {
    state = startSession(state, 'w1', {
      id: `s${i}`,
      now: new Date(Date.UTC(2026, 0, i + 1, 9)).toISOString(),
    });
    state = recordSet(state, 'bench-press', 1, { completed: true });
    state = finishSession(state, {
      now: new Date(Date.UTC(2026, 0, i + 1, 10, 30)).toISOString(),
    }).state;
  }
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

  it('[T013] displays weight in history detail eyebrow when set', async () => {
    const user = userEvent.setup();
    const state = createWorkout(createDefaultState(), {
      id: null,
      name: 'Push day',
      exercises: [{
        kind: 'resistance' as const,
        exerciseId: 'bench-press',
        sets: 1,
        targetReps: 8,
        targetWeightKg: 80,
        restBetweenSetsSecs: '',
        restBeforeNextSecs: '',
      }],
    }, { id: 'w1' }).state;

    let sessionState = startSession(state, 'w1', { id: 's1', now: '2026-07-20T09:00:00.000Z' });
    sessionState = recordSet(sessionState, 'bench-press', 1, { completed: true, actualWeightKg: 80, actualReps: 8 });
    sessionState = finishSession(sessionState, { now: '2026-07-20T10:00:00.000Z' }).state;

    renderAt('/history', memoryRepo(sessionState));
    await waitFor(() => screen.getByText('Push day'));
    await user.click(screen.getByRole('button', { name: /push day/i }));

    await waitFor(() => {
      expect(screen.getByText(/@ 80 kg/)).toBeInTheDocument();
    });
  });

  it('[T020] displays duration in history detail for timed exercises', async () => {
    const user = userEvent.setup();
    const state = createWorkout(createDefaultState(), {
      id: null,
      name: 'Core day',
      exercises: [{
        kind: 'timed' as const,
        exerciseId: 'plank',
        sets: 3,
        durationSecs: 60,
        restBetweenSetsSecs: '',
        restBeforeNextSecs: '',
      }],
    }, { id: 'w1' }).state;

    let sessionState = startSession(state, 'w1', { id: 's1', now: '2026-07-20T09:00:00.000Z' });
    sessionState = recordSet(sessionState, 'plank', 1, { completed: true });
    sessionState = finishSession(sessionState, { now: '2026-07-20T10:00:00.000Z' }).state;

    renderAt('/history', memoryRepo(sessionState));
    await waitFor(() => screen.getByText('Core day'));
    await user.click(screen.getByRole('button', { name: /core day/i }));

    await waitFor(() => {
      expect(screen.getByText(/plank/i)).toBeInTheDocument();
      expect(screen.getByText(/sets · 60s/)).toBeInTheDocument();
    });
  });

  it('[T027] displays rest times in history detail', async () => {
    const user = userEvent.setup();
    const state = createWorkout(createDefaultState(), {
      id: null,
      name: 'Push day',
      exercises: [{
        kind: 'resistance' as const,
        exerciseId: 'bench-press',
        sets: 1,
        targetReps: 8,
        targetWeightKg: '',
        restBetweenSetsSecs: 90,
        restBeforeNextSecs: 120,
      }],
    }, { id: 'w1' }).state;

    let sessionState = startSession(state, 'w1', { id: 's1', now: '2026-07-20T09:00:00.000Z' });
    sessionState = recordSet(sessionState, 'bench-press', 1, { completed: true });
    sessionState = finishSession(sessionState, { now: '2026-07-20T10:00:00.000Z' }).state;

    renderAt('/history', memoryRepo(sessionState));
    await waitFor(() => screen.getByText('Push day'));
    await user.click(screen.getByRole('button', { name: /push day/i }));

    await waitFor(() => {
      // Should show rest times in the history detail
      expect(screen.getByText(/90/)).toBeInTheDocument();
      expect(screen.getByText(/120/)).toBeInTheDocument();
    });
  });
});

describe('History — US1: Browse complete training history', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('lists all sessions when more than 20 are stored', async () => {
    renderAt('/history', memoryRepo(buildMultiSessionState(21)));
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /push day/i });
      expect(buttons).toHaveLength(21);
    });
  });
});

describe('History — US2: Inspect preserved snapshot', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows formatted training duration in session detail', async () => {
    const user = userEvent.setup();
    renderAt('/history', memoryRepo(stateWithCompletedSession()));
    await waitFor(() => screen.getByText('Push day'));
    await user.click(screen.getByRole('button', { name: /push day/i }));
    await waitFor(() => {
      expect(screen.getByText(/1h/)).toBeInTheDocument();
    });
  });

  it('shows original workout name in detail after routine is renamed', async () => {
    const user = userEvent.setup();
    const base = stateWithCompletedSession();
    const renamed = {
      ...base,
      workouts: base.workouts.map((w) => ({ ...w, name: 'Leg Day' })),
    };
    renderAt('/history', memoryRepo(renamed));
    await waitFor(() => screen.getByText('Push day'));
    await user.click(screen.getByRole('button', { name: /push day/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Push day');
      expect(screen.queryByText('Leg Day')).not.toBeInTheDocument();
    });
  });
});

describe('History — US3: Understand partial sessions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows completion ratio in list and ○ markers in detail for partial sessions', async () => {
    const user = userEvent.setup();
    let state = createWorkout(createDefaultState(), {
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
    state = startSession(state, 'w1', { id: 's1', now: '2026-07-20T09:00:00.000Z' });
    state = recordSet(state, 'bench-press', 1, { completed: true });
    state = finishSession(state, { now: '2026-07-20T10:00:00.000Z' }).state;

    renderAt('/history', memoryRepo(state));
    await waitFor(() => {
      expect(screen.getByText(/1\/3 sets/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /push day/i }));
    await waitFor(() => {
      const body = document.body.textContent ?? '';
      expect(body).toContain('1/3 sets completed');
      expect(body).toContain('✓');
      expect(body).toContain('○');
    });
  });
});

describe('History — US4: Navigate empty history', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows empty state message and a link to plans when no sessions exist', async () => {
    renderAt('/history');
    await waitFor(() => {
      expect(screen.getByText(/nothing logged yet/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view plans/i })).toBeInTheDocument();
    });
  });
});
