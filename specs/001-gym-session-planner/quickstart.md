# Quickstart and Acceptance Walkthrough

## Run locally

1. From the project root, start a static server:
   `python -m http.server 4173`
2. Open `http://127.0.0.1:4173`.
3. Run automated tests with the bundled Node executable or any Node 22+ installation:
   `node --test`

## P1: Plan a workout

1. Open Plans and create `Push day`.
2. Add Bench press (3 × 8), Overhead press (3 × 10), and Plank (3 × 30).
3. Move Plank above Overhead press, save, and verify the card shows 3 exercises and 9 sets.
4. Attempt an invalid edit and confirm all problems appear without valid values disappearing.

## P2: Complete a session

1. Start `Push day` and complete two sets, entering weight and actual repetitions.
2. Refresh and verify the active session retains both results.
3. Finish partially and verify the summary shows 2 of 9 completed sets.

## P3: Review history

1. Open History and verify the latest session is first.
2. Inspect its immutable exercise results.
3. Repeat the walkthrough using keyboard only at 375 px and 1440 px viewport widths.

## Recovery

Inject malformed stored data during development, reload, and verify that the application explains
the problem and only clears data after explicit confirmation.
