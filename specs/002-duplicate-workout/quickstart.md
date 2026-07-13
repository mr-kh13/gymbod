# Quickstart and Acceptance Walkthrough: Duplicate Workout

## Run locally

From the project root, start a static server and run tests:

```
python -m http.server 4173   # then open http://127.0.0.1:4173
node --test                  # run all automated tests
```

## P1: Duplicate a saved workout

1. Open Plans and ensure at least one workout exists (create one if needed).
2. Locate the workout card and click **Duplicate**.
3. Verify a new card immediately appears in the list named `"Copy of [Original Name]"` with
   the same exercises, sets, and repetitions as the original.
4. Open the original card (Edit) and confirm it is unchanged.
5. Duplicate the same workout a second time and verify the second copy is named
   `"Copy of [Original Name] (2)"` (or the appropriate suffix to remain unique).

## P2: Rename the duplicate immediately

1. Click **Duplicate** on any workout.
2. Verify the new card's name field is active and pre-filled with the default name.
3. Clear the field and attempt to confirm with an empty name; verify the error is announced
   and the field retains focus.
4. Type a new name (e.g., `"Heavy push day"`) and click **Save name**.
5. Verify the card now shows `"Heavy push day"` and the original is still unchanged.
6. Duplicate again, then click **Keep default** without typing; verify the default name is
   kept and no error is shown.

## P3: Edit the duplicate independently

1. Create `"Push day"` with Bench press (3 × 8) and Overhead press (3 × 10).
2. Duplicate it to produce `"Copy of Push day"`.
3. Edit `"Copy of Push day"`: change Bench press to 4 × 6 and save.
4. Open `"Push day"` and confirm it still shows 3 × 8 for Bench press.
5. Delete `"Push day"` and confirm `"Copy of Push day"` remains in the list and can be
   started for a new session.

## Keyboard acceptance

Repeat the P1 walkthrough using keyboard only (Tab / Enter / Space) at both 375 px and 1440 px
viewport widths. Verify the Duplicate button is reachable via Tab, the inline rename input
receives focus automatically, and Confirm / Cancel are operable without a pointer.

## Automated test coverage

```
node --test                  # domain.test.js and journeys.test.js cover all three stories
```

New tests added for this feature verify:
- `duplicateWorkout` produces an independent copy with the correct default name.
- Collision avoidance generates unique suffixed names.
- Truncation enforces the 50-character limit.
- Modifying the duplicate leaves the original unchanged.
- Deleting the original leaves the duplicate intact.
