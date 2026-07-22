import { createContext, useContext, useReducer, useRef, type ReactNode } from 'react';
import type { PlannerState, PlannerAction } from '../domain/types';
import {
  createPlannerRepository,
  createDefaultState,
  StorageCorruptionError,
  type PlannerRepository,
} from '../domain/storage';
import {
  createWorkout,
  updateWorkout,
  deleteWorkout,
  duplicateWorkout,
} from '../domain/workouts';
import {
  startSession,
  recordSet,
  finishSession,
  discardSession,
} from '../domain/sessions';

interface PlannerContextValue {
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;
  recoveryError: StorageCorruptionError | null;
  lastSummary: { completedSets: number; plannedSets: number } | null;
  clearLastSummary: () => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

function plannerReducer(
  state: PlannerState,
  action: PlannerAction,
): PlannerState {
  switch (action.type) {
    case 'CREATE_WORKOUT':
      return createWorkout(state, action.draft).state;
    case 'UPDATE_WORKOUT':
      return updateWorkout(state, action.id, action.draft).state;
    case 'DELETE_WORKOUT':
      return deleteWorkout(state, action.id);
    case 'DUPLICATE_WORKOUT':
      return duplicateWorkout(state, action.id).state;
    case 'START_SESSION':
      return startSession(state, action.workoutId);
    case 'RECORD_SET':
      return recordSet(state, action.exerciseId, action.setNumber, action.values);
    case 'FINISH_SESSION':
      return finishSession(state).state;
    case 'DISCARD_SESSION':
      return discardSession(state);
    case 'RESET_DATA':
      return createDefaultState();
    default:
      return state;
  }
}

export function PlannerProvider({
  children,
  repository: repoOverride,
}: {
  children: ReactNode;
  repository?: PlannerRepository;
}) {
  const repository = useRef<PlannerRepository>(
    repoOverride ?? createPlannerRepository(window.localStorage),
  );

  let initialState: PlannerState;
  let initialError: StorageCorruptionError | null = null;
  try {
    initialState = repository.current.load();
  } catch (e) {
    if (e instanceof StorageCorruptionError) {
      initialError = e;
      initialState = createDefaultState();
    } else {
      throw e;
    }
  }

  const [state, dispatch] = useReducer(
    (s: PlannerState, action: PlannerAction) => {
      const next = plannerReducer(s, action);
      if (action.type !== 'RESET_DATA') {
        try { repository.current.save(next); } catch { /* ignore */ }
      } else {
        repository.current.reset();
      }
      return next;
    },
    initialState,
  );

  const [recoveryError] = [initialError];
  const [lastSummary, setLastSummary] = useReducer(
    (_: { completedSets: number; plannedSets: number } | null, v: typeof _) => v,
    null,
  );

  // Intercept FINISH_SESSION to capture summary
  const wrappedDispatch: React.Dispatch<PlannerAction> = (action) => {
    if (action.type === 'FINISH_SESSION') {
      try {
        const result = finishSession(state);
        setLastSummary(result.summary);
      } catch { /* error handled by reducer */ }
    }
    dispatch(action);
  };

  return (
    <PlannerContext.Provider
      value={{
        state,
        dispatch: wrappedDispatch,
        recoveryError,
        lastSummary,
        clearLastSummary: () => setLastSummary(null),
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
}
