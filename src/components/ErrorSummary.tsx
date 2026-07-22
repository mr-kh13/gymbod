import { useEffect, useRef } from 'react';
import type { ValidationError } from '../domain/types';

export function ErrorSummary({ errors }: { errors: ValidationError[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errors.length > 0) ref.current?.focus();
  }, [errors]);
  if (!errors.length) return null;
  return (
    <div className="error-summary" role="alert" tabIndex={-1} ref={ref}>
      <strong>
        Review {errors.length} {errors.length === 1 ? 'problem' : 'problems'}
      </strong>
      <ul>
        {errors.map((e, i) => (
          <li key={i}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}
