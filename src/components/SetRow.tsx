import { useState } from 'react';
import type { SetResult } from '../domain/types';

interface SetRowProps {
  result: SetResult;
  targetReps: number;
  onChange: (values: Partial<SetResult>) => void;
}

export function SetRow({ result, targetReps, onChange }: SetRowProps) {
  const [pulse, setPulse] = useState(false);

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
      <span className="target">Target {targetReps} reps</span>
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
    </div>
  );
}
