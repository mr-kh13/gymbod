# Research: App Modernisation

## Summary

All decisions are resolvable from the existing codebase, the user's explicit technology choices,
and current ecosystem standards. The eight decisions below are sequenced so that each downstream
choice can reference the upstream one it depends on.

---

## Decision 1: Build tool — Vite 6

**Decision**: Use Vite 6 as the build tool for both the development server and the production
bundle.

**Rationale**: Vite is the canonical build tool for React + TypeScript projects in 2026. It is
the officially recommended setup in both the React and TanStack Router documentation. Vitest is
implemented as a Vite plugin and shares the same transform pipeline, meaning TypeScript compilation
and module resolution are configured once and respected by both the application and the test suite.
vite-plugin-pwa, which is needed for the service worker, also integrates at the Vite plugin level.

**Alternatives considered**:
- `webpack 5` — rejected: heavier configuration, no native Vitest integration, no first-party
  support from TanStack.
- `esbuild` standalone — rejected: lacks a test runner and would require a second tool (Vitest
  still needs a Vite config to run; running esbuild alone adds no value).
- `parcel 2` — rejected: does not integrate with Vitest or vite-plugin-pwa.

---

## Decision 2: UI framework — React 19

**Decision**: Use React 19 as the UI framework.

**Rationale**: TanStack Router v1 is React-first and was explicitly requested. React 19 is the
current stable release; it introduces the `use()` hook and improved support for `startTransition`,
which pairs cleanly with the CSS View Transitions API (Decision 8). No React compiler (Babel
plugin) is needed for this project's scale.

**Alternatives considered**:
- React 18 — rejected: React 19 is stable and current; no reason to target an older minor.
- Solid.js — rejected: TanStack Router has a Solid adapter but it is less mature and was not
  requested.
- Vue 3 — rejected: TanStack Router's Vue adapter is experimental; not requested.

---

## Decision 3: Routing — TanStack Router v1, code-based

**Decision**: Use TanStack Router v1 with code-based route definitions (not the file-based
`@tanstack/router-vite-plugin` approach).

**Rationale**: TanStack Router was explicitly requested. With only four routes
(`/plans`, `/session`, `/history`, `/history/$sessionId`), code-based route definitions are
simpler than file-based routing: no additional Vite plugin is needed, no generated route-tree file
must be committed, and the entire router configuration fits in `src/main.tsx`. The `$sessionId`
route param becomes fully typed automatically. Setting `viewTransition: true` on the router enables
the CSS View Transitions API for all navigations without any additional wrapping.

**Alternatives considered**:
- File-based routing (`@tanstack/router-vite-plugin`) — rejected: adds a second Vite plugin and a
  generated `routeTree.gen.ts` file that must be regenerated on every structural change; the
  added tooling is not justified for four routes.
- React Router 6 — rejected: not requested; lacks built-in viewTransition support.
- Hash-based vanilla routing — rejected: incompatible with TanStack Router; the existing
  `location.hash` approach is removed as part of the framework migration.

---

## Decision 4: State management — React Context + useReducer

**Decision**: Manage planner state with a single React Context (`PlannerContext`) backed by a
`useReducer` hook and wired to the existing `PlannerRepository` for persistence.

**Rationale**: The existing application already uses a flat, immutable state object
(`{ schemaVersion, workouts, activeSession, history }`) updated by pure domain functions. This
maps directly to a `useReducer` pattern where each domain function becomes a dispatch action.
No external state manager is needed; the constitution requires the smallest architecture that
satisfies the specification.

**Action types**: `CREATE_WORKOUT`, `UPDATE_WORKOUT`, `DELETE_WORKOUT`, `DUPLICATE_WORKOUT`,
`START_SESSION`, `RECORD_SET`, `FINISH_SESSION`, `DISCARD_SESSION`, `RESET_DATA`.

**Alternatives considered**:
- Zustand — rejected: adds a dependency for a problem that useReducer solves; the flat state shape
  does not require Zustand's slice-based model.
- Redux Toolkit — rejected: adds multiple packages and boilerplate; unjustified for a single-user
  local app with fewer than ten action types.
- Component-local state — rejected: planner state is shared across three routes; lifting it to a
  context or global store is unavoidable.

---

## Decision 5: Testing — Vitest 3 + jsdom + @testing-library/react

**Decision**: Replace `node --test` with Vitest 3, using the jsdom environment for all tests.
Add `@testing-library/react` for component-level behavioural tests.

**Rationale**: Vitest was explicitly requested. jsdom gives a realistic DOM without launching a
browser, which keeps the test suite fast. The existing `node:test` / `node:assert` test cases
migrate to Vitest with minimal changes (the API is nearly identical). `@testing-library/react`
tests components through user-visible interactions (clicking, reading text, asserting on ARIA
roles), which is the correct abstraction for the spec's acceptance scenarios.

**Vitest config**: `environment: 'jsdom'`, `globals: false` (explicit imports), `coverage` via
`@vitest/coverage-v8`.

**Alternatives considered**:
- Jest — rejected: Vitest was requested; Jest requires additional Babel config for ESM modules
  and is slower in a Vite project.
- Playwright — rejected: too heavy for unit and component tests; end-to-end browser tests are
  not required by the spec's success criteria.
- `node --test` with `happy-dom` — rejected: would keep the `node --test` approach that the user
  explicitly wants to replace.

---

## Decision 6: Dark mode — CSS custom property overrides on `[data-theme]`

**Decision**: Add a `[data-theme="dark"]` attribute to `<html>`. Define dark values for every
existing CSS custom property inside a `[data-theme="dark"]` selector block. Use
`@media (prefers-color-scheme: dark)` as the system-default fallback (applied when no
`data-theme` attribute is set). Store the user's manual override as a `ThemePreference`
(`"light"` | `"dark"` | `"system"`) in localStorage under a separate key
(`form.planner.theme.v1`).

**Preventing flash**: Read the stored preference and apply `data-theme` in a synchronous
`<script>` tag in `<head>` before the React bundle loads, eliminating FOUC.

**Rationale**: The existing CSS already uses CSS custom properties for every colour and shadow.
Adding dark overrides requires only a new selector block in `styles.css` — no CSS framework or
additional tooling. React's `ThemeContext` exposes the current preference and a toggle function;
the root route's layout component applies `data-theme` to `document.documentElement`. Storing
the preference separately from planner data keeps the storage schema clean.

**Alternatives considered**:
- Tailwind `dark:` class — rejected: Tailwind is not in the project; adding it for dark mode
  alone introduces a significant dependency.
- CSS-in-JS theme object — rejected: adds a runtime dependency (styled-components, emotion) and
  complicates the existing plain-CSS approach.
- JavaScript-only colour switching — rejected: cannot produce smooth CSS transitions; harder to
  maintain WCAG contrast verification.

---

## Decision 7: PWA — vite-plugin-pwa with Workbox GenerateSW

**Decision**: Use `vite-plugin-pwa` configured with Workbox's `generateSW` strategy. Precache
all static assets. The manifest is defined in `vite.config.ts` and merged into `index.html` and
`public/manifest.json` at build time.

**Cache strategy**: `CacheFirst` for all precached assets (the entire app bundle). This satisfies
FR-005 (offline capability) and SC-003 (app loads in under 2 seconds without network).

**Icons**: Two PNG icons at 192 × 192 and 512 × 512, both maskable. SVG source → exported to
PNG at build time (or provided as static assets).

**Rationale**: Vite hashes asset filenames (e.g., `main-Cm3k9A1p.js`). A manual service worker
would need to know these names in advance, which is impossible without reading the Vite manifest
post-build. `vite-plugin-pwa` reads that manifest automatically and injects the correct precache
manifest into the generated service worker. This is the de-facto standard pattern for Vite PWAs.

**Alternatives considered**:
- Manual `public/sw.js` with Cache API — rejected: hashed filenames make static caching
  unreliable; the SW would need to be regenerated after every build.
- `workbox-build` as a separate post-build step — rejected: adds a standalone Workbox CLI
  invocation to the build pipeline; `vite-plugin-pwa` does this within Vite's existing hooks.

---

## Decision 8: View transitions — CSS View Transitions API + TanStack Router `viewTransition`

**Decision**: Set `viewTransition: true` on the TanStack Router instance. Define
`@keyframes` for route entry/exit in `styles.css` attached to the `::view-transition-*`
pseudo-elements. Add a `@keyframes` pulse animation for set-completion and workout-save
confirmations, applied via a short-lived CSS class added by the React component after the state
update.

**Reduced motion**: A single `@media (prefers-reduced-motion: reduce)` block sets all view
transition animations to `animation-duration: 0.01ms` and suppresses the pulse keyframe. The
transition still fires (so TanStack Router does not need special-casing) but is imperceptible.

**Browser support**: Chrome 111+, Firefox 130+. Safari/iOS 18+. Older browsers treat the
`@starting-style` and `::view-transition-*` rules as unknown and skip them; navigation is
instant, which is acceptable graceful degradation.

**Rationale**: TanStack Router's built-in `viewTransition` option calls
`document.startViewTransition()` around each navigation, removing the need to wrap every
`<Link>` click manually. The animation itself is pure CSS, so no JavaScript animation library
is needed.

**Alternatives considered**:
- Framer Motion — rejected: adds a sizeable runtime dependency (≈34 kB gzipped) for transitions
  the browser can produce natively.
- React Transition Group — rejected: requires wrapping every route component in a `<Transition>`;
  TanStack Router's viewTransition option is simpler and produces the same result.
- CSS class-based fade (no View Transitions API) — rejected: requires manual coordination between
  the router and class application; produces less smooth cross-fade because both old and new
  content coexist only briefly.
