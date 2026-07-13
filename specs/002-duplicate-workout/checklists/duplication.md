# Duplication Semantics & Data Integrity Checklist: Duplicate Workout

**Purpose**: Validate that duplication semantics and data integrity requirements are complete,
clear, consistent, and measurable — treating the spec as code and each item as a unit test.
**Created**: 2026-07-13
**Feature**: [spec.md](../spec.md) · [data-model.md](../data-model.md) · [plan.md](../plan.md)
**Focus**: Duplication semantics, copy fidelity, independence, name generation, persistence

---

## Duplication Semantics — Completeness

- [ ] CHK001 - Is it explicitly specified which Workout fields are copied into the duplicate
  (name, exercises, sets, targetReps, order) versus which are independently generated (id,
  createdAt, updatedAt)? [Completeness, Spec §FR-002, data-model.md]

- [ ] CHK002 - Does the data model specify that the duplicate's `id` is a newly generated
  unique identifier, with no derivation from or link to the source workout's id?
  [Completeness, Gap, data-model.md]

- [ ] CHK003 - Is timestamp behavior for the duplicate (`createdAt`, `updatedAt`) explicitly
  defined — specifically that both are set to the duplication time, not inherited from the
  source? [Gap, data-model.md]

- [ ] CHK004 - Does the spec define the position of the duplicate in the workout list after
  creation (e.g., appended at end, inserted after source)? [Gap, Spec §FR-002]

- [ ] CHK005 - Is "immediately usable" (FR-009) defined in terms of which operations become
  available on the duplicate before the optional rename step completes?
  [Clarity, Spec §FR-009]

---

## Duplication Semantics — Independence & Bidirectionality

- [ ] CHK006 - Is the independence requirement stated in both directions — that changes to the
  duplicate do not affect the source AND that changes to the source do not affect the
  duplicate? [Clarity, Spec §FR-006, User Story 3 Scenarios 1 & 2]

- [ ] CHK007 - Does FR-007 ("deleting the source MUST NOT delete or modify any of its
  duplicates") cover the inverse — that deleting a duplicate must not affect the source?
  [Completeness, Spec §FR-007]

- [ ] CHK008 - Is it specified that future edits to the source workout's exercises, sets, or
  repetitions do not retroactively alter the duplicate's Planned Exercise snapshot taken at
  duplication time? [Completeness, Spec §FR-006]

- [ ] CHK009 - Does the spec address whether an active session's workout snapshot is similarly
  independent from any duplicate created after that session began? [Gap, Spec §FR-008]

---

## Copy Fidelity — Data Integrity of Planned Exercises

- [ ] CHK010 - Does the data model explicitly state that Planned Exercise records are copied
  by value (deep copy), not by reference, so that editing one workout's exercise list does
  not mutate the other's? [Completeness, data-model.md, Gap]

- [ ] CHK011 - Is it specified that all Planned Exercise fields are included in the copy:
  `exerciseId`, `sets`, `targetReps`, and list position (order)? [Completeness, Spec §FR-002,
  data-model.md]

- [ ] CHK012 - Does the data model clarify that catalogue Exercise records (from the seeded
  catalogue) are referenced — not duplicated — inside each Planned Exercise?
  [Completeness, data-model.md]

- [ ] CHK013 - Is the requirement that exercise order in the duplicate exactly matches the
  source's order at the moment of duplication stated unambiguously?
  [Clarity, Spec §FR-002, SC-003]

---

## Default Name Generation — Completeness & Edge Cases

- [ ] CHK014 - Does FR-003 specify the exact default name format ("Copy of [Original Name]")
  with enough precision to derive a deterministic, testable algorithm?
  [Clarity, Spec §FR-003]

- [ ] CHK015 - Is the collision-detection scope defined — specifically whether uniqueness is
  checked against all saved workout names or only against names sharing the same source?
  [Clarity, Spec §FR-003, data-model.md]

- [ ] CHK016 - Does the spec or data model define the suffix format for disambiguating
  collisions — specifically the format "(2)", "(3)" — with enough precision to be testable?
  [Completeness, Spec §FR-003, data-model.md]

- [ ] CHK017 - Is the interaction between the 50-character name limit and suffix appending
  specified? In particular, is it defined what happens when both "Copy of X" and
  "Copy of X (2)" truncate to the same 50-character string, creating an unresolvable
  collision? [Edge Case, Gap, data-model.md]

- [ ] CHK018 - Does the spec address what happens when the source name is exactly 42 characters
  long, making "Copy of [name]" exactly 50 characters, and a suffix "(2)" would cause a
  truncation collision? [Edge Case, Gap, data-model.md]

- [ ] CHK019 - Is it explicitly stated that suffix generation is bounded (e.g., continues
  indefinitely) or is there a limit after which name generation fails?
  [Completeness, Gap, data-model.md]

---

## Data Integrity — Persistence & Storage

- [ ] CHK020 - Does FR-010 or the Assumptions section explicitly state that the duplicate is
  persisted to local storage immediately upon creation — before the optional inline rename —
  so that a page refresh retains it with its default name? [Completeness, Spec §FR-010]

- [ ] CHK021 - Is the behavior defined if a page refresh occurs while the inline rename input
  is active — specifically whether the default name or the partially typed new name is
  retained? [Edge Case, Gap, Spec §FR-010, contracts/ui-contract.md]

- [ ] CHK022 - Does the data model confirm that the duplicate conforms to schema version 1
  without requiring a schema migration? [Completeness, data-model.md, Spec §Assumptions]

- [ ] CHK023 - Are the storage persistence guarantees for the duplicate explicitly aligned with
  those described for other workouts in the Assumptions section (same-device, no
  cross-device sync)? [Consistency, Spec §Assumptions]

---

## Data Integrity — Cascade & Isolation

- [ ] CHK024 - Is it specified that deleting the source workout does not orphan or invalidate
  any active sessions or history entries that reference the source (not the duplicate)?
  [Completeness, Spec §FR-007, Edge Cases]

- [ ] CHK025 - Does the spec state that active sessions based on the source workout use a
  snapshot and are therefore isolated from the duplication operation itself?
  [Completeness, Spec §FR-008]

- [ ] CHK026 - Is it explicitly stated that duplicating a workout that is itself a previously
  created duplicate follows exactly the same rules as duplicating any other workout?
  [Completeness, Spec §Edge Cases]

---

## Requirement Consistency — Cross-Section Alignment

- [ ] CHK027 - Is the 50-character name limit in FR-003 and FR-005 consistent with the name
  constraint stated in data-model.md? Note: feature 001's data-model.md states 1–60
  characters — is this conflict identified and resolved? [Conflict, Spec §FR-003,
  data-model.md (001 vs 002)]

- [ ] CHK028 - Are the validation rules referenced in FR-005 ("same rules as creating a new
  workout") fully and consistently defined in one authoritative location?
  [Consistency, Spec §FR-005]

- [ ] CHK029 - Do FR-001 (list-item action triggers duplication) and FR-004 (pre-focused rename
  after creation) together describe a consistent, gap-free user journey without ambiguous
  intermediate states? [Consistency, Spec §FR-001, FR-004]

- [ ] CHK030 - Is the requirement that "no hard cap on duplicates of the same workout" (Spec
  §Assumptions) consistent with the broader 20-workout dataset assumption referenced
  in the plan? If 20 workouts already exist, can duplication proceed? [Conflict,
  Spec §Assumptions, plan.md §Scale/Scope]

---

## Acceptance Criteria Quality

- [ ] CHK031 - Is SC-003 ("100% of exercise entries present and correct") precise enough to
  be objectively verified — specifically, does it enumerate which fields "correct" applies
  to? [Measurability, Spec §SC-003]

- [ ] CHK032 - Does SC-001 ("three or fewer interactions") define what constitutes a single
  interaction (e.g., one click = one interaction; is navigating to the list first included)?
  [Clarity, Spec §SC-001]

- [ ] CHK033 - Does SC-004 ("no observable change in the other across all exercise, set, and
  repetition fields") enumerate every field whose immutability must be verified?
  [Measurability, Spec §SC-004]

- [ ] CHK034 - Are the acceptance scenarios in User Story 3 sufficient to verify independence
  in both directions — duplicate edit doesn't change original (Scenario 1) AND original
  edit doesn't change duplicate (Scenario 2)? [Coverage, Spec §User Story 3]

- [ ] CHK035 - Is there a success criterion explicitly covering data persistence of the
  duplicate across a page refresh (complementing SC-002 which only covers appearance speed)?
  [Gap, Spec §Success Criteria]

---

## Notes

- Items marked `[Gap]` identify requirements absent from the spec that may need to be added or
  explicitly declared out-of-scope before implementation begins.
- Items marked `[Conflict]` identify apparent inconsistencies between two spec sections or
  between this spec and feature 001's artifacts.
- Check items off as resolved: `[x]`
- Add inline notes with the resolution (e.g., "gap accepted — single-user app, race condition
  impossible" or "updated data-model.md §Workout to clarify deep copy").
