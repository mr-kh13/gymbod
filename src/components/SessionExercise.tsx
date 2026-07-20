import type { SessionExercise as SessionExerciseType, SetResult } from '../domain/types';
import { SetRow } from './SetRow';

interface SessionExerciseProps {
  exercise: SessionExerciseType;
  results: SetResult[];
  onRecordSet: (exerciseId: string, setNumber: number, values: Partial<SetResult>) => void;
}

export function SessionExercise({ exercise, results, onRecordSet }: SessionExerciseProps) {
  return (
    <section className="session-exercise">
      <div>
        <p className="eyebrow">
          {exercise.sets} sets · {exercise.targetReps} target reps
        </p>
        <h2>{exercise.exerciseName}</h2>
      </div>
      <div className="set-list">
        {results.map((result) => (
          <SetRow
            key={result.setNumber}
            result={result}
            targetReps={exercise.targetReps}
            onChange={(values) => onRecordSet(exercise.exerciseId, result.setNumber, values)}
          />
        ))}
      </div>
    </section>
  );
}
