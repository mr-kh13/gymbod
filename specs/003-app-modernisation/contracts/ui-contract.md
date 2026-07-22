# UI Contract: App Modernisation

## Route Tree

Defined in `src/main.tsx` using TanStack Router code-based API. `viewTransition: true` is set on
the router so every navigation is wrapped in `document.startViewTransition()`.

```
/ (root — RootLayout)
├── /plans              → PlansRoute
├── /session            → SessionRoute
├── /history            → HistoryIndexRoute
│   └── /$sessionId     → HistoryDetailRoute
└── /                   → redirect to /plans (index)
```

### Root layout (`__root.tsx`)

Renders the persistent header, primary navigation, and `<Outlet />`. Provides `PlannerContext`
and `ThemeContext` to all child routes. Applies `data-theme` to `document.documentElement`
on theme change and on initial load (synchronised with the inline `<script>` in `<head>`).

### `/plans` (PlansRoute)

Displays the workout card grid or the empty state. Conditionally renders `WorkoutEditor` inline
when the editor is open. State: `editor: WorkoutDraft | null`, `errors: ValidationError[]`,
`renamingId: string | null`.

### `/session` (SessionRoute)

Displays the active session or the post-session summary banner. If neither exists, shows the
empty state with a link to Plans.

### `/history` (HistoryIndexRoute)

Displays the history list (newest first, up to 20 entries). Each item is a `<button>` that
navigates to `/history/$sessionId`.

### `/history/$sessionId` (HistoryDetailRoute)

Reads `$sessionId` (typed as `string` by TanStack Router). Looks up the session via
`sessionDetail(state, params.sessionId)`. Shows the read-only detail or a not-found fallback.

---

## Context Interfaces

### PlannerContext

```typescript
interface PlannerContextValue {
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;
  recoveryError: StorageCorruptionError | null;
}
```

`dispatch` calls the appropriate domain function and persists via `PlannerRepository` inside
the reducer. `recoveryError` is set when `repository.load()` throws `StorageCorruptionError`
on startup; it triggers the recovery screen in the root layout.

### ThemeContext

```typescript
interface ThemeContextValue {
  preference: ThemePreference;   // 'light' | 'dark' | 'system'
  resolved: 'light' | 'dark';   // effective theme (system preference resolved)
  toggle: () => void;            // cycles light → dark → system → light
}
```

`toggle` persists the new preference to `form.planner.theme.v1` and sets `data-theme` on
`<html>`. `resolved` is derived from `preference` plus `window.matchMedia('(prefers-color-scheme: dark)').matches`.

---

## Component Props Contracts

### WorkoutCard

```typescript
interface WorkoutCardProps {
  workout: Workout;
  isRenaming: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onConfirmRename: (name: string) => void;
  onCancelRename: () => void;
}
```

### WorkoutEditor

```typescript
interface WorkoutEditorProps {
  draft: WorkoutDraft;
  errors: ValidationError[];
  onChange: (draft: WorkoutDraft) => void;
  onSave: (draft: WorkoutDraft) => void;
  onCancel: () => void;
}
```

### ExerciseRow

```typescript
interface ExerciseRowProps {
  item: WorkoutExerciseDraft;
  index: number;
  totalCount: number;
  usedIds: Set<string>;
  errors: ValidationError[];
  onChange: (index: number, item: WorkoutExerciseDraft) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
}
```

### SessionExercise (component)

```typescript
interface SessionExerciseProps {
  exercise: SessionExercise;          // from domain types
  results: SetResult[];
  onRecordSet: (exerciseId: string, setNumber: number, values: Partial<SetResult>) => void;
}
```

### SetRow

```typescript
interface SetRowProps {
  result: SetResult;
  targetReps: number;
  onChange: (values: Partial<SetResult>) => void;
}
```

`onChange` is called on every checkbox toggle or input blur; the parent flushes to state and
triggers a `RECORD_SET` dispatch.

### HistoryItem

```typescript
interface HistoryItemProps {
  item: {
    id: string;
    workoutName: string;
    finishedAt: string;
    summary: { completedSets: number; plannedSets: number };
  };
  onClick: () => void;
}
```

### ErrorSummary

```typescript
interface ErrorSummaryProps {
  errors: ValidationError[];
}
```

Renders as `role="alert"` with `tabIndex={-1}`. The parent focuses it after a failed save
attempt.

---

## Navigation Contract

All navigation uses TanStack Router's `<Link>` component or the `useNavigate` hook.
Direct `location.href` or `location.hash` manipulation is prohibited.

| From | To | Trigger |
|------|----|---------|
| Plans (after Start) | `/session` | `onStart` callback in `WorkoutCard` |
| Session (after Finish) | `/session` | stays; router re-renders with no active session |
| Session summary | `/history` | `<Link to="/history">` in summary banner |
| History list item | `/history/$sessionId` | `useNavigate` in `HistoryItem.onClick` |
| History detail | `/history` | back button using `useNavigate(-1)` |
| Nav bar links | `/plans`, `/session`, `/history` | `<Link>` |

---

## Anti-Flash Theme Script (index.html)

The following synchronous inline script is inserted in `<head>` before any stylesheet link. It
reads the stored theme preference and applies `data-theme` to `<html>` before the page renders,
preventing a flash of the wrong theme.

```html
<script>
  (function () {
    var pref = localStorage.getItem('form.planner.theme.v1');
    if (pref === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); }
    else if (pref === 'light') { document.documentElement.setAttribute('data-theme', 'light'); }
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

---

## PWA Manifest (vite.config.ts → public/manifest.json)

```json
{
  "name": "Form — Gym planner",
  "short_name": "Form",
  "description": "Local-first gym session planner",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f4f1ea",
  "theme_color": "#1f6b4f",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
