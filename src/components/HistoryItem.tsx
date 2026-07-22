interface HistoryItemProps {
  item: {
    id: string;
    workoutName: string;
    finishedAt: string;
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

export function HistoryItem({ item, onClick }: HistoryItemProps) {
  return (
    <button type="button" className="history-item" onClick={onClick}>
      <span>
        <strong>{item.workoutName}</strong>
        <small>{formatDate(item.finishedAt)}</small>
      </span>
      <span className="completion-badge">
        {item.summary.completedSets}/{item.summary.plannedSets} sets
      </span>
      <span aria-hidden="true">→</span>
    </button>
  );
}
