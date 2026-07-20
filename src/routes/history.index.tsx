import { createRoute, useNavigate, Link } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { usePlanner } from '../context/PlannerContext';
import { HistoryItem } from '../components/HistoryItem';
import { historyItems } from '../domain/sessions';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryIndexRoute,
});

function HistoryIndexRoute() {
  const { state } = usePlanner();
  const navigate = useNavigate();
  const items = historyItems(state);

  if (!items.length) {
    return (
      <>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Training history</p>
            <h1>Nothing logged yet</h1>
            <p className="lede">Finish a session and it will appear here.</p>
          </div>
        </section>
        <div className="empty-state panel">
          <Link to="/plans" className="button">View plans</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Your history</p>
          <h1>Recent work.</h1>
          <p className="lede">
            Your latest {items.length} completed {items.length === 1 ? 'session' : 'sessions'},
            stored only on this device.
          </p>
        </div>
      </section>
      <div className="history-list">
        {items.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            onClick={() => navigate({ to: '/history/$sessionId', params: { sessionId: item.id } })}
          />
        ))}
      </div>
    </>
  );
}
