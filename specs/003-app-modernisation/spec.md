# Feature Specification: App Modernisation

**Feature Branch**: `003-app-modernisation`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "modernise the app."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - System-Aware Dark Mode (Priority: P1)

As a user who works out in low-light environments or uses their device in dark mode, I want the planner to adopt my system display preference automatically, with the option to override it manually, so that the app is comfortable to read at any time of day without straining my eyes.

**Why this priority**: Dark mode is the single most visible modernisation signal users expect from any app today. It is independently deliverable with no dependency on other stories and immediately improves comfort for a large share of users.

**Independent Test**: A user with their device set to dark mode opens the planner and sees a dark-themed interface without changing any setting. A user who prefers light mode while their system is dark can toggle the theme and the preference persists after a page refresh.

**Acceptance Scenarios**:

1. **Given** a device with a dark system theme, **When** the user opens the planner, **Then** the planner displays a dark colour scheme without any manual adjustment.
2. **Given** the planner has adopted the system theme, **When** the user toggles the theme preference, **Then** the interface switches to the opposite theme and stores the preference for future visits.
3. **Given** a stored theme preference, **When** the user refreshes the page, **Then** the stored preference is applied instantly, with no flash of the wrong theme.
4. **Given** any active theme, **When** the user interacts with any element, **Then** text contrast, focus indicators, and interactive control colours all meet the same readability standard as in light mode.

---

### User Story 2 - Installable App Experience (Priority: P2)

As a user who visits the planner regularly, I want to install it on my home screen so that I can launch it directly like a native app without opening a browser tab each time.

**Why this priority**: PWA installability is a low-effort, high-perceived-quality modernisation that makes the planner feel like a first-class app on any device. It requires no network dependency after installation, reinforcing the local-first privacy principle.

**Independent Test**: On a supported browser a user sees an install prompt or can trigger installation through the browser menu. After installation the planner launches full-screen and retains all existing data and theme preferences.

**Acceptance Scenarios**:

1. **Given** a supported browser that has not yet installed the app, **When** the user visits the planner, **Then** the browser's native install affordance becomes available (install prompt or Add to Home Screen menu item).
2. **Given** an installed planner, **When** the user opens it from the home screen or app launcher, **Then** it loads without browser chrome in a standalone or fullscreen display and all data is intact.
3. **Given** an installed planner with no network connection, **When** the user opens it, **Then** the full planning and session experience is available without any degradation or error message about connectivity.
4. **Given** an installed planner, **When** the user views the app icon on their device, **Then** the icon and app name are recognisable and appropriately sized for the platform.

---

### User Story 3 - Smooth Transitions and Micro-Animations (Priority: P3)

As a user navigating between Plans, Session, and History, I want view changes and state updates to feel smooth and intentional so that the app communicates what is happening rather than snapping between static screens.

**Why this priority**: Motion polish is the finishing touch of modernisation; it improves perceived quality and communicates state changes without requiring extra text. It is non-blocking for all other stories and enhances rather than changes any existing behaviour.

**Independent Test**: A user can navigate the full Plans → Session → History flow and observe that every view transition, card action, and save confirmation includes a brief, purposeful animation. The app remains fully functional with animations disabled by the operating system's reduced-motion preference.

**Acceptance Scenarios**:

1. **Given** a user navigating between Plans, Session, and History, **When** the active view changes, **Then** the outgoing content fades or slides out and the incoming content fades or slides in with a consistent duration of no more than 250 ms.
2. **Given** a user saving a workout or completing a set, **When** the action completes, **Then** the affected element briefly highlights or scales to confirm the change before settling.
3. **Given** an operating system with reduced-motion preference enabled, **When** any animated transition would normally play, **Then** all motion is replaced by an immediate, cut-based switch with no visual flicker.
4. **Given** a low-end device, **When** animations are running, **Then** interactions remain responsive with no observable delay between user input and feedback.

---

### Edge Cases

- If no system preference for dark or light is detectable (e.g., older browsers), the planner defaults to light mode.
- If the stored theme preference becomes unreadable, the planner silently falls back to the system preference without showing an error.
- On browsers that do not support PWA installation, the install experience is not shown; no error or broken UI appears.
- If a service worker update is available, the user is not interrupted mid-session; the update applies on the next launch.
- If the device does not support the Reduced Motion media query, all animations play at their standard duration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The planner MUST detect the user's system colour-scheme preference and apply the matching light or dark visual theme without any user action.
- **FR-002**: The planner MUST provide a persistent theme toggle that overrides the system preference, stores the choice locally, and applies it immediately on every subsequent visit.
- **FR-003**: The planner MUST display correctly and maintain WCAG 2.2 AA contrast ratios in both light and dark themes across all views and interactive states.
- **FR-004**: The planner MUST supply a valid web app manifest that includes a name, short name, display mode, theme colour, background colour, and at least one icon in an appropriate size for device home screens.
- **FR-005**: The planner MUST register a service worker that caches all assets required for the full planning and session experience, enabling offline use after the first visit.
- **FR-006**: The planner MUST apply a consistent transition when switching between the Plans, Session, and History views, completing within 250 ms.
- **FR-007**: The planner MUST animate completion confirmations (set check, workout save) in a way that draws the user's eye to the changed element without blocking further interaction.
- **FR-008**: The planner MUST disable all CSS transitions and animations when the operating system's reduced-motion preference is active, replacing them with immediate visual changes.
- **FR-009**: The planner MUST continue to meet all existing functional requirements from FR-001 through FR-013 of the 001-gym-session-planner specification after modernisation changes are applied.

### Key Entities

- **Theme Preference**: A stored user choice (light, dark, or system) that overrides or mirrors the detected system colour scheme.
- **App Manifest**: A structured descriptor that gives the browser enough information to present the planner as an installable, standalone application.
- **Service Worker**: A background agent that intercepts network requests and serves cached assets, enabling offline operation and fast repeat loads.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user whose device is set to dark mode sees the dark theme immediately on first load, with no flash of light content.
- **SC-002**: A user can install the planner to their device home screen in three steps or fewer from the moment they decide to install.
- **SC-003**: After installation the planner opens and reaches its interactive state within two seconds on a mid-range mobile device with no network connection.
- **SC-004**: Every view transition completes in 250 ms or less on a typical modern device; no transition blocks subsequent user input.
- **SC-005**: All text and interactive controls in both light and dark themes achieve a contrast ratio of at least 4.5:1 against their backgrounds as verified by automated tooling.
- **SC-006**: With reduced-motion preference active, all primary user journeys (create workout, complete session, review history) can be completed with zero animated transitions or visual flicker.
- **SC-007**: The full set of existing automated tests pass without modification after all modernisation changes are applied.

## Assumptions

- The planner's existing technology stack (plain HTML, CSS, and browser JavaScript with no build step or runtime dependencies) is retained; no new runtime libraries are added.
- A web app manifest and service worker are added as new static files alongside the existing project structure.
- Icons for the app manifest will be created as simple, on-brand SVG or PNG assets; professional icon design is out of scope.
- Caching strategy for the service worker uses a cache-first approach for all static assets; no dynamic or network-first caching is required as the app has no backend.
- The dark theme reuses the existing colour token system and introduces dark-mode equivalents for each token; it does not require a design-system overhaul.
- View transitions apply only to the three top-level navigation views (Plans, Session, History); in-view animations such as editor open/close are included but modal-style overlays are out of scope.
- Cross-browser PWA behaviour varies; the spec targets Chromium-based browsers and Firefox for desktop and mobile, and Safari on iOS as a best-effort target for home-screen addition.
