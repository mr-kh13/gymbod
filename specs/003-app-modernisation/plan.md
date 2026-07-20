# Implementation Plan: App Modernisation

**Branch**: `main` | **Date**: 2026-07-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-app-modernisation/spec.md`

**User constraint**: Migrate the tech stack to TypeScript, TanStack Router, and Vitest as part of
this modernisation. This supersedes the spec assumption of "no new runtime dependencies."

## Summary

Modernise the Form gym planner on two axes simultaneously. First, migrate the tech stack: replace
the vanilla JS + `node --test` setup with TypeScript 5, React 19, TanStack Router v1, Vite 6, and
Vitest 3. Second, layer the three modernisation features onto the migrated codebase: system-aware
dark mode (CSS custom property overrides controlled by a React ThemeContext), PWA installability
(vite-plugin-pwa with a Workbox cache-first strategy), and smooth view transitions (CSS View
Transitions API wired through TanStack Router's built-in `viewTransition` option plus CSS
`@keyframes` for set-completion micro-animations).

The domain logic (workouts, sessions, storage, catalogue) is a TypeScript port of the existing
JavaScript modules — no business rules change. The rendering layer is a full rewrite from
string-template HTML injection to React components. All existing test coverage migrates from
`node:test` to Vitest and is complemented with `@testing-library/react` behavioural tests for each
user story.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22+ for build and tests; ES2022 as the browser
compile target

**Primary Dependencies**: React 19, @tanstack/react-router 1.x, Vite 6, vite-plugin-pwa,
@testing-library/react 16 (dev), Vitest 3 (dev)

**Storage**: Browser localStorage behind the existing versioned `PlannerRepository` adapter;
schema version remains 1

**Testing**: Vitest 3 with jsdom environment + @testing-library/react for component behaviour

**Target Platform**: Modern evergreen browsers (Chromium, Firefox); Safari/iOS as best-effort
PWA target; responsive from 375 px to 1440 px

**Project Type**: Static single-page web application (SPA) with PWA capability

**Performance Goals**: First interactive under 1 second on repeat load (service worker cache);
view transitions complete in ≤ 250 ms; offline-ready after the first visit

**Constraints**: No backend, no authentication, no external data calls; local-first; WCAG 2.2 AA
in both light and dark themes; offline-capable; no flash of wrong theme on load

**Scale/Scope**: Single local user; up to 20 workouts, 1 active session, 20 history entries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- **User-Value Slices**: PASS — the three spec stories (dark mode, PWA, transitions) remain
  independently testable. The tech stack migration is a horizontal prerequisite platform task,
  not a user story; it does not gate any individual story from being demonstrated independently.

- **Local-First Privacy**: PASS — the service worker caches all static assets for offline use;
  no new network endpoints are introduced; all planner data remains in localStorage; the theme
  preference is stored locally alongside planner data.

- **Accessible by Default**: PASS — React does not reduce accessibility; all ARIA attributes,
  focus management, skip links, and keyboard handlers are migrated directly into React components;
  the theme toggle is a `<button>` in the persistent header; reduced-motion is handled by
  `@media (prefers-reduced-motion: reduce)` in CSS and the View Transitions API is suppressed
  accordingly.

- **Test-First Delivery**: PASS — Vitest replaces `node --test` and gains `@testing-library/react`
  for component-level behavioural tests written before implementation; domain unit tests are
  migrated and must pass before any rendering migration begins; new tests for dark mode toggle,
  offline load, and reduced-motion are written before the feature code.

- **Simplicity and Traceability**: CONDITIONAL PASS with justified exceptions — React, Vite,
  TanStack Router, and vite-plugin-pwa exceed the minimum needed for a 3-route app in isolation.
  All exceptions are justified in the Complexity Tracking section. Each is directly required by an
  explicit user technology choice or is the standard tool for that layer given the chosen stack.

- **Post-design re-check**: PASS — data model and UI contract introduce no further exceptions;
  the addition of `ThemePreference` to localStorage is backward-compatible with schema version 1.

## Project Structure

### Documentation (this feature)

```text
specs/003-app-modernisation/
├── plan.md                  ← this file
├── research.md              ← Phase 0 output
├── data-model.md            ← Phase 1 output
├── quickstart.md            ← Phase 1 output
├── contracts/
│   └── ui-contract.md       ← Phase 1 output
└── tasks.md                 ← Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── routes/
│   ├── __root.tsx              ← root layout: header, nav, Outlet, ThemeProvider
│   ├── plans.tsx               ← Plans view (workout list + editor)
│   ├── session.tsx             ← Active session + post-session summary
│   ├── history.index.tsx       ← History list
│   └── history.$sessionId.tsx  ← Session detail (read-only)
├── components/
│   ├── WorkoutCard.tsx         ← Card with Start / Edit / Delete / Duplicate actions
│   ├── WorkoutEditor.tsx       ← Create / edit workout form
│   ├── ExerciseRow.tsx         ← Single exercise row inside editor
│   ├── SessionExercise.tsx     ← Exercise block in active session
│   ├── SetRow.tsx              ← Individual set row (checkbox + weight + reps)
│   ├── HistoryItem.tsx         ← Button row in history list
│   └── ErrorSummary.tsx        ← Accessible error banner
├── context/
│   ├── PlannerContext.tsx      ← PlannerState + dispatch + repository wiring
│   └── ThemeContext.tsx        ← Theme preference + toggle
├── domain/
│   ├── types.ts                ← All TypeScript interfaces (see data-model.md)
│   ├── catalog.ts              ← Exercise catalogue (ported from catalog.js)
│   ├── workouts.ts             ← createWorkout, updateWorkout, deleteWorkout,
│   │                              duplicateWorkout, validateWorkout, workoutSummary
│   ├── sessions.ts             ← startSession, recordSet, finishSession,
│   │                              discardSession, sessionSummary, historyItems,
│   │                              sessionDetail
│   └── storage.ts              ← PlannerRepository, StorageCorruptionError,
│                                  createDefaultState (ported from storage.js)
├── styles.css                  ← existing CSS + dark-mode token overrides
│                                  + view-transition keyframes + reduced-motion block
└── main.tsx                    ← React root, createRouter + RouterProvider

tests/
├── domain/
│   ├── workouts.test.ts        ← ported from tests/domain.test.js (workout section)
│   └── sessions.test.ts        ← ported from tests/domain.test.js (session section)
├── storage.test.ts             ← ported from tests/storage.test.js
└── journeys/
    ├── plans.test.tsx          ← P1 story behavioural tests via RTL
    ├── session.test.tsx        ← P2 story behavioural tests via RTL
    └── history.test.tsx        ← P3 story behavioural tests via RTL

public/
├── icons/
│   ├── icon-192.png            ← maskable PWA icon
│   └── icon-512.png            ← maskable PWA icon (large)
└── manifest.json               ← augmented by vite-plugin-pwa at build time

index.html                      ← updated for Vite (type="module" entry to main.tsx)
vite.config.ts                  ← React plugin + vite-plugin-pwa config
tsconfig.json                   ← strict TypeScript targeting ES2022 with DOM lib
package.json                    ← updated scripts (dev, build, preview, test, lint)
```

**Structure Decision**: Single-project layout. The existing `src/` + `tests/` root is preserved.
Internal subdirectories are added within each to reflect the React component tree, domain
separation, and route-based organisation. No backend project is introduced.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| React 19 runtime dependency | TanStack Router is React-first and was explicitly requested; React's component model encapsulates ThemeContext and PlannerContext cleanly without custom pub/sub | Vanilla JS can implement dark mode and context, but cannot use TanStack Router without a React (or other framework) adapter |
| Vite 6 build step | TypeScript compilation requires a build tool; Vitest runs inside Vite's transform pipeline; vite-plugin-pwa uses Vite's post-build manifest to generate a correct SW precache list of hashed asset filenames | `node --test` with `ts-node` could run TypeScript tests but would not integrate Vitest or vite-plugin-pwa, and the PWA would need a separate build pass |
| @tanstack/react-router 1.x | Explicitly requested by user; provides type-safe `$sessionId` route param for the history detail view; built-in `viewTransition: true` option wires the CSS View Transitions API to route navigations without manual wrapping | React Router 6 or hash-based routing could handle navigation, but were not requested and lack the built-in view-transition integration |
| vite-plugin-pwa | Vite hashes all output filenames at build time; a manual service worker would require those hashed names to be known ahead of time or discovered at runtime; vite-plugin-pwa reads the Vite build manifest and injects the correct precache list automatically | A hand-written `sw.js` caching `*.js` patterns would match nothing after Vite renames files to `assets/main-Cm3k9A1p.js`; maintaining a static list defeats the purpose of cache-busting |
| @testing-library/react 16 | Behavioural component tests for the three user stories require rendering React components and simulating user interactions; domain unit tests alone cannot verify that clicking "Finish session" updates the UI correctly | Calling `ReactDOM.render()` directly in tests is feasible but produces brittle assertions tied to internal component structure rather than user-observable behaviour |
