# Tasks: App Modernisation

**Input**: Design documents from `/specs/003-app-modernisation/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ui-contract.md ✓, quickstart.md ✓

**Tests**: REQUIRED by constitution. Every user-story phase places behavioural test tasks **before** implementation. Domain unit tests are migrated in Phase 2 (Foundational) and must pass before React migration begins.

**Organization**: Phase 1 = scaffold; Phase 2 = foundational (TypeScript port + React migration of existing functionality); Phase 3–5 = one phase per new user story; Phase 6 = polish and cleanup.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase
- **[US1/2/3]**: User story from spec.md (US1 = dark mode, US2 = PWA, US3 = transitions)
- Exact file paths are included in every description

---

## Phase 1: Setup (Scaffold)

**Purpose**: Replace the existing no-build, vanilla-JS setup with a Vite + TypeScript + React
project. No domain logic is changed here; the result is a compilable project that can run `npm run dev`.

- [ ] T001 Add Vite, TypeScript, React 19, @tanstack/react-router, Vitest 3, jsdom, @testing-library/react, @testing-library/user-event, @vitejs/plugin-react, vite-plugin-pwa, @vitest/coverage-v8 to `package.json` (run `npm install`)
- [ ] T002 Create `vite.config.ts` with `@vitejs/plugin-react`, Vitest config (`environment: 'jsdom'`, `include: ['tests/**/*.test.{ts,tsx}']`), and `VitePWA` plugin stub (empty manifest — full config in US2)
- [ ] T003 Create `tsconfig.json` with `"strict": true`, `"target": "ES2022"`, `"lib": ["ES2022","DOM","DOM.Iterable"]`, `"jsx": "react-jsx"`, `"moduleResolution": "bundler"`, `"paths"` for `src/` alias
- [ ] T004 Update `index.html`: replace `<script type="module" src="./src/app.js">` with `<script type="module" src="/src/main.tsx">`; add empty `<div id="root">` as React mount point; keep existing meta tags
- [ ] T005 Update `package.json` scripts to: `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`, `"test": "vitest"`, `"test:run": "vitest run"`, `"lint": "tsc --noEmit"`
- [ ] T006 Create `src/main.tsx` with a minimal `createRootRoute`, empty `createRouter`, and `ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)` — verifies the project compiles and `npm run dev` starts without error

**Checkpoint**: `npm run dev` starts; browser shows a blank page with no console errors. `npm run lint` exits 0.

---

## Phase 2: Foundational — TypeScript Port + React Migration

**Purpose**: Port all domain logic to TypeScript, migrate existing tests to Vitest, recreate the
Plans / Session / History functionality in React, and verify all original acceptance criteria pass
in the new stack. This phase is a prerequisite for all user-story phases.

⚠️ **CRITICAL**: No user-story work (US1/US2/US3) can begin until this phase is complete and
`npm run test:run` exits 0.

### 2a — Domain TypeScript port

- [ ] T007 [P] Create `src/domain/types.ts` with all interfaces from `specs/003-app-modernisation/data-model.md`: `Exercise`, `ExerciseCategory`, `WorkoutExercise`, `Workout`, `SessionExercise`, `SetResult`, `Session`, `SessionStatus`, `PlannerState`, `WorkoutExerciseDraft`, `WorkoutDraft`, `ValidationError`, `ThemePreference`, `PlannerAction`
- [ ] T008 [P] Create `src/domain/catalog.ts` porting `src/catalog.js`: typed `EXERCISES: readonly Exercise[]` constant, `exerciseById(id: string): Exercise | undefined` export
- [ ] T009 Create `src/domain/storage.ts` porting `src/storage.js`: `StorageCorruptionError`, `STORAGE_KEY`, `SCHEMA_VERSION`, `createDefaultState(): PlannerState`, `createPlannerRepository(storage: Storage)` returning `{ load, save, reset }` — fully typed against `PlannerState`
- [ ] T010 Create `src/domain/workouts.ts` porting workout functions from `src/domain.js`: `validateWorkout`, `createWorkout`, `updateWorkout`, `deleteWorkout`, `duplicateWorkout`, `workoutSummary`, `exerciseName` — all typed with `PlannerState`, `WorkoutDraft`, `ValidationError[]`
- [ ] T011 Create `src/domain/sessions.ts` porting session functions from `src/domain.js`: `startSession`, `recordSet`, `finishSession`, `discardSession`, `sessionSummary`, `historyItems`, `sessionDetail` — all typed with `PlannerState`, `Session`, `SetResult`

### 2b — Migrate existing tests to Vitest

- [ ] T012 [P] Create `tests/storage.test.ts` porting `tests/storage.test.js` to Vitest (`import { describe, it, expect } from 'vitest'`); all existing test cases must pass unchanged against `src/domain/storage.ts`
- [ ] T013 [P] Create `tests/domain/workouts.test.ts` porting the workout section of `tests/domain.test.js` to Vitest; all assertions preserved; import from `src/domain/workouts.ts` and `src/domain/storage.ts`
- [ ] T014 [P] Create `tests/domain/sessions.test.ts` porting the session section of `tests/domain.test.js` (startSession, recordSet, finishSession, discardSession, historyItems) to Vitest; import from `src/domain/sessions.ts`

**Checkpoint**: `npm run test:run` runs T012–T014 and all pass. TypeScript reports no errors on `src/domain/`.

### 2c — React state management

- [ ] T015 Create `src/context/PlannerContext.tsx`: export `PlannerContext` (React context), `PlannerProvider` wrapping `useReducer` with a `plannerReducer` that maps each `PlannerAction` type to the corresponding domain function in `workouts.ts` / `sessions.ts`; on every dispatch, call `repository.save(nextState)`; expose `{ state, dispatch, recoveryError }` via context; call `repository.load()` inside the provider on mount and catch `StorageCorruptionError`
- [ ] T016 Create `src/context/ThemeContext.tsx` as a **stub**: export `ThemeContext` with `preference: 'system'`, `resolved: 'light'`, and a no-op `toggle`; the full implementation is in US1 (T034)

### 2d — Routing and root layout

- [ ] T017 Create `src/routes/__root.tsx`: render skip link, `<header>` with brand mark and `<nav>` with `<Link>` to `/plans`, `/session`, `/history`; wrap child content in `<PlannerContext>`; render `<Outlet />`; render recovery screen when `recoveryError` is set; render `<div role="status" className="sr-only">` for announcements
- [ ] T018 Create `src/main.tsx` (full version replacing T006 stub): define `rootRoute`, `plansRoute` (`/plans`), `sessionRoute` (`/session`), `historyRoute` (`/history`), `historyDetailRoute` (`/history/$sessionId`), `indexRoute` (`/`, redirect to `/plans`); build `router` with `createRouter({ routeTree, defaultPreload: 'intent' })`; mount `<RouterProvider router={router} />` on `#root`

### 2e — Write journey tests BEFORE implementing routes (tests must fail first)

- [ ] T019 [P] Create `tests/journeys/plans.test.tsx`: RTL tests covering spec 001 US1 acceptance scenarios: create workout, add exercises, reorder, save, edit, delete, duplicate; use `renderWithRouter` helper; tests MUST be observed failing before T023 is implemented
- [ ] T020 [P] Create `tests/journeys/session.test.tsx`: RTL tests covering spec 001 US2 acceptance scenarios: start session, record sets with weight and reps, refresh persistence (via state reload), finish session with summary; tests MUST fail before T027 is implemented
- [ ] T021 [P] Create `tests/journeys/history.test.tsx`: RTL tests covering spec 001 US3 scenarios: view history list newest-first, open detail (immutable), empty state; tests MUST fail before T030 is implemented

### 2f — Implement Plans route and components

- [ ] T022 Create `src/components/ErrorSummary.tsx`: `role="alert"` div, `tabIndex={-1}`, lists all `ValidationError` messages; props per `contracts/ui-contract.md`
- [ ] T023 [P] Create `src/components/ExerciseRow.tsx`: fieldset with exercise select, sets number input, reps number input, move-up / move-down / remove buttons; props per `contracts/ui-contract.md`; all inputs emit `onChange(index, item)`
- [ ] T024 Create `src/components/WorkoutEditor.tsx`: wraps form with name input, `<ExerciseRow>` list, Add Exercise / Save buttons, Cancel button; props per `contracts/ui-contract.md`; renders `<ErrorSummary>` when errors present; focuses error summary after failed save
- [ ] T025 Create `src/components/WorkoutCard.tsx`: article with eyebrow (exercise count · total sets), workout name, exercise name list, Start / Edit / Delete / Duplicate actions; inline rename mode when `isRenaming`; props per `contracts/ui-contract.md`
- [ ] T026 Create `src/routes/plans.tsx`: reads `state.workouts` and `recoveryError` from `PlannerContext`; manages `editor`, `errors`, `renamingId` local state; renders card grid or empty state; renders `<WorkoutEditor>` inline when editor is open; dispatches `CREATE_WORKOUT`, `UPDATE_WORKOUT`, `DELETE_WORKOUT`, `DUPLICATE_WORKOUT`, `RESET_DATA` actions

### 2g — Implement Session route and components

- [ ] T027 [P] Create `src/components/SetRow.tsx`: grid row with completion checkbox, target-reps label, weight input, reps input; props per `contracts/ui-contract.md`; calls `onChange` on checkbox toggle and input blur; briefly highlights row on completion toggle (CSS class — full animation in US3 T050)
- [ ] T028 Create `src/components/SessionExercise.tsx`: section with exercise name heading, sets × target-reps eyebrow, list of `<SetRow>`; props per `contracts/ui-contract.md`
- [ ] T029 Create `src/routes/session.tsx`: reads `state.activeSession` and `lastSummary` from context (store `lastSummary` in component state, clear on navigate away); renders session exercise stack or post-session summary banner or empty state; dispatches `RECORD_SET`, `FINISH_SESSION`, `DISCARD_SESSION`; navigates to `/session` on start (handled by plans route)

### 2h — Implement History route and components

- [ ] T030 [P] Create `src/components/HistoryItem.tsx`: `<button>` row with workout name, date, completion badge, chevron; navigates to `/history/$sessionId` via `useNavigate`; props per `contracts/ui-contract.md`
- [X] T031 Create `src/routes/history.index.tsx`: reads `historyItems(state)` from domain; renders `<HistoryItem>` list or empty state with link to Plans
- [X] T032 Create `src/routes/history.$sessionId.tsx`: reads `params.sessionId` (typed by TanStack Router); calls `sessionDetail(state, params.sessionId)`; renders read-only exercise/set results grid or not-found fallback; back button uses `useNavigate(-1)`

**Checkpoint**: `npm run test:run` — ALL tests in T012–T014 and T019–T021 pass. `npm run dev` shows the full working app (Plans, Session, History) with feature-parity to the pre-migration version. `npm run lint` exits 0.

---

## Phase 3: User Story 1 — System-Aware Dark Mode (Priority: P1) 🎯 MVP

**Goal**: The planner detects the OS colour-scheme preference and applies matching colours
automatically. The user can override the preference with a persistent toggle in the header.

**Independent Test**: Open the app with OS set to Dark — dark colours appear immediately. Toggle
to Light — the override persists after a page refresh. WCAG 4.5:1 contrast passes in both themes.

### Tests for User Story 1 ⚠️

> **Write these FIRST. Confirm they fail before implementing T034–T040.**

- [ ] T033 [P] [US1] Create `tests/theme.test.ts`: Vitest unit tests for `ThemeContext` — initial value reads from localStorage (`form.planner.theme.v1`); `toggle()` cycles `light → dark → system → light`; `resolved` is `'dark'` when `preference` is `'dark'`; preference is written to localStorage on toggle
- [ ] T034 [P] [US1] Create `tests/journeys/dark-mode.test.tsx`: RTL acceptance tests — (1) app renders with `data-theme="dark"` when jsdom `matchMedia` mocked to dark; (2) clicking theme toggle changes `data-theme`; (3) page re-mount preserves stored preference; (4) reduced-motion media query is applied (CSS class or attribute checked)

### Implementation for User Story 1

- [ ] T035 [US1] Replace `src/context/ThemeContext.tsx` stub (T016) with full implementation: read `form.planner.theme.v1` from localStorage; compute `resolved` using `window.matchMedia('(prefers-color-scheme: dark)').matches`; listen for `matchMedia` change events to update `resolved` when `preference === 'system'`; `toggle()` cycles `light → dark → system → light` and persists to localStorage
- [ ] T036 [US1] Update `src/styles.css`: add `[data-theme="dark"]` selector block overriding all CSS custom properties (`--ink`, `--muted`, `--paper`, `--surface`, `--line`, `--accent`, `--accent-dark`, `--accent-soft`, `--danger`, `--danger-soft`, `--shadow`) with dark-appropriate values; ensure every colour combination passes WCAG 4.5:1
- [ ] T037 [US1] Update `index.html` `<head>`: add the synchronous anti-FOUC inline `<script>` from `contracts/ui-contract.md` that reads `form.planner.theme.v1` and sets `data-theme` on `<html>` before any stylesheet link
- [ ] T038 [US1] Update `src/routes/__root.tsx`: wrap content in `ThemeProvider`; on every `preference` change call `document.documentElement.setAttribute('data-theme', resolved)`; on mount sync `data-theme` with current `resolved` value
- [ ] T039 [US1] Add theme toggle `<button>` to the `<header>` in `src/routes/__root.tsx`: accessible label (`aria-label="Switch to {next} theme"`); renders a sun/moon or text label matching current `resolved`; calls `ThemeContext.toggle()` on click; minimum touch target 44 × 44 px

**Checkpoint**: US1 passes all T033–T034 tests. Manual check: OS dark → app dark; toggle → light; refresh → light persists. Chrome DevTools contrast audit finds no failures.

---

## Phase 4: User Story 2 — Installable App Experience (Priority: P2)

**Goal**: The planner is installable from a supported browser to the device home screen. It loads
fully without a network connection after the first visit.

**Independent Test**: Run `npm run build && npm run preview`; Chrome shows the install affordance;
Offline mode in DevTools → app loads and all features work; manifest.json has required fields.

### Tests for User Story 2 ⚠️

> **Write these FIRST. Confirm they fail (or are skipped with TODO) before implementing T042–T045.**

- [ ] T040 [US2] Create `tests/pwa.test.ts`: Vitest tests verifying — (1) `dist/manifest.webmanifest` (or `dist/manifest.json`) contains `name`, `short_name`, `display: 'standalone'`, `theme_color`, `background_color`, and at least one icon entry; (2) `dist/index.html` contains a `<link rel="manifest">` tag; (3) `dist/` contains a `sw.js` or `registerSW.js` file — these tests run against the build output, so use `npm run build` in a `beforeAll` or mark as integration tests run via `test:run`

### Implementation for User Story 2

- [ ] T041 [US2] Create `public/icons/icon-192.png` and `public/icons/icon-512.png`: on-brand maskable icons using the existing "F" brand mark on `--ink` (#17201b) background; 192 × 192 and 512 × 512 pixels; safe zone centred per maskable icon spec
- [ ] T042 [US2] Update `vite.config.ts` with full `VitePWA` configuration: `registerType: 'autoUpdate'`, `manifest` object per `contracts/ui-contract.md` (name, short_name, description, start_url, display, background_color, theme_color, icons array pointing to the two PNG icons), `workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg}'], runtimeCaching: [] }` (cache-first for all precached assets)
- [ ] T043 [US2] Run `npm run build` and verify: `dist/` contains `sw.js`, `manifest.webmanifest`, and hashed asset files; inspect the SW precache manifest to confirm it lists all JS/CSS/HTML assets; if any asset is missing, update `globPatterns` in `vite.config.ts`
- [ ] T044 [US2] Validate offline using `quickstart.md` P2 walkthrough: `npm run preview`, Chrome DevTools → Service Workers → activate; Network → Offline; reload confirms full app loads; create a workout, complete a set — both work offline; re-enable network, reload — no error

**Checkpoint**: US2 passes T040 tests. Chrome shows install affordance on `localhost:4173`. Full app works with network disabled after first load. App icon and name appear correctly when installed.

---

## Phase 5: User Story 3 — Smooth Transitions and Micro-Animations (Priority: P3)

**Goal**: Navigation between views uses a smooth cross-fade/slide. Completing a set and saving
a workout produce a brief confirmation pulse. All motion is suppressed for reduced-motion users.

**Independent Test**: Navigate Plans → Session → History — each transition completes in ≤ 250 ms.
Check a set — set row pulses. Enable OS Reduce Motion — all navigations and pulses are instant.

### Tests for User Story 3 ⚠️

> **Write these FIRST. Confirm they fail before implementing T048–T052.**

- [ ] T045 [US3] Create `tests/journeys/transitions.test.tsx`: RTL + Vitest tests — (1) navigating routes adds/removes `view-transition-name` or `data-view-transition` attribute (or check that `document.startViewTransition` is called — mock it); (2) completing a set adds the pulse CSS class to `SetRow` and removes it after timeout; (3) when `matchMedia('prefers-reduced-motion: reduce')` is mocked, the router `viewTransition` flag is overridden to false and no animation class is applied

### Implementation for User Story 3

- [ ] T046 [US3] Update `src/main.tsx`: add `viewTransition: true` to `createRouter` options so TanStack Router calls `document.startViewTransition()` on every navigation; add a `shouldTransition` helper that checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and short-circuits when true by returning `false` from a custom `viewTransition` function passed to the router
- [ ] T047 [US3] Update `src/styles.css`: add `@keyframes slide-in` (translateX or opacity from 0 to 1, 220 ms ease-out) and `@keyframes slide-out` (opacity 1 to 0, 100 ms ease-in); attach to `::view-transition-new(root)` and `::view-transition-old(root)` pseudo-elements; set `animation-fill-mode: both`
- [ ] T048 [US3] Update `src/styles.css`: add `@keyframes pulse-confirm` (brief scale 1 → 1.03 → 1 over 200 ms) and a `.confirm-pulse` utility class that applies it with `animation-duration: 200ms`
- [ ] T049 [US3] Update `src/components/SetRow.tsx`: after calling `props.onChange(values)` when a set is marked complete, `setState({ pulse: true })` then `setTimeout(() => setState({ pulse: false }), 250)` to apply and remove `.confirm-pulse` class on the set row wrapper
- [ ] T050 [US3] Update `src/components/WorkoutCard.tsx`: after a save completes (card re-renders from `editor = null`), apply `.confirm-pulse` to the card for 250 ms using the same `useEffect` + timeout pattern as T049
- [ ] T051 [US3] Update `src/styles.css`: add `@media (prefers-reduced-motion: reduce)` block setting `::view-transition-old(*), ::view-transition-new(*) { animation-duration: 0.01ms; }` and `.confirm-pulse { animation: none; }` to suppress all motion for users who opt out

**Checkpoint**: US3 passes T045 tests. Manual check: route transitions animate in ≤ 250 ms in Chrome. Set completion pulses briefly. Enabling OS "Reduce Motion" makes all transitions instant with no visual flicker.

---

## Phase 6: Polish and Cleanup

**Purpose**: Remove obsolete files from the pre-migration codebase, validate the full acceptance
walkthrough, and ensure the build and test suite are clean.

- [ ] T052 [P] Delete obsolete source files: `src/app.js`, `src/ui.js`, `src/domain.js`, `src/storage.js`, `src/catalog.js` — all functionality now lives in `src/domain/`, `src/context/`, `src/routes/`, and `src/components/`
- [ ] T053 [P] Delete obsolete test files: `tests/domain.test.js`, `tests/storage.test.js`, `tests/journeys.test.js`, `tests/responsive-harness.html` — replaced by TypeScript equivalents in Phase 2b and T019–T021
- [ ] T054 Run `npm run test:run` and confirm all tests pass (T012–T014, T019–T021, T033–T034, T040, T045 and any others)
- [ ] T055 Run `npm run build` and confirm zero TypeScript errors and zero Vite build errors; inspect `dist/` for SW, manifest, and hashed asset files
- [ ] T056 Run the full `quickstart.md` acceptance walkthrough: P1 dark mode, P2 PWA offline, P3 transitions, plus the regression check (Plans/Session/History journeys + keyboard navigation + recovery screen)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **BLOCKS all user stories**
  - 2a (domain port) and 2b (Vitest migration) can run in parallel
  - 2c (PlannerContext) depends on 2a
  - 2d (routing + root layout) depends on 2c
  - 2e (journey tests — write failing tests) can run in parallel with 2d
  - 2f–2h (implement routes) depends on 2d; tests in 2e must be written (failing) first
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 2 completion — can run in parallel with Phase 3
- **Phase 5 (US3)**: Depends on Phase 2 completion — can run in parallel with Phases 3–4
- **Phase 6 (Polish)**: Depends on all desired story phases being complete

### User Story Dependencies

- **US1 (dark mode)**: Standalone after Phase 2; no dependency on US2 or US3
- **US2 (PWA)**: Standalone after Phase 2; no dependency on US1 or US3
- **US3 (transitions)**: Standalone after Phase 2; no dependency on US1 or US2

### Within Each User Story

1. Write failing tests → confirm they fail → implement → confirm they pass
2. Domain/context changes before component changes
3. Component changes before route changes
4. Story complete before moving to next priority

---

## Parallel Opportunities

### Phase 2: All [P] tasks can run simultaneously per sub-phase

```
# 2a — domain port: launch all five in parallel
T007: src/domain/types.ts
T008: src/domain/catalog.ts
T009: src/domain/storage.ts        ← depends on T007
T010: src/domain/workouts.ts       ← depends on T007, T008
T011: src/domain/sessions.ts       ← depends on T007, T008

# 2b — test migration: after 2a, launch all three in parallel
T012: tests/storage.test.ts
T013: tests/domain/workouts.test.ts
T014: tests/domain/sessions.test.ts

# 2e — write failing journey tests: run in parallel with 2d
T019: tests/journeys/plans.test.tsx
T020: tests/journeys/session.test.tsx
T021: tests/journeys/history.test.tsx
```

### Phases 3–5: Run as three parallel workstreams after Phase 2

```
Workstream A: Phase 3 (US1 — T033 → T039)
Workstream B: Phase 4 (US2 — T040 → T044)
Workstream C: Phase 5 (US3 — T045 → T051)
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + US1 only)

1. Complete Phase 1: scaffold (T001–T006)
2. Complete Phase 2: foundational port + React migration (T007–T032)
3. **STOP and VALIDATE**: Full app works in React; all existing tests pass
4. Complete Phase 3: dark mode (T033–T039)
5. **DEMO**: App with dark mode is the minimum demonstrable modernisation

### Incremental Delivery

1. Phase 1 + 2 → Foundation (app works in React/TypeScript)
2. Phase 3 → Dark mode ✓ Demo
3. Phase 4 → PWA installable ✓ Demo
4. Phase 5 → Transitions ✓ Demo
5. Phase 6 → Polish → Ship

---

## Notes

- [P] = different files, no shared dependencies within the phase
- [USN] label maps each task to a spec user story for traceability
- The constitution requires tests to be written FIRST and observed failing before implementation
- Commit after each task or logical group; use `git status` to confirm only intended files changed
- The existing `src/*.js` files remain untouched until Phase 6 T052 — this prevents accidental data loss during migration
- `form.planner.v1` localStorage data is forward-compatible; no migration script needed
