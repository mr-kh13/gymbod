# gym-planner-speckit-demo Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-07-22

## Active Technologies
- TypeScript 5.x on Node.js 22+ for build and tests; ES2022 as the browser + React 19, @tanstack/react-router 1.x, Vite 6, vite-plugin-pwa, (main)
- Browser localStorage behind the existing versioned `PlannerRepository` adapter; (main)
- TypeScript 5.x (strict), React 19, Node 22+. + `@tanstack/react-router` 1.x, `react` 19, `react-dom` 19 — all already pinned in `package.json`. No new runtime dependencies added. (main)
- Browser `localStorage` via the existing versioned `createPlannerRepository`. Schema version bumped 1 → 2 with migrate-on-read logic inside `load()`. Storage key `form.planner.v1` is unchanged; the `schemaVersion` field on the stored object is the migration sentinel. (main)
- TypeScript 5.x (strict), Node.js 22+ + React 19, @tanstack/react-router 1.x, Vite 6, vite-plugin-pwa — all already in `package.json` (main)
- Browser `localStorage` via `createPlannerRepository`. Key: `form.planner.v1`. Schema version bumped 2 → 3 with migrate-on-read. (main)

- HTML5, CSS3, JavaScript ES2022 on Node.js 22+ for tests + Browser platform APIs only; no runtime packages (main)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

HTML5, CSS3, JavaScript ES2022 on Node.js 22+ for tests: Follow standard conventions

## Recent Changes
- main: Added TypeScript 5.x (strict), Node.js 22+ + React 19, @tanstack/react-router 1.x, Vite 6, vite-plugin-pwa — all already in `package.json`
- main: Added TypeScript 5.x (strict), React 19, Node 22+. + `@tanstack/react-router` 1.x, `react` 19, `react-dom` 19 — all already pinned in `package.json`. No new runtime dependencies added.
- main: Added TypeScript 5.x on Node.js 22+ for build and tests; ES2022 as the browser + React 19, @tanstack/react-router 1.x, Vite 6, vite-plugin-pwa,


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
