import { render } from '@testing-library/react';
import { createRouter, RouterProvider, createRoute, redirect } from '@tanstack/react-router';
import { Route as rootRoute } from '../../src/routes/__root';
import { Route as plansRoute } from '../../src/routes/plans';
import { Route as sessionRoute } from '../../src/routes/session';
import { Route as historyRoute } from '../../src/routes/history.index';
import { Route as historyDetailRoute } from '../../src/routes/history.$sessionId';
import { PlannerProvider } from '../../src/context/PlannerContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import type { PlannerRepository } from '../../src/domain/storage';
import { createDefaultState } from '../../src/domain/storage';
import type { PlannerState } from '../../src/domain/types';

function buildRouter() {
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    beforeLoad: () => { throw redirect({ to: '/plans' }); },
  });
  const routeTree = rootRoute.addChildren([
    indexRoute,
    plansRoute,
    sessionRoute,
    historyRoute,
    historyDetailRoute,
  ]);
  return createRouter({ routeTree });
}

export function memoryRepo(state: PlannerState = createDefaultState()): PlannerRepository {
  let current = state;
  return {
    load: () => current,
    save: (s) => { current = s; },
    reset: () => { current = createDefaultState(); },
  };
}

export function renderAt(path: string, repo?: PlannerRepository) {
  window.history.replaceState({}, '', path);
  const router = buildRouter();
  const repository = repo ?? memoryRepo();
  return render(
    <PlannerProvider repository={repository}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </PlannerProvider>,
  );
}
