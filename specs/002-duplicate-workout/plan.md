# Implementation Plan: Duplicate Workout

**Branch**: `main` | **Date**: 2026-07-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-duplicate-workout/spec.md`

**User constraint**: Keep the existing dependency-free architecture and local persistence model.

## Summary

Add a Duplicate action to each workout list-item card so the user can create an independent copy
of any saved workout without opening the editor. The copy receives a deterministic default name
("Copy of [Name]", truncated to 50 characters and suffixed to avoid collisions), its name field
is pre-focused for optional inline rename, and all changes to the copy are independent of the
original. No new dependencies, storage schema version change, or infrastructure is required.

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2022 on Node.js 22+ for tests

**Primary Dependencies**: Browser platform APIs only; no runtime packages

**Storage**: Browser localStorage behind the versioned `createPlannerRepository` adapter in
`src/storage.js`; schema version remains 1 (a duplicate is a normal Workout record)

**Testing**: Node.js built-in test runner (`node --test`)

**Target Platform**: Modern evergreen browsers, responsive from 375 px to 1440 px

**Project Type**: Static single-page web application

**Performance Goals**: Duplicate appears within one second for a dataset of up to 20 workouts

**Constraints**: Offline, no backend, no authentication, keyboard accessible, dependency-free
runtime, English copy, kilograms

**Scale/Scope**: One local user; existing 20-workout cap covers all duplicate scenarios

**Note — name-length alignment**: The existing `validateWorkout` enforces a 60-character limit;
the spec clarification establishes 50 as the canonical maximum. This feature updates the limit
to 50 throughout (validation function and editor `maxlength` attribute) for consistency.

## Constitution Check

*GATE: Passed before research. Re-checked after Phase 1 design.*

- **User-Value Slices**: PASS — three independently testable stories (duplicate, rename, independent
  edit) ordered by value; P1 alone produces a working duplicate.
- **Local-First Privacy**: PASS — the duplicate is a plain Workout record in localStorage; no new
  network calls, accounts, or data collection.
- **Accessible by Default**: PASS — Duplicate button follows existing `data-action` keyboard pattern;
  inline rename input is pre-focused; SC-005 verifies keyboard operability at 375 px and 1440 px.
- **Test-First Delivery**: PASS — domain tests for `duplicateWorkout` and journey tests for all
  three stories are written before implementation.
- **Simplicity and Traceability**: PASS — one new domain function, one new app state variable
  (`renamingId`), and additive UI changes; no new abstractions or dependencies.
- **Post-design re-check**: PASS — data model and UI contract introduce no exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/002-duplicate-workout/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ui-contract.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── domain.js     ← add duplicateWorkout(); update name max-length 60 → 50
├── ui.js         ← add Duplicate button to card; add inline-rename state; update maxlength
├── app.js        ← add renamingId state; handle duplicate-workout / confirm-rename / cancel-rename
├── catalog.js    ← unchanged
├── storage.js    ← unchanged
└── styles.css    ← minor: inline-rename form layout if needed

tests/
├── domain.test.js    ← new tests for duplicateWorkout (written first)
├── journeys.test.js  ← new journey tests for all three stories (written first)
└── storage.test.js   ← unchanged
```

**Structure Decision**: No structural changes; this feature is a pure additive extension to the
existing single-project layout established in `specs/001-gym-session-planner/plan.md`.

## Complexity Tracking

No constitution violations or justified complexity exceptions.
