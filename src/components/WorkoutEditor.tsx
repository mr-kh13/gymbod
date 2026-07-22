import type { CustomExercise, Exercise, WorkoutDraft, WorkoutExerciseDraft, ValidationError } from '../domain/types';
import { defaultDraftForExercise } from '../domain/workouts';
import { ExerciseRow } from './ExerciseRow';
import { ErrorSummary } from './ErrorSummary';

function errorFor(errors: ValidationError[], field: string): string {
  return errors.find((e) => e.field === field)?.message ?? '';
}

interface WorkoutEditorProps {
  draft: WorkoutDraft;
  errors: ValidationError[];
  catalogue: readonly Exercise[];
  customExercises?: CustomExercise[];
  onChange: (draft: WorkoutDraft) => void;
  onSave: (draft: WorkoutDraft) => void;
  onCancel: () => void;
}

export function WorkoutEditor({ draft, errors, catalogue, customExercises = [], onChange, onSave, onCancel }: WorkoutEditorProps) {
  const usedIds = new Set(draft.exercises.map((e) => e.exerciseId));
  const nameError = errorFor(errors, 'name');
  const exercisesError = errorFor(errors, 'exercises');

  function updateExercise(index: number, item: WorkoutExerciseDraft) {
    const exercises = draft.exercises.map((e, i) => (i === index ? item : e));
    onChange({ ...draft, exercises });
  }

  function moveExercise(index: number, direction: 1 | -1) {
    const exercises = [...draft.exercises];
    const target = index + direction;
    [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
    onChange({ ...draft, exercises });
  }

  function removeExercise(index: number) {
    onChange({ ...draft, exercises: draft.exercises.filter((_, i) => i !== index) });
  }

  function addExercise() {
    const exercise = catalogue.find((e) => !usedIds.has(e.id));
    if (!exercise) return;
    onChange({
      ...draft,
      exercises: [...draft.exercises, defaultDraftForExercise(exercise.id, catalogue)],
    });
  }

  return (
    <section className="editor panel" aria-labelledby="editor-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Workout builder</p>
          <h2 id="editor-title">{draft.id ? 'Edit' : 'Create'} workout</h2>
        </div>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>

      <ErrorSummary errors={errors} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
        noValidate
      >
        <label className="field">
          <span>Workout name</span>
          <input
            name="name"
            maxLength={50}
            value={draft.name}
            placeholder="e.g. Push day"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? 'error-name' : undefined}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
          />
          {nameError && (
            <small className="field-error" id="error-name"></small>
          )}
        </label>

        <div className="exercise-list">
          {draft.exercises.map((item, index) => (
            <ExerciseRow
              key={index}
              item={item}
              index={index}
              totalCount={draft.exercises.length}
              usedIds={usedIds}
              errors={errors}
              catalogue={catalogue}
              customExercises={customExercises}
              onChange={updateExercise}
              onMoveUp={(i) => moveExercise(i, -1)}
              onMoveDown={(i) => moveExercise(i, 1)}
              onRemove={removeExercise}
            />
          ))}
        </div>

        {exercisesError && (
          <p className="field-error">{exercisesError}</p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="secondary"
            onClick={addExercise}
            disabled={draft.exercises.length >= catalogue.length}
          >
            + Add exercise
          </button>
          <button type="submit">Save workout</button>
        </div>
      </form>
    </section>
  );
}
