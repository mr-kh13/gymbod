import { useState } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { usePlanner } from '../context/PlannerContext';
import { WorkoutCard } from '../components/WorkoutCard';
import { WorkoutEditor } from '../components/WorkoutEditor';
import type { WorkoutDraft, ValidationError } from '../domain/types';
import { validateWorkout, defaultDraftForExercise, workoutToDraft } from '../domain/workouts';
import { EXERCISES } from '../domain/catalog';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plans',
  component: PlansRoute,
});

function newDraft(): WorkoutDraft {
  return { id: null, name: '', exercises: [defaultDraftForExercise(EXERCISES[0].id, EXERCISES)] };
}

function PlansRoute() {
  const { state, dispatch } = usePlanner();
  const navigate = useNavigate();
  const [editor, setEditor] = useState<WorkoutDraft | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  function handleSave(draft: WorkoutDraft) {
    const errs = validateWorkout(draft);
    if (errs.length) { setErrors(errs); return; }
    if (draft.id) {
      dispatch({ type: 'UPDATE_WORKOUT', id: draft.id, draft });
    } else {
      dispatch({ type: 'CREATE_WORKOUT', draft });
    }
    setEditor(null);
    setErrors([]);
  }

  function handleStart(workoutId: string) {
    try {
      dispatch({ type: 'START_SESSION', workoutId });
      navigate({ to: '/session' });
    } catch (e) {
      if (state.activeSession) navigate({ to: '/session' });
    }
  }

  function handleDelete(workoutId: string) {
    try {
      dispatch({ type: 'DELETE_WORKOUT', id: workoutId });
    } catch (e) {
      // error handled by domain
    }
  }

  function handleDuplicate(workoutId: string) {
    try {
      dispatch({ type: 'DUPLICATE_WORKOUT', id: workoutId });
      const copied = state.workouts[state.workouts.length - 1];
      if (copied) setRenamingId(copied.id);
    } catch (e) { /* ignore */ }
  }

  if (!state.workouts.length && !editor) {
    return (
      <>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Local-first training</p>
            <h1>Plans that get out of your way.</h1>
            <p className="lede">
              Build a repeatable session, record the work, and keep momentum on this device.
            </p>
          </div>
        </section>
        <div className="empty-state panel">
          <span className="empty-icon" aria-hidden="true">↗</span>
          <h2>Build your first session</h2>
          <p>Create a reusable workout once, then take it to the gym without an account or connection.</p>
          <button type="button" onClick={() => setEditor(newDraft())}>Create workout</button>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Local-first training</p>
          <h1>Plans that get out of your way.</h1>
          <p className="lede">
            Build a repeatable session, record the work, and keep momentum on this device.
          </p>
        </div>
        {!editor && (
          <button type="button" onClick={() => setEditor(newDraft())}>+ New workout</button>
        )}
      </section>

      {editor ? (
        <WorkoutEditor
          draft={editor}
          errors={errors}
          onChange={setEditor}
          onSave={handleSave}
          onCancel={() => { setEditor(null); setErrors([]); }}
        />
      ) : (
        <div className="card-grid">
          {state.workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              isRenaming={workout.id === renamingId}
              onStart={() => handleStart(workout.id)}
              onEdit={() => {
                setEditor(workoutToDraft(workout));
                setErrors([]);
              }}
              onDelete={() => handleDelete(workout.id)}
              onDuplicate={() => handleDuplicate(workout.id)}
              onConfirmRename={(name) => {
                dispatch({ type: 'UPDATE_WORKOUT', id: workout.id, draft: workoutToDraft({ ...workout, name }) });
                setRenamingId(null);
              }}
              onCancelRename={() => setRenamingId(null)}
            />
          ))}
        </div>
      )}
    </>
  );
}
