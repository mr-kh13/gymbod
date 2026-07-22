# Research: Full Workout History

**Feature**: 005-full-workout-history | **Date**: 2026-07-23

## Decision Log

---

### D-001: Cap removal strategy — domain vs display layer

**Decision**: Remove the cap at both locations simultaneously.

**Rationale**: The 20-session limit is enforced in two independent places:
1. `finishSession()` in `src/domain/sessions.ts` (line 100) trims the `history` array to 20 entries before persisting.
2. `historyItems()` in the same file (line 113) re-slices sorted results to 20 before returning to the route.

Both must be removed. Removing only the display-layer slice would expose sessions beyond 20 in the UI but silently discard them during `finishSession`, so users who exceed 20 sessions would see old sessions disappear from both the list and storage after each new finish. Removing only the domain-layer slice would leave the display capped. The only correct fix is to remove both `.slice(0, 20)` calls.

**Alternatives considered**:
- *Keep the display cap and raise the domain limit to e.g. 200* — rejected; artificial limits contradict the spec requirement for complete history and would require revisiting this again.
- *Move to a paginated store* — rejected; the spec explicitly says no pagination unless required for measured performance, and localStorage access of a few hundred sessions does not cross that threshold.

---

### D-002: Duration as a derived value — no new stored field

**Decision**: Compute duration at read time from `session.startedAt` and `session.finishedAt`; do not add a `durationMs` field to the `Session` type or the stored schema.

**Rationale**: Both timestamps are already stored as ISO 8601 strings on every `Session`. Duration in milliseconds is `new Date(finishedAt).getTime() - new Date(startedAt).getTime()`. This is a pure, deterministic derivation with no rounding error. Storing it redundantly would create a consistency risk (stored duration could diverge from timestamps if data is migrated or patched) with no benefit.

**Implementation**: Add a `sessionDurationMs(session: Session): number | null` selector in `src/domain/sessions.ts`. Return `null` when `finishedAt` is absent (defensive for any legacy active-session data that ends up in history). Expose `durationMs` from `historyItems()` using the same computation inline so the list route does not need to call the selector separately.

**Alternatives considered**:
- *Bump schema to v4 and add `durationSecs` to the `Session` type* — rejected; adds migration complexity and storage redundancy with no gain, since the timestamps are always present on completed sessions.

---

### D-003: No schema migration required

**Decision**: Schema remains at version 3. No `migrateV3toV4` function is needed.

**Rationale**: Every `Session` stored since v1 already contains a complete snapshot: `workoutName` (name as used), `plannedExercises` (exercise names and targets as captured at session start), and `results` (every set's completion state and actual values). The snapshot immutability requirement in the spec is already satisfied by the existing data model. The only behavioural change is lifting the runtime cap; no stored field is added, removed, or reshaped.

Existing users who accumulated data under the 20-session cap will see at most 20 sessions in history (those already stored). Sessions finished after this feature ships will accumulate without limit. This is the expected and correct outcome — no backfill of discarded sessions is possible since they were never written.

**Alternatives considered**:
- *Bump to schema v4 to signal the history-unlimited capability* — rejected; schema versions signal stored-shape changes, not behavioural policy changes. Bumping without a shape change would force a no-op migration on every existing user.

---

### D-004: Selector-first approach for summary and duration in routes

**Decision**: Route components call domain selectors (`sessionSummary`, `sessionDurationMs`, `historyItems`) and pass results to JSX; no arithmetic or date math inside JSX or render functions.

**Rationale**: The implementation plan user input explicitly states "Keep duration, set totals, volume inputs, and summary calculations in pure domain selectors rather than route components." The existing `history.$sessionId.tsx` computes `completedSets` and `plannedSets` inline (lines 44–45) — these two lines should be replaced with a `sessionSummary(session)` call. The existing `historyItems` selector already handles ordering; it is extended to include `durationMs` so the list route receives a ready-to-render value.

**Alternatives considered**:
- *Inline duration math in JSX* — rejected per implementation guidance and constitution principle V (simplicity and traceability; every calculation must be independently testable).

---

### D-005: `formatDuration` placement

**Decision**: Module-level pure function in `src/routes/history.$sessionId.tsx`, following the existing `formatDate` pattern already in that file.

**Rationale**: Duration formatting is a presentation concern (locale-aware display of "1h 30m", "45m", "2h"). Placing it in `src/domain/sessions.ts` would mix UI-layer formatting with domain logic. Following the `formatDate` precedent in the same file keeps the boundary clear: domain computes milliseconds, route converts to human text.

Format rule: floor to whole minutes. `0–59 m` → `"Nm"`. `60+ m` → `"Nh Nm"` (omit minutes if exactly on the hour, e.g. `"2h"`).

**Alternatives considered**:
- *Shared `src/utils/format.ts`* — considered but rejected as speculative abstraction; only one call site exists.

---

### D-006: Partial-session display

**Decision**: Use the existing `sessionSummary` return value (`{ completedSets, plannedSets }`) to surface completion ratio everywhere; no new "partial" flag or status field.

**Rationale**: A session where `completedSets < plannedSets` is already understandable via the ratio display ("3/9 sets"). The spec says partial sessions "must be understandable" — the ratio plus per-set incomplete indicators (the existing `○` marker on unfinished sets in the detail view) already satisfy this. No new status enum value or stored field is needed.

---

### D-007: List lede text update

**Decision**: Change the lede in `history.index.tsx` from `"Your latest {items.length} completed sessions"` to `"All your completed sessions, stored only on this device."` when sessions exist.

**Rationale**: The current string hard-codes an implicit 20-cap framing ("latest N") which will be misleading once the cap is gone. The new text is accurate at any count and reinforces the local-first privacy principle.
