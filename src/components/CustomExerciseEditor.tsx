import { useState } from 'react';
import type {
  CustomExercise,
  CustomExerciseDraft,
  ExerciseMeasurement,
  PlannerAction,
  ValidationError,
} from '../domain/types';
import { activeCatalogue } from '../domain/catalog';
import { validateCustomExercise } from '../domain/customExercises';
import { ErrorSummary } from './ErrorSummary';

interface CustomExerciseEditorProps {
  customExercises: CustomExercise[];
  onAction: React.Dispatch<PlannerAction>;
}

function errorFor(errors: ValidationError[], field: string): string {
  return errors.find((e) => e.field === field)?.message ?? '';
}

export function CustomExerciseEditor({ customExercises, onAction }: CustomExerciseEditorProps) {
  const [name, setName] = useState('');
  const [measurement, setMeasurement] = useState<ExerciseMeasurement>('resistance');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameErrors, setRenameErrors] = useState<ValidationError[]>([]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const draft: CustomExerciseDraft = { name, measurement };
    const catalogue = activeCatalogue(customExercises);
    const errs = validateCustomExercise(draft, catalogue, customExercises);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    onAction({ type: 'CREATE_CUSTOM_EXERCISE', draft });
    setName('');
    setErrors([]);
  }

  function startRename(exercise: CustomExercise) {
    setRenamingId(exercise.id);
    setRenameValue(exercise.name);
    setRenameErrors([]);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameErrors([]);
  }

  function commitRename(exercise: CustomExercise) {
    const catalogue = activeCatalogue(customExercises);
    const errs = validateCustomExercise(
      { name: renameValue, measurement: exercise.measurement },
      catalogue,
      customExercises,
      exercise.id,
    );
    if (errs.length) {
      setRenameErrors(errs);
      return;
    }
    onAction({ type: 'RENAME_CUSTOM_EXERCISE', id: exercise.id, name: renameValue });
    setRenamingId(null);
    setRenameErrors([]);
  }

  const nameError = errorFor(errors, 'name');

  return (
    <section aria-labelledby="custom-exercise-editor-title">
      <h3 id="custom-exercise-editor-title">Custom exercises</h3>

      <form onSubmit={handleCreate} noValidate>
        <ErrorSummary errors={errors} />

        <label className="field">
          <span>Exercise name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? 'error-custom-name' : undefined}
          />
          {nameError && (
            <small className="field-error" id="error-custom-name"></small>
          )}
        </label>

        <fieldset>
          <legend>Measurement type</legend>
          <label>
            <input
              type="radio"
              name="measurement"
              value="resistance"
              checked={measurement === 'resistance'}
              onChange={() => setMeasurement('resistance')}
            />
            {' '}Resistance
          </label>
          <label>
            <input
              type="radio"
              name="measurement"
              value="timed"
              checked={measurement === 'timed'}
              onChange={() => setMeasurement('timed')}
            />
            {' '}Timed
          </label>
        </fieldset>

        <button type="submit">Add exercise</button>
      </form>

      {customExercises.length === 0 ? (
        <p>No custom exercises yet.</p>
      ) : (
        <ul>
          {customExercises.map((exercise) => (
            <li key={exercise.id}>
              {renamingId === exercise.id ? (
                <span>
                  <label>
                    <span className="visually-hidden">New name</span>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                    />
                  </label>
                  {renameErrors.map((err, i) => (
                    <small key={i} className="field-error">{err.message}</small>
                  ))}
                  <button type="button" onClick={() => commitRename(exercise)}>Save</button>
                  <button type="button" onClick={cancelRename}>Cancel</button>
                </span>
              ) : (
                <span>
                  <span>{exercise.name}</span>
                  {exercise.status === 'retired' && <span> [retired]</span>}
                  {exercise.status === 'active' && (
                    <>
                      <button
                        type="button"
                        onClick={() => startRename(exercise)}
                        aria-label={`Rename ${exercise.name}`}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction({ type: 'RETIRE_CUSTOM_EXERCISE', id: exercise.id })}
                        aria-label={`Retire ${exercise.name}`}
                      >
                        Retire
                      </button>
                    </>
                  )}
                  {exercise.status === 'retired' && (
                    <button
                      type="button"
                      onClick={() => onAction({ type: 'REACTIVATE_CUSTOM_EXERCISE', id: exercise.id })}
                      aria-label={`Reactivate ${exercise.name}`}
                    >
                      Reactivate
                    </button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

