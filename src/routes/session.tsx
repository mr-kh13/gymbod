import { useState } from 'react';
import { createRoute, Link } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { usePlanner } from '../context/PlannerContext';
import { SessionExercise } from '../components/SessionExercise';
import { sessionSummary } from '../domain/sessions';
import type { SetResult } from '../domain/types';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session',
  component: SessionRoute,
});

function SessionRoute() {
  const { state, dispatch, lastSummary, clearLastSummary } = usePlanner();
  const { activeSession } = state;
  const [localSummary, setLocalSummary] = useState(lastSummary);

  if (!activeSession) {
    const summaryToShow = localSummary ?? lastSummary;
    return (
      <>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Active session</p>
            <h1>{summaryToShow ? 'Nice work.' : 'Start a workout from Plans'}</h1>
            <p className="lede">Your set progress stays on this device—even after a refresh.</p>
          </div>
        </section>
        {summaryToShow ? (
          <div className="summary-banner panel" role="status">
            <p className="eyebrow">Workout complete</p>
            <h2>
              {summaryToShow.completedSets} of {summaryToShow.plannedSets} sets completed
            </h2>
            <p>Your results are now available in History.</p>
            <Link to="/history" className="button">View history</Link>
          </div>
        ) : (
          <div className="empty-state panel">
            <Link to="/plans" className="button">View plans</Link>
          </div>
        )}
      </>
    );
  }

  const summary = sessionSummary(activeSession);

  function handleRecordSet(exerciseId: string, setNumber: number, values: Partial<SetResult>) {
    try {
      dispatch({ type: 'RECORD_SET', exerciseId, setNumber, values });
    } catch { /* ignore */ }
  }

  function handleFinish() {
    try {
      setLocalSummary(summary);
      dispatch({ type: 'FINISH_SESSION' });
      clearLastSummary();
    } catch { /* ignore */ }
  }

  function handleDiscard() {
    if (window.confirm('Discard this session? Recorded progress will be lost.')) {
      dispatch({ type: 'DISCARD_SESSION' });
      setLocalSummary(null);
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Active session</p>
          <h1>{activeSession.workoutName}</h1>
          <p className="lede">
            {summary.completedSets} of {summary.plannedSets} sets complete. Changes save immediately.
          </p>
        </div>
        <div className="session-actions">
          <button
            type="button"
            onClick={handleFinish}
            disabled={summary.completedSets === 0}
          >
            Finish session
          </button>
          <button
            type="button"
            className="text-button danger-text"
            onClick={handleDiscard}
          >
            Discard
          </button>
        </div>
      </section>
      <div className="session-stack">
        {activeSession.plannedExercises.map((exercise) => (
          <SessionExercise
            key={exercise.exerciseId}
            exercise={exercise}
            results={activeSession.results.filter((r) => r.exerciseId === exercise.exerciseId)}
            onRecordSet={handleRecordSet}
          />
        ))}
      </div>
    </>
  );
}
