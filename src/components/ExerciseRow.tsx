import { EXERCISES } from '../domain/catalog';
import { defaultDraftForExercise } from '../domain/workouts';
import type { WorkoutExerciseDraft, ValidationError } from '../domain/types';

function errorFor(errors: ValidationError[], field: string): string {
  return errors.find((e) => e.field === field)?.message ?? '';
}

interface ExerciseRowProps {
  item: WorkoutExerciseDraft;
  index: number;
  totalCount: number;
  usedIds: Set<string>;
  errors: ValidationError[];
  onChange: (index: number, item: WorkoutExerciseDraft) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
}

export function ExerciseRow({
  item,
  index,
  totalCount,
  usedIds,
  errors,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ExerciseRowProps) {
  const exerciseError = errorFor(errors, `exercises.${index}.exerciseId`);
  const setsError = errorFor(errors, `exercises.${index}.sets`);
  const errId = (f: string) => `error-exercises-${index}-${f}`;

  const handleExerciseChange = (newExerciseId: string) => {
    const newExercise = EXERCISES.find((e) => e.id === newExerciseId);
    const oldExercise = EXERCISES.find((e) => e.id === item.exerciseId);

    if (newExercise?.measurement !== oldExercise?.measurement) {
      onChange(index, defaultDraftForExercise(newExerciseId, EXERCISES));
    } else {
      onChange(index, { ...item, exerciseId: newExerciseId });
    }
  };

  return (
    <fieldset className="exercise-row" data-index={index}>
      <legend className="sr-only">Exercise {index + 1}</legend>

      <label className="field exercise-field">
        <span>Exercise</span>
        <select
          value={item.exerciseId}
          aria-invalid={exerciseError ? true : undefined}
          aria-describedby={exerciseError ? errId('exerciseId') : undefined}
          onChange={(e) => handleExerciseChange(e.target.value)}
        >
          {EXERCISES.map((ex) => (
            <option
              key={ex.id}
              value={ex.id}
              disabled={usedIds.has(ex.id) && ex.id !== item.exerciseId}
            >
              {ex.name} · {ex.category}
            </option>
          ))}
        </select>
        {exerciseError && (
          <small className="field-error" id={errId('exerciseId')}>{exerciseError}</small>
        )}
      </label>

      <label className="field">
        <span>Sets</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          value={item.sets}
          aria-invalid={setsError ? true : undefined}
          aria-describedby={setsError ? errId('sets') : undefined}
          onChange={(e) => onChange(index, { ...item, sets: e.target.value })}
        />
        {setsError && (
          <small className="field-error" id={errId('sets')}>{setsError}</small>
        )}
      </label>

      {item.kind === 'resistance' && (
        <label className="field">
          <span>Target reps</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={item.targetReps}
            aria-invalid={!!errorFor(errors, `exercises.${index}.targetReps`)}
            aria-describedby={errorFor(errors, `exercises.${index}.targetReps`) ? errId('targetReps') : undefined}
            onChange={(e) => onChange(index, { ...item, targetReps: e.target.value })}
          />
          {errorFor(errors, `exercises.${index}.targetReps`) && (
            <small className="field-error" id={errId('targetReps')}>{errorFor(errors, `exercises.${index}.targetReps`)}</small>
          )}
        </label>
      )}

      {item.kind === 'timed' && (
        <label className="field">
          <span>Duration (s)</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={3600}
            value={item.durationSecs}
            aria-invalid={!!errorFor(errors, `exercises.${index}.durationSecs`)}
            aria-describedby={errorFor(errors, `exercises.${index}.durationSecs`) ? errId('durationSecs') : undefined}
            onChange={(e) => onChange(index, { ...item, durationSecs: e.target.value })}
            disabled
          />
          {errorFor(errors, `exercises.${index}.durationSecs`) && (
            <small className="field-error" id={errId('durationSecs')}>{errorFor(errors, `exercises.${index}.durationSecs`)}</small>
          )}
        </label>
      )}

      <div className="row-actions" aria-label={`Reorder exercise ${index + 1}`}>
        <button
          type="button"
          className="icon-button"
          disabled={index === 0}
          aria-label={`Move exercise ${index + 1} up`}
          onClick={() => onMoveUp(index)}
        >↑</button>
        <button
          type="button"
          className="icon-button"
          disabled={index === totalCount - 1}
          aria-label={`Move exercise ${index + 1} down`}
          onClick={() => onMoveDown(index)}
        >↓</button>
        <button
          type="button"
          className="text-button danger-text"
          onClick={() => onRemove(index)}
        >Remove</button>
      </div>
    </fieldset>
  );
}
