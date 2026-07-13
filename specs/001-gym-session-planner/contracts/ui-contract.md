# UI Contract: Gym Session Planner

## Global Navigation

The application exposes three views: **Plans**, **Active session**, and **History**. Navigation uses
real buttons or links, communicates the current view, remains keyboard operable, and never hides
focus. A polite live region announces saves, errors, session transitions, and data recovery results.

## Plans View

- Shows an explanatory empty state when no workouts exist.
- Lists saved workouts with name, exercise count, total planned sets, and Start/Edit/Delete actions.
- The workout editor exposes name plus an ordered list of exercise rows.
- Each row exposes exercise, set target, repetition target, reorder, and remove controls.
- Saving reports every invalid field together and moves focus to an error summary.
- Starting is blocked when another session is active and routes the user to that session.

## Active Session View

- With no active session, explains how to start one and links back to Plans.
- Shows workout name, elapsed context, planned exercises, and individual planned sets.
- Each set exposes completion, optional kilograms, and optional actual repetitions.
- Recording a set persists immediately and produces a concise status announcement.
- Finish is enabled after at least one set is completed; partial completion is explicitly summarized.
- Discard requires confirmation and never creates history.

## History View

- Shows at most 20 completed sessions, newest first.
- Each row shows local date, workout name, and completed/planned set ratio.
- Details expose immutable exercise and set results.
- The empty state explains how history is created and links to Plans.

## Responsive and Accessibility Contract

- Core content fits 375–1440 px without horizontal page scrolling.
- Touch targets are at least 44 by 44 CSS pixels where space permits.
- Form controls have programmatic labels; errors are associated with their fields.
- Heading hierarchy and landmarks are meaningful; color is not the only state indicator.
- Dialog-like confirmations use the browser's accessible confirmation mechanism for this version.
