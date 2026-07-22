interface HistoryItemProps {
  item: {
    id: string;
    workoutName: string;
    finishedAt: string;
    durationMs: number | null;
    summary: { completedSets: number; plannedSets: number };
  };
  onClick: () => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
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

export function HistoryItem({ item, onClick }: HistoryItemProps) {
  return (
    <button type="button" className="history-item" onClick={onClick}>
      <span>
        <strong>{item.workoutName}</strong>
        <small>
          {formatDate(item.finishedAt)}
          {item.durationMs !== null && ` · ${formatDuration(item.durationMs)}`}
        </small>
      </span>
      <span className="completion-badge">
        {item.summary.completedSets}/{item.summary.plannedSets} sets
      </span>
      <span aria-hidden="true">→</span>
    </button>
  );
}
