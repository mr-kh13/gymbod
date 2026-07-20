import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { usePlanner } from '../context/PlannerContext';
import { sessionDetail } from '../domain/sessions';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history/$sessionId',
  component: SessionDetailRoute,
});

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

function SessionDetailRoute() {
  const { sessionId } = Route.useParams();
  const { state } = usePlanner();
  const navigate = useNavigate();
  const session = sessionDetail(state, sessionId);

  if (!session) {
    return (
      <>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Session detail</p>
            <h1>Not found</h1>
            <p className="lede">This session no longer exists or was never recorded.</p>
          </div>
        </section>
        <div className="empty-state panel">
          <button type="button" className="button" onClick={() => navigate({ to: '/history' })}>
            All sessions
          </button>
        </div>
      </>
    );
  }

  const completedSets = session.results.filter((r) => r.completed).length;
  const plannedSets = session.results.length;

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Session detail</p>
          <h1>{session.workoutName}</h1>
          <p className="lede">
            {formatDate(session.finishedAt!)} · {completedSets}/{plannedSets} sets completed
          </p>
        </div>
        <div className="session-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => navigate({ to: '/history' })}
          >
            ← All sessions
          </button>
        </div>
      </section>
      <div className="session-stack">
        {session.plannedExercises.map((exercise) => {
          const exerciseResults = session.results.filter(
            (r) => r.exerciseId === exercise.exerciseId,
          );
          return (
            <section key={exercise.exerciseId} className="session-exercise">
              <div>
                <p className="eyebrow">
                  {exercise.sets} sets · {exercise.targetReps} target reps
                </p>
                <h2>{exercise.exerciseName}</h2>
              </div>
              <div className="set-list">
                {exerciseResults.map((result) => (
                  <div
                    key={result.setNumber}
                    className={`set-row${result.completed ? ' completed' : ''}`}
                  >
                    <span className="set-check">
                      <span>{result.completed ? '✓' : '○'} Set {result.setNumber}</span>
                    </span>
                    <span className="target">Target {exercise.targetReps} reps</span>
                    {result.actualWeightKg !== null && (
                      <span className="compact-field">{result.actualWeightKg} kg</span>
                    )}
                    {result.actualReps !== null && (
                      <span className="compact-field">{result.actualReps} reps</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
