import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { usePlanner } from '../context/PlannerContext';
import { sessionDetail, sessionSummary, sessionDurationMs } from '../domain/sessions';

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

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${totalMinutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
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

  const { completedSets, plannedSets } = sessionSummary(session);
  const durationMs = sessionDurationMs(session);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Session detail</p>
          <h1>{session.workoutName}</h1>
          <p className="lede">
            {formatDate(session.finishedAt!)} · {completedSets}/{plannedSets} sets completed
          </p>
          <p className="session-meta">
            Started {formatDate(session.startedAt)}
            {durationMs !== null && <> · <time>{formatDuration(durationMs)}</time></>}
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
                  {exercise.sets} sets · {exercise.kind === 'resistance' ? `${exercise.targetReps} reps${exercise.targetWeightKg ? ` @ ${exercise.targetWeightKg} kg` : ''}` : `${exercise.durationSecs}s`}
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
                    {exercise.kind === 'resistance' && (
                      <>
                        <span className="target">Target {exercise.targetReps} reps</span>
                        {result.actualWeightKg !== null && (
                          <span className="compact-field">{result.actualWeightKg} kg</span>
                        )}
                        {result.actualReps !== null && (
                          <span className="compact-field">{result.actualReps} reps</span>
                        )}
                      </>
                    )}
                    {exercise.kind === 'timed' && (
                      <span className="target">{exercise.durationSecs}s</span>
                    )}
                  </div>
                ))}
              </div>
              {(exercise.restBetweenSetsSecs || exercise.restBeforeNextSecs) && (
                <div className="rest-info">
                  {exercise.restBetweenSetsSecs && (
                    <span>Rest between sets: {exercise.restBetweenSetsSecs} s</span>
                  )}
                  {exercise.restBeforeNextSecs && (
                    <span>Rest before next: {exercise.restBeforeNextSecs} s</span>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
