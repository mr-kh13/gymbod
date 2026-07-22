import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { PlannerProvider } from "./context/PlannerContext";
import { ThemeProvider } from "./context/ThemeContext";
import {
  createRouter,
  RouterProvider,
  createRoute,
  redirect,
} from "@tanstack/react-router";
import { Route as rootRoute } from "./routes/__root";
import { Route as plansRoute } from "./routes/plans";
import { Route as sessionRoute } from "./routes/session";
import { Route as historyRoute } from "./routes/history.index";
import { Route as historyDetailRoute } from "./routes/history.$sessionId";

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/plans" });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  plansRoute,
  sessionRoute,
  historyRoute,
  historyDetailRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultViewTransition: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlannerProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </PlannerProvider>
  </StrictMode>,
);
