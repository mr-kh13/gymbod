# UI Contract: Duplicate Workout

This document extends `specs/001-gym-session-planner/contracts/ui-contract.md`. All existing
contracts remain in force. Only additions and modifications are described here.

## Plans View — Additions

### Workout Card Actions

Each workout card gains a **Duplicate** button alongside the existing Start / Edit / Delete
controls. The button:

- Carries `data-action="duplicate-workout"` and `data-id="{workoutId}"`.
- Is always enabled (duplication is available regardless of active-session state).
- Is keyboard focusable and has a visible focus indicator consistent with the existing buttons.
- Is announced by screen readers with a label that identifies the workout
  (e.g., `aria-label="Duplicate Push day"`).

### Inline Rename State

When a workout is in the **renaming** state (immediately after duplication, before the user
confirms or cancels), its card renders differently:

- The workout name heading is replaced by a text input:
  - Pre-filled with the current (default) name.
  - Pre-focused so the user can type immediately.
  - Has `maxlength="50"` and `aria-label="Workout name"`.
  - Carries `data-rename-input` and `data-id="{workoutId}"` for targeted querying.
- Two inline action buttons appear:
  - **Save name** (`data-action="confirm-rename"`, `data-id="{workoutId}"`) — confirms the
    rename; validates non-blank and ≤ 50 characters; announces the error via the live region
    if invalid and keeps the input focused.
  - **Keep default** (`data-action="cancel-rename"`, `data-id="{workoutId}"`) — dismisses the
    rename field and keeps the default name; no persistence change.
- The Start / Edit / Delete / Duplicate actions for this card are hidden while renaming to
  prevent accidental navigation away from the focused input.
- Only one card can be in the renaming state at a time. Navigating to another view
  (via the hash-based router) exits renaming and retains the default name.

## Responsive and Accessibility — Additions

- The inline rename input meets the existing touch-target and contrast requirements.
- Confirm and cancel buttons expose visible labels (not icon-only) so their purpose is clear
  to all users.
- The live region announces "Workout duplicated." after duplication and "Workout renamed." after
  a successful rename.
