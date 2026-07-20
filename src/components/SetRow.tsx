import { useState } from 'react';
import type { SetResult, SessionExercise } from '../domain/types';

interface SetRowProps {
  result: SetResult;
  exercise: SessionExercise;
  onChange: (values: Partial<SetResult>) => void;
}

export function SetRow({ result, exercise, onChange }: SetRowProps) {
  const [pulse, setPulse] = useState(false);

  const targetReps = exercise.kind === 'resistance' ? exercise.targetReps : null;

  function handleChange(values: Partial<SetResult>) {
    if (values.completed !== undefined && values.completed !== result.completed) {
      setPulse(true);
      setTimeout(() => setPulse(false), 250);
    }
    onChange(values);
  }

  return (
    <div className={`set-row${pulse ? ' confirm-pulse' : ''}`}>
      <label className="set-check">
        <input
          type="checkbox"
          checked={result.completed}
          onChange={(e) => {
            handleChange({
              completed: e.target.checked,
              actualWeightKg: result.actualWeightKg,
              actualReps: result.actualReps,
            });
          }}
        />
        <span>Set {result.setNumber}</span>
      </label>
      {targetReps && <span className="target">Target {targetReps} reps</span>}
      {exercise.kind === 'timed' && <span className="target">Target {exercise.durationSecs}s</span>}
      {exercise.kind === 'resistance' && (
        <>
          <label className="compact-field">
            <span>kg</span>
            <input
              type="number"
              min={0}
              max={1000}
              step={0.5}
              inputMode="decimal"
              value={result.actualWeightKg ?? ''}
              onChange={(e) =>
                onChange({
                  completed: result.completed,
                  actualWeightKg: e.target.value === '' ? null : Number(e.target.value),
                  actualReps: result.actualReps,
                })
              }
            />
          </label>
          <label className="compact-field">
            <span>reps</span>
            <input
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              value={result.actualReps ?? ''}
              onChange={(e) =>
                onChange({
                  completed: result.completed,
                  actualWeightKg: result.actualWeightKg,
                  actualReps: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
        </>
      )}
    </div>
  );
}
