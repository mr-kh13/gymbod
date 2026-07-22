# Implementation Plan: Full Workout History

**Branch**: `005-full-workout-history` | **Date**: 2026-07-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-full-workout-history/spec.md`

## Summary

Remove the two-location 20-session cap from `finishSession` and `historyItems` in `src/domain/sessions.ts`, expose a pure `sessionDurationMs` selector derived from the existing `startedAt`/`finishedAt` timestamps, update `historyItems` to include `durationMs` in its return shape, and move inline summary calculations from route components into domain calls. Update `history.index.tsx` to reflect the full session count and `history.$sessionId.tsx` to display training duration alongside start time. No schema migration is required — the existing `Session` snapshot already captures workout name, exercise names, planned targets, and all set results immutably at session-finish time. Add Vitest unit tests for ordering without a cap, snapshot immutability, partial sessions, duration calculation, and summary accuracy; add React Testing Library journey tests for the empty state, list with more than 20 sessions, and the full detail view.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 22+

**Primary Dependencies**: React 19, @tanstack/react-router 1.x, Vite 6, Vitest, @testing-library/react, @testing-library/user-event

**Storage**: Browser `localStorage` via `createPlannerRepository`. Key: `form.planner.v1`. Current schema version: 3. No version bump required — the `Session` type and `PlannerState.history` array already hold complete snapshots.

**Testing**: Vitest unit tests in `tests/domain/`; React Testing Library journeys in `tests/journeys/`. Setup in `tests/setup.ts`. Globals: true.

**Target Platform**: Browser, 375 px – 1440 px viewport, keyboard-accessible, WCAG 2.2 AA contrast

**Project Type**: Single-page browser application; no backend; no network dependency after initial load

**Performance Goals**: History list and detail render in under 1 second for a locally stored dataset of up to 200 sessions (spec SC-002)

**Constraints**: No new runtime dependencies. No pagination unless a measured performance regression is found against 200 sessions. No filtering, search, calendar views, or analytics.

**Scale/Scope**: Unlimited sessions (localStorage capacity is the only ceiling). Tests exercise the >20-session boundary.

## Constitution Check

### Pre-design gate

| Principle | Status | Evidence |
|-----------|--------|---------|
| I. User-Value Slices | ✅ PASS | Spec has four independently testable stories; P1 pair (cap removal + preserved snapshot detail) delivers value without lower-priority stories |
| II. Local-First Privacy | ✅ PASS | No new network calls, no analytics additions; all history stays in localStorage |
| III. Accessible by Default | ✅ PASS | History list uses semantic list markup; detail uses heading hierarchy; both maintain keyboard navigation and visible focus; responsive 375–1440 px |
| IV. Test-First Delivery | ✅ PASS | Unit and RTL test tasks are ordered before implementation tasks in tasks.md |
| V. Simplicity and Traceability | ✅ PASS | Two-line cap removal; one new pure `sessionDurationMs` selector; no new files in src/ beyond what already exists |

No violations — complexity tracking table omitted.

### Post-design gate (re-evaluated after Phase 1)

| Principle | Status | Notes |
|-----------|--------|-------|
| I | ✅ PASS | `historyItems` return shape extended by two fields only (`startedAt`, `durationMs`); no extra layers added |
| II | ✅ PASS | `sessionDurationMs` operates on already-stored ISO strings; nothing new is persisted |
| III | ✅ PASS | UI contract specifies `<time>` elements for timestamps and duration; existing ARIA roles preserved |
| IV | ✅ PASS | Every new selector and every route change maps to at least one test task |
| V | ✅ PASS | `formatDuration` is module-level in the detail route, following the existing `formatDate` pattern in that file |

## Project Structure

### Documentation (this feature)

```text
specs/005-full-workout-history/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-contract.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (affected paths)

```text
src/
└── domain/
│   └── sessions.ts            # Cap removal (×2); sessionDurationMs(); historyItems() return type extension
└── routes/
    ├── history.index.tsx      # Lede text update; consume durationMs from historyItems()
    └── history.$sessionId.tsx # sessionSummary() call; formatDuration(); startedAt + duration display

tests/
├── domain/
│   └── sessions.test.ts       # Replace 20-cap test; add unlimited-cap, duration, partial-session tests
└── journeys/
    └── history.test.tsx       # Add >20-session list, duration display, and partial-session journey tests
```

**Structure Decision**: Single-project layout. All changes are confined to `src/domain/sessions.ts`, two route files, and two test files. No new source files are required.
