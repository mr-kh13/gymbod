# Quickstart and Acceptance Walkthrough

## Prerequisites

- Node.js 22 or later
- npm 10 or later

## Set up and run locally

```bash
# Install dependencies (first time only)
npm install

# Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in a browser.

```bash
# Run automated tests (Vitest in watch mode during development)
npm test

# Run tests once (CI mode)
npm run test:run

# Production build (outputs to dist/)
npm run build

# Preview the production build locally (required to test PWA / service worker)
npm run preview
```

> **PWA note**: The service worker is only registered in the production build. To test offline
> capability and the install prompt, run `npm run build && npm run preview`, then open
> `http://localhost:4173` in Chrome or Firefox and use DevTools → Application → Service Workers.

## P1: Dark mode (system-aware with manual toggle)

1. In your OS, set the display preference to Dark.
2. Open the app — the planner should appear in dark colours immediately with no visible flash.
3. Click the theme toggle button in the header — the app switches to light mode.
4. Refresh the page — the light-mode preference persists.
5. Toggle back to "system" — the OS dark preference takes effect again.
6. Set OS preference to Light — the app follows.
7. Verify contrast by inspecting any text element in DevTools; the contrast ratio should be at
   least 4.5:1 against its background in both themes.

## P2: PWA installability and offline use

1. Run `npm run build && npm run preview`.
2. Open `http://localhost:4173` in Chrome.
3. Wait a few seconds for the service worker to activate (DevTools → Application shows
   "Activated and running").
4. Open DevTools → Network → set to Offline.
5. Reload the page — the app loads fully from cache.
6. Create a workout and complete a session to confirm all interactive features work offline.
7. Close the Offline throttle and navigate normally to confirm online behaviour is unchanged.
8. In Chrome on Android or the desktop install prompt (address bar icon), install the app to the
   home screen / app shelf and verify it opens without browser chrome.

## P3: Smooth transitions and micro-animations

1. Navigate between Plans, Session, and History using the nav bar — each transition should
   fade / slide in under 250 ms.
2. Save a workout — the card should briefly highlight or scale to confirm the save.
3. Check a set complete — the set row should briefly pulse.
4. In OS settings, enable "Reduce Motion" (or in Chrome DevTools → Rendering → Emulate CSS media
   feature `prefers-reduced-motion: reduce`).
5. Navigate between views — transitions should be instant (no fade or slide).
6. Complete a set — no pulse animation should play.

## Existing journeys (regression check)

Run through the original P1–P3 acceptance steps from `specs/001-gym-session-planner/quickstart.md`
to confirm no regression after the React migration:

- Create a three-exercise workout, edit it, and duplicate it.
- Start the workout, record sets with weight and reps, refresh and verify persistence.
- Finish the session and inspect the history detail.
- Test keyboard-only navigation at 375 px and 1440 px viewport widths.
- Inject malformed data into `form.planner.v1` in localStorage, reload, and confirm the recovery
  screen appears and resets only after explicit confirmation.
