# Implementation Plan: Gym Session Planner

**Branch**: `001-gym-session-planner` | **Date**: 2026-07-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-gym-session-planner/spec.md`

## Summary

Build a responsive, local-first browser application where one user creates reusable workouts,
records an active gym session, and reviews recent immutable session history. Use standards-based
HTML, CSS, and JavaScript modules with no runtime dependencies, a versioned local persistence
adapter, and test-first domain logic separated from the interface.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2022 on Node.js 22+ for tests

**Primary Dependencies**: Browser platform APIs only; no runtime packages

**Storage**: Browser local storage behind a versioned repository adapter

**Testing**: Node.js built-in test runner (`node --test`)

**Target Platform**: Modern evergreen browsers, responsive from 375 px to 1440 px

**Project Type**: Static single-page web application

**Performance Goals**: Interactive state presented within one second for 20 workouts and 20 sessions

**Constraints**: Offline after first load, no backend, no authentication, keyboard accessible,
dependency-free runtime, one active session, English copy, kilograms

**Scale/Scope**: One local user, 12 seeded exercises, up to 20 workouts and 20 retained sessions

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User-Value Slices**: PASS — plan retains three independently testable stories and a P1 MVP.
- **Local-First Privacy**: PASS — only browser-local data; no account, analytics, or network API.
- **Accessible by Default**: PASS — semantic landmarks, keyboard flows, focus visibility, status region,
  and responsive verification are explicit contract and task concerns.
- **Test-First Delivery**: PASS — domain and integration tests precede implementation per story.
- **Simplicity and Traceability**: PASS — one static app, zero runtime dependencies, story-labelled tasks.
- **Post-design re-check**: PASS — data model and UI contract introduce no exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/001-gym-session-planner/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html
package.json
src/
├── app.js
├── catalog.js
├── domain.js
├── storage.js
├── styles.css
└── ui.js
tests/
├── domain.test.js
├── storage.test.js
└── journeys.test.js
```

**Structure Decision**: A single static project isolates pure domain rules and persistence from DOM
rendering. This is the smallest structure that supports test-first delivery and a clear live demo.

## Complexity Tracking

No constitution violations or justified complexity exceptions.
