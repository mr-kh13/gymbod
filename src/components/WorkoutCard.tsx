import { useRef, useState } from 'react';
import type { Workout } from '../domain/types';
import { workoutSummary, exerciseName } from '../domain/workouts';

interface WorkoutCardProps {
  workout: Workout;
  isRenaming: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onConfirmRename: (name: string) => void;
  onCancelRename: () => void;
}

export function WorkoutCard({
  workout,
  isRenaming,
  onStart,
  onEdit,
  onDelete,
  onDuplicate,
  onConfirmRename,
  onCancelRename,
}: WorkoutCardProps) {
  const summary = workoutSummary(workout);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pulse, setPulse] = useState(false);

  function triggerPulse() {
    setPulse(true);
    setTimeout(() => setPulse(false), 250);
  }

  if (isRenaming) {
    return (
      <article className={`workout-card${pulse ? ' confirm-pulse' : ''}`}>
        <div>
          <p className="eyebrow">
            {summary.exerciseCount} exercises · {summary.totalSets} sets
          </p>
          <input
            ref={inputRef}
            type="text"
            className="rename-input"
            defaultValue={workout.name}
            maxLength={50}
            aria-label="Workout name"
            autoFocus
          />
        </div>
        <div className="card-actions">
          <button
            type="button"
            onClick={() => {
              triggerPulse();
              onConfirmRename(inputRef.current?.value ?? workout.name);
            }}
          >
            Save name
          </button>
          <button type="button" className="secondary" onClick={onCancelRename}>
            Keep default
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className={`workout-card${pulse ? ' confirm-pulse' : ''}`}>
      <div>
        <p className="eyebrow">
          {summary.exerciseCount} exercises · {summary.totalSets} sets
        </p>
        <h2>{workout.name}</h2>
        <p>{workout.exercises.map((e) => exerciseName(e.exerciseId)).join(' · ')}</p>
      </div>
      <div className="card-actions">
        <button type="button" onClick={onStart}>Start</button>
        <button type="button" className="secondary" onClick={onEdit}>Edit</button>
        <button
          type="button"
          className="text-button danger-text"
          onClick={() => {
            if (window.confirm('Delete this workout?')) onDelete();
          }}
        >
          Delete
        </button>
        <button
          type="button"
          className="secondary"
          aria-label={`Duplicate ${workout.name}`}
          onClick={onDuplicate}
        >
          Duplicate
        </button>
      </div>
    </article>
  );
}
