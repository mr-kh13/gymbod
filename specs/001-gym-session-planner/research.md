# Research: Gym Session Planner

## Decision 1: Dependency-free static application

**Decision**: Use semantic HTML, responsive CSS, and JavaScript ES modules without a framework.

**Rationale**: The app has three small views, no server state, and no routing requirement that
justifies a framework. The approach starts instantly, works offline, and makes the demo about the
Spec Kit workflow instead of installation output.

**Alternatives considered**: React/Vite offered component conventions but added build tooling and
dependencies. A server-rendered application contradicted the local-first constraint.

## Decision 2: Versioned browser-local repository

**Decision**: Persist one JSON document under a namespaced, versioned key through an injected storage
adapter. Parse and schema failures return a recoverable corrupted-data state instead of silently
deleting data.

**Rationale**: A repository boundary keeps domain tests deterministic and makes future migrations
possible while satisfying offline and privacy requirements.

**Alternatives considered**: IndexedDB is stronger at large scale but unnecessary for 20 workouts
and 20 sessions. In-memory state would fail refresh persistence.

## Decision 3: Pure domain transitions

**Decision**: Model create/update workout, start/record/finish/discard session, and history selection
as pure functions returning new state or structured validation errors.

**Rationale**: Pure transitions are easy to test before UI work, prevent partial mutations, and make
spec-to-test traceability visible during the talk.

**Alternatives considered**: Direct DOM event mutations would be shorter initially but make recovery,
validation, and automated testing harder to reason about.

## Decision 4: Native test runner

**Decision**: Use Node's built-in `node:test` and `assert` modules for unit and journey tests.

**Rationale**: It requires no downloaded packages and supports the constitution's red-green-refactor
gate in the available environment.

**Alternatives considered**: Vitest and Playwright provide richer tooling but introduce dependency
installation and are unnecessary for core domain coverage; visual browser validation remains a
separate convergence step.
