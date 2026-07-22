# Implementation Plan: Custom Exercise Management

**Branch**: `main` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-custom-exercises/spec.md`

## Summary

Users can create custom exercises when the predefined catalogue lacks the movement they need. A custom exercise has a unique name (case-insensitive, 1–50 characters) and a fixed measurement type (resistance or timed). Custom exercises appear in the exercise picker alongside predefined exercises and can be used in routines identically. Users can rename or retire custom exercises; neither action rewrites historical session snapshots or breaks existing routines. The implementation adds a `customExercises` array to `PlannerState` (schema v3), a new domain file, catalogue helpers, and an inline editor component on the Plans page. No new routes, runtime dependencies, or global state libraries are added.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 22+

**Primary Dependencies**: React 19, @tanstack/react-router 1.x, Vite 6, vite-plugin-pwa — all already in `package.json`

**Storage**: Browser `localStorage` via `createPlannerRepository`. Key: `form.planner.v1`. Schema version bumped 2 → 3 with migrate-on-read.

**Testing**: Vitest 4.x + React Testing Library 16.x + @testing-library/user-event 14.x + jsdom 29.x

**Target Platform**: Browser (PWA, offline-capable)

**Project Type**: Single-page browser application (no backend)

**Performance Goals**: No new async operations; all custom exercise logic is synchronous in-memory.

**Constraints**: No backend, no new npm dependencies, no breaking changes to existing `form.planner.v1` data, no cascading destructive deletes.

**Scale/Scope**: Single user; catalogue expected to stay under a few dozen custom exercises.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. User-Value Slices** | PASS | Spec has 5 prioritised, independently testable user stories. P1 stories (create + select) deliver a usable MVP. |
| **II. Local-First Privacy** | PASS | Custom exercises stored only in `localStorage`. No network calls. No account required. |
| **III. Accessible by Default** | PASS | `CustomExerciseEditor` uses `<label>`, `aria-invalid`, `aria-describedby`, visible focus states matching existing component patterns. Keyboard-operable rename/retire controls. |
| **IV. Test-First Delivery** | PASS | Plan mandates failing tests written before implementation for every user story (domain unit tests + RTL journey tests). |
| **V. Simplicity and Traceability** | PASS | No new routes, no new global state library, no new npm packages. Smallest change satisfying spec: one new domain file, one new component, migrations, and prop changes. Every task names concrete file paths. |
| **Product Constraints** | PASS | Single-user, no auth, no backend. No medical/social/coaching features. |

**Post-design re-check**: All principles hold. Adding `'custom'` to `ExerciseCategory` is the narrowest type change needed. Inline component avoids new route infrastructure.

## Project Structure

### Documentation (this feature)

```text
specs/004-custom-exercises/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← Phase 1 entities and contracts
├── quickstart.md        ← Phase 1 dev guide
└── tasks.md             ← Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code

```text
src/
├── domain/
│   ├── types.ts             ← MODIFIED: ExerciseCategory + custom types + PlannerState v3 + actions
│   ├── storage.ts           ← MODIFIED: SCHEMA_VERSION=3, migrateV2toV3, isPlannerState guard
│   ├── catalog.ts           ← MODIFIED: activeCatalogue, findExercise, findExerciseName
│   ├── customExercises.ts   ← NEW: validate/create/rename/retire/reactivate domain functions
│   ├── workouts.ts          ← no signature change (catalog param already parameterised)
│   └── sessions.ts          ← MODIFIED: startSession uses findExerciseName
├── context/
│   └── PlannerContext.tsx   ← MODIFIED: 4 new action cases
├── components/
│   ├── ExerciseRow.tsx      ← MODIFIED: catalogue prop replaces hardcoded EXERCISES import
│   └── CustomExerciseEditor.tsx  ← NEW: create form + list with rename/retire/reactivate
└── routes/
    └── plans.tsx            ← MODIFIED: full catalogue passed down; CustomExerciseEditor inline

tests/
├── domain/
│   ├── customExercises.test.ts  ← NEW: unit tests for all domain functions
│   └── storage.test.ts          ← EXTENDED: V2→V3 migration tests
└── journeys/
    └── customExercises.test.tsx ← NEW: RTL journey tests (create, validate, select, rename, retire)
```

**Structure Decision**: Single-project layout. Source at repo root `src/`, tests at `tests/`. Follows existing project structure exactly.

## Implementation Phases

### Phase A — Schema and Domain (write tests first)

#### A1 — Type definitions (`src/domain/types.ts`)

**Changes**:
```typescript
// Extend ExerciseCategory
export type ExerciseCategory = 'upper' | 'lower' | 'core' | 'custom';

// New types
export type CustomExerciseStatus = 'active' | 'retired';

export interface CustomExercise {
  id: string;
  name: string;
  measurement: ExerciseMeasurement;
  status: CustomExerciseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomExerciseDraft {
  name: string;
  measurement: ExerciseMeasurement;
}

// Updated PlannerState
export interface PlannerState {
  schemaVersion: 3;              // bumped
  workouts: Workout[];
  activeSession: Session | null;
  history: Session[];
  customExercises: CustomExercise[];  // new
}

// New PlannerAction variants appended to the union:
// | { type: 'CREATE_CUSTOM_EXERCISE'; draft: CustomExerciseDraft }
// | { type: 'RENAME_CUSTOM_EXERCISE'; id: string; name: string }
// | { type: 'RETIRE_CUSTOM_EXERCISE'; id: string }
// | { type: 'REACTIVATE_CUSTOM_EXERCISE'; id: string }
```

**Tests**: Type-level only (compilation). TypeScript strict mode enforces correctness.

---

#### A2 — Storage migration (`src/domain/storage.ts`)

**Write failing tests first** in `tests/domain/storage.test.ts`:
- V2→V3: state with `schemaVersion: 2` and no `customExercises` field → output has `schemaVersion: 3` and `customExercises: []`
- V1 state migrates through V1→V2→V3 chain
- V3 state round-trips through `load()` without migration
- Unknown schema version → `StorageCorruptionError`
- `createDefaultState()` returns `schemaVersion: 3` with `customExercises: []`

**Changes**:
```typescript
export const SCHEMA_VERSION = 3 as const;

interface PlannerStateV2 {
  schemaVersion: 2;
  workouts: /* same as PlannerState */ ...;
  activeSession: ... | null;
  history: ...;
}

export function migrateV2toV3(v2: PlannerStateV2): PlannerState {
  return { ...v2, schemaVersion: 3, customExercises: [] };
}

export function createDefaultState(): PlannerState {
  return { schemaVersion: 3, workouts: [], activeSession: null, history: [], customExercises: [] };
}

// isPlannerState: checks schemaVersion === 3 AND Array.isArray(customExercises)

// load() chain:
//   isPlannerState(parsed) === true          → return parsed
//   parsed.schemaVersion === 2               → migrateV2toV3(parsed) → return
//   parsed.schemaVersion === 1               → migrateV1toV2 → migrateV2toV3 → return
//   else                                     → throw StorageCorruptionError

// save(): type annotation updated to PlannerState (v3), guard updated accordingly
```

---

#### A3 — Catalogue helpers (`src/domain/catalog.ts`)

**Write failing tests first** in `tests/domain/catalog.test.ts` (new file):
- `activeCatalogue([])` → 12 predefined exercises
- `activeCatalogue([active custom])` → 13 exercises; last has `category: 'custom'`
- `activeCatalogue([retired custom])` → 12 exercises (retired excluded)
- `findExercise('bench-press', [])` → predefined exercise object
- `findExercise(customId, [customExercise])` → Exercise with `category: 'custom'`
- `findExercise('nonexistent', [])` → `undefined`
- `findExerciseName(customId, [customExercise])` → exercise name string
- `findExerciseName('nonexistent', [])` → `'Unknown exercise'`

**Additions to `src/domain/catalog.ts`**:
```typescript
import type { CustomExercise } from './types';

export function activeCatalogue(customExercises: CustomExercise[]): readonly Exercise[] {
  const active = customExercises
    .filter((e) => e.status === 'active')
    .map((e): Exercise => ({ id: e.id, name: e.name, category: 'custom', measurement: e.measurement }));
  return [...EXERCISES, ...active];
}

export function findExercise(id: string, customExercises: CustomExercise[]): Exercise | undefined {
  const predefined = EXERCISES.find((e) => e.id === id);
  if (predefined) return predefined;
  const custom = customExercises.find((e) => e.id === id);
  return custom
    ? { id: custom.id, name: custom.name, category: 'custom', measurement: custom.measurement }
    : undefined;
}

export function findExerciseName(id: string, customExercises: CustomExercise[]): string {
  return findExercise(id, customExercises)?.name ?? 'Unknown exercise';
}
```

---

#### A4 — Custom exercise domain (`src/domain/customExercises.ts`)

**Write failing tests first** in `tests/domain/customExercises.test.ts`:

Validation:
- Empty name → `{ field: 'name', message: 'Enter an exercise name.' }`
- Whitespace-only name → same error
- Name > 50 chars → `{ field: 'name', message: 'Use 50 characters or fewer.' }`
- Name matching predefined (case-insensitive) → `{ field: 'name', message: 'An exercise with this name already exists.' }`
- Name matching custom (case-insensitive) → same error
- Rename to own current name (excludeId set) → no duplicate error

Create:
- Valid draft → new `CustomExercise` appended to `state.customExercises` with `status: 'active'`
- Invalid draft → state unchanged, errors returned
- `options.id` overrides generated ID (deterministic in tests)

Rename:
- Valid new name → `name` + `updatedAt` updated; `createdAt` + `measurement` + `id` unchanged
- Duplicate name → errors returned, state unchanged
- `workouts`, `activeSession`, `history` are **not** touched

Retire / Reactivate:
- `retireCustomExercise` → `status: 'retired'`, `updatedAt` updated
- `reactivateCustomExercise` → `status: 'active'`, `updatedAt` updated
- Both throw on unknown ID

**New file `src/domain/customExercises.ts`**:
```typescript
import type {
  PlannerState, CustomExercise, CustomExerciseDraft, ValidationError, Exercise,
} from './types';
import { EXERCISES } from './catalog';

const makeId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function validateCustomExercise(
  draft: CustomExerciseDraft,
  allExercises: readonly Exercise[],
  currentCustom: readonly CustomExercise[],
  excludeId?: string,
): ValidationError[]

export function createCustomExercise(
  state: PlannerState,
  draft: CustomExerciseDraft,
  options: { id?: string; now?: string } = {},
): { state: PlannerState; exercise: CustomExercise | null; errors: ValidationError[] }

export function renameCustomExercise(
  state: PlannerState,
  id: string,
  name: string,
  options: { now?: string } = {},
): { state: PlannerState; exercise: CustomExercise | null; errors: ValidationError[] }

export function retireCustomExercise(
  state: PlannerState,
  id: string,
  options: { now?: string } = {},
): PlannerState

export function reactivateCustomExercise(
  state: PlannerState,
  id: string,
  options: { now?: string } = {},
): PlannerState
```

---

#### A5 — Session name lookup (`src/domain/sessions.ts`)

**Write failing test first** in `tests/domain/sessions.test.ts`:
- `startSession` on a workout containing a custom exercise ID → `plannedExercises[n].exerciseName` equals the custom exercise name from `state.customExercises`

**Change** (targeted one-line swap in `startSession`):
```typescript
// Import change: add findExerciseName from './catalog'; remove exerciseName from './workouts'

// Before:
exerciseName: exerciseName(item.exerciseId),

// After:
exerciseName: findExerciseName(item.exerciseId, state.customExercises),
```

---

### Phase B — Context and UI (write tests first)

#### B1 — Context actions (`src/context/PlannerContext.tsx`)

**Changes**: Import custom exercise domain functions; add 4 cases to `plannerReducer`:
```typescript
case 'CREATE_CUSTOM_EXERCISE':
  return createCustomExercise(state, action.draft).state;
case 'RENAME_CUSTOM_EXERCISE':
  return renameCustomExercise(state, action.id, action.name).state;
case 'RETIRE_CUSTOM_EXERCISE':
  return retireCustomExercise(state, action.id);
case 'REACTIVATE_CUSTOM_EXERCISE':
  return reactivateCustomExercise(state, action.id);
```
Validation errors from create/rename are surfaced via component-level state, not via dispatch. The reducer silently ignores validation failures (same pattern as `CREATE_WORKOUT`).

---

#### B2 — Exercise picker (`src/components/ExerciseRow.tsx`)

**Changes**:
- Add `catalogue: readonly Exercise[]` to `ExerciseRowProps`
- Remove direct `EXERCISES` import
- Replace all `EXERCISES` references with `catalogue`
- In `handleExerciseChange`: look up new/old exercise from `catalogue`
- For retired custom exercise currently selected: inject a disabled `<option>` with label `{name} [retired]` when `item.exerciseId` is absent from `catalogue`

`WorkoutEditor` must also accept `catalogue: readonly Exercise[]` and pass it to each `ExerciseRow`.

---

#### B3 — CustomExerciseEditor component (`src/components/CustomExerciseEditor.tsx`)

**Write failing journey tests first** (see Phase C) before implementing.

**Props**:
```typescript
interface CustomExerciseEditorProps {
  customExercises: CustomExercise[];
  onAction: React.Dispatch<PlannerAction>;
}
```

**Renders**:
1. Create form with name `<input>` and measurement `<fieldset>` of two radio inputs; "Add exercise" submit button; `<ErrorSummary>` for validation errors
2. Custom exercise list; empty state text when none exist
3. Active exercises: name/measurement display, "Rename" and "Retire" buttons
4. Retired exercises: name/measurement with "[retired]" badge, "Reactivate" button
5. Inline rename: replaces display with a form (`<input>` pre-filled, "Save" / "Cancel" buttons); validation errors shown inline

**Accessibility requirements**:
- Name input: `aria-label="Exercise name"`, `aria-invalid` on error, `aria-describedby` for error message
- Measurement radios: `<fieldset>` with `<legend>Measurement type</legend>`
- Retire button: `aria-label="Retire {name}"`; Reactivate button: `aria-label="Reactivate {name}"`
- All controls keyboard-reachable with visible focus ring (inherits from `styles.css`)

---

#### B4 — Plans route integration (`src/routes/plans.tsx`)

**Changes**:
```typescript
import { activeCatalogue } from '../domain/catalog';
import { CustomExerciseEditor } from '../components/CustomExerciseEditor';

function PlansRoute() {
  const { state, dispatch } = usePlanner();
  const catalogue = activeCatalogue(state.customExercises);
  const [showExerciseEditor, setShowExerciseEditor] = useState(false);
  // ...

  // Update newDraft() to use catalogue[0].id
  // Update validateWorkout(draft, catalogue) calls
  // Pass catalogue to WorkoutEditor

  // In JSX, render toggle button + conditional CustomExerciseEditor
}
```

---

### Phase C — Journey Tests

All tests in `tests/journeys/customExercises.test.tsx` use `renderAt('/plans', repo)` from the existing `helpers.tsx`.

| # | Story | Test description |
|---|-------|-----------------|
| C1 | Create | Open exercise manager → fill name "Cable Face Pull" → select Resistance → submit → exercise appears in list |
| C2 | Empty name validation | Submit with empty name field → error "Enter an exercise name." shown; exercise not created |
| C3 | Whitespace name validation | Submit with "   " → same error |
| C4 | Duplicate predefined | Submit "Bench press" → error "An exercise with this name already exists." |
| C5 | Duplicate custom | Create "MyMove" → create "mymove" → duplicate error |
| C6 | Select in routine | Create custom exercise → open new workout editor → custom exercise in picker → select it → save workout → workout has custom exercise |
| C7 | Rename | Rename existing custom exercise → new name in list; old name gone |
| C8 | Rename duplicate | Rename to predefined name → error; name unchanged |
| C9 | Retire | Retire exercise → disappears from active list; appears as [retired]; not selectable in new routine picker |
| C10 | Retired in existing routine | Create routine with custom exercise; retire exercise; edit routine → picker shows retired exercise with [retired] label |
| C11 | Reactivate | Reactivate retired exercise → returns to active list; selectable in routine picker again |
| C12 | Predefined read-only | "Bench press" item in custom exercise section has no rename/retire controls |

---

## Complexity Tracking

No constitution violations. No justified exceptions required.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| `ExerciseRow` retaining direct `EXERCISES` import after refactor | TypeScript unused-import check catches this at lint time |
| `startSession` returning `'Unknown exercise'` for a custom exercise ID | `findExerciseName` has an explicit `'Unknown exercise'` fallback matching existing behaviour |
| V2 localStorage data failing after schema bump | `migrateV2toV3` tested in `storage.test.ts`; `load()` chain handles it before app init |
| Retired custom exercise losing its display label in ExerciseRow | ExerciseRow injects a disabled extra option for the current `exerciseId` when absent from `activeCatalogue` |
| `newDraft()` using `catalogue[0].id` when catalogue is empty | Impossible: predefined `EXERCISES` always has 12 entries; `activeCatalogue` always starts with them |
