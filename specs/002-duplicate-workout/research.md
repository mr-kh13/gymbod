# Research: Duplicate Workout

## Summary

All questions are resolvable from the existing codebase alone. No external libraries, APIs, or
infrastructure changes are required. The three decisions below inform the implementation directly.

---

## Decision 1: Duplicate as a domain function

**Decision**: Add `duplicateWorkout(state, workoutId, options)` to `src/domain.js`, returning
`{ state, workout }` — the same shape as `createWorkout`.

**Rationale**: Domain functions are pure (state-in / state-out), testable without a DOM, and
already cover all create/update/delete operations. Placing duplication here keeps the pattern
consistent and lets journey tests exercise the full story without rendering.

**Alternatives considered**:
- Inline in `app.js` as a one-off handler — rejected because it bypasses unit testing and
  breaks the separation of domain logic from event handling that the existing architecture enforces.

---

## Decision 2: Default name generation with collision avoidance

**Decision**: Generate names deterministically in this order:
1. `"Copy of {name}"` — truncated to 50 characters.
2. If taken: `"Copy of {name} (2)"` — built from the original (not truncated) base, then
   truncated to 50 characters.
3. Continue incrementing the suffix integer until a unique name is found.

Collision detection compares against `new Set(state.workouts.map(w => w.name))`.

**Rationale**: Deterministic generation requires no user input, is fully testable, and matches
the pattern used by macOS Finder and iOS apps. Truncating the full candidate (base + suffix) to
50 after construction keeps the logic simple without a secondary "reserve-space-for-suffix" pass.

**Alternatives considered**:
- Prompt the user for a name before creating the duplicate — rejected because it adds a blocking
  dialog before the user has seen the result, conflicts with FR-004 (pre-focused optional rename),
  and increases interaction count above the SC-001 three-interaction target.
- Reserve characters for the suffix before truncating — rejected as over-engineering for names up
  to 50 characters; in practice the edge case (a 44+ character name that produces a truncated base
  that also collides) is extremely rare and the suffix-after-truncation approach still resolves it.

---

## Decision 3: Inline rename via a transient `renamingId` app state variable

**Decision**: Add `let renamingId = null` in `src/app.js`. After duplication, set it to the new
workout's ID and re-render. `renderPlans` receives `renamingId` and replaces the name display for
that card with a pre-focused `<input>`. Confirm/cancel actions clear `renamingId` and re-render.

**Rationale**: The existing architecture uses a single `render()` call driven by module-level
state variables (`editor`, `errors`, `lastSummary`, `selectedHistory`). Adding `renamingId`
follows exactly this pattern — no new mechanism, no extra abstraction. The inline input is
rendered as part of the card rather than a modal, keeping the layout predictable and accessible.

**Alternatives considered**:
- Open the full workout editor pre-populated with the duplicate — rejected because it moves the
  user out of the list view and turns rename into a multi-field save, which is heavier than
  needed for a simple name change.
- Browser `prompt()` — rejected because it is inaccessible, visually inconsistent, and
  disrupts the user's context.

---

## Decision 4: Name-length limit update (60 → 50)

**Decision**: Update `validateWorkout` in `src/domain.js` (currently `> 60`) to `> 50`, and
update the editor `maxlength` attribute in `src/ui.js` from `"60"` to `"50"`.

**Rationale**: The spec clarification established 50 as the canonical maximum. Aligning the
validation function ensures FR-005 (duplicate rename enforces the same rules) is testable and
consistent across all workout creation paths. The change is backward-compatible because existing
saved workouts with names of 51–60 characters are already stored and remain readable; only new
edits would be affected.

**Alternatives considered**:
- Use 50 only for the rename validator and leave the main validator at 60 — rejected because two
  different limits for the same field are confusing and make FR-005 untestable as stated.
