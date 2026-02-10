# FIT AI Analyzer

Web-based FIT file viewer and AI running analysis platform. Parse FIT files client-side, extract key metrics, and (in later phases) provide AI-powered insights to help runners understand performance and progress toward their goals.

Inspired by: https://runalyze.com/tool/fit-viewer and lack of paid Strava subscription
Code and documentation written by: GPT-5.1

## Project Status

This repo is being implemented in phases as described in docs/implementation-plan.md.

Currently implemented (high level):
- Phase 0: Project skeleton, Next.js + TypeScript + sqlite wiring, core domain types, basic tests.
- Phase 1: Client-side FIT parsing via Web Worker and @garmin/fitsdk, debug upload/inspect page, ParsedSession normalization and basic debug analysis.
- Phase 2: Deterministic metrics engine (pace, cadence, splits, consistency) as pure functions with tests.
- Phase 3: Map visualization using Leaflet (route polyline, start/finish markers, bounds fitting, GPS-missing fallback).
- Phase 4: Single-session UI (map + charts + splits + summary) using in-memory ParsedSession data.
- Phase 5: Auth via NextAuth + Google, protected app routes, header auth control.
- Phase 6: User profile onboarding/editing with sqlite persistence and validation.
- Phase 7: Session persistence & per-user history (list, detail, delete), reusing deterministic metrics and visualization components.

Later phases (goals, AI analysis, UX hardening) are sketched in docs/implementation-plan.md but may not be fully implemented yet.

See docs/implementation-plan.md for detailed phase-by-phase goals and constraints.

## Demo link
[Video](https://drive.google.com/file/d/1S9PrwejMsJYtLvvZXW7xGfQLGP0gv-yn/view?usp=sharing)

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm (bundled with Node)

This project uses:
- Next.js (App Router) + React + TypeScript
- sqlite (via better-sqlite3)
- NextAuth (Google OAuth)
- Leaflet + react-leaflet for maps
- uPlot for charts
- Vitest for tests

## Installation

Clone the repo and install dependencies:

```bash
npm install
```

## Environment Setup

Create an .env.local file in the project root. At minimum you will need:

- Database path (sqlite file)
- NextAuth/Next.js config
- Google OAuth credentials

A typical minimal .env.local for local development might look like:

```bash
DATABASE_URL=file:./data/main.sqlite
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=some-long-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Environment variables are validated via zod helpers under src/lib/validation.

## Database

The app uses a file-based sqlite DB stored under data/ (e.g. data/main.sqlite plus WAL/SHM files).

Schema is defined in:
- src/db/schema/init.ts

Queries live in:
- src/db/queries/profile.ts
- src/db/queries/session.ts
`
Ensure the data/ directory exists (it is already in the repo).

To enable persistent storage in local/dev, create an empty main.sqlite file in the data directory and let the app manage it:

```bash
mkdir -p data
touch data/main.sqlite
```

Do not write to main.sqlite directly; the application (via the schema and query helpers) is responsible for creating tables and performing all reads/writes. Migration/initialization is handled by the schema code at runtime.

## Running the App in Dev

Start the dev server:

```bash
npm run dev
```

By default this runs Next.js on http://localhost:3000.

Key routes in the current implementation:

- Public / auth
  - / (landing/home)
  - /(auth)/login – Google sign-in flow (NextAuth)
- App (authenticated)
  - /(app)/sessions – list of stored sessions for current user
  - /(app)/sessions/[id] – detail view (map + charts + splits + metrics) for a stored session
  - /(app)/profile – running profile questionnaire (background, PBs, lifestyle)
  - /session/upload – upload a FIT file, parse it client-side, and view single-session analysis (read-only, with optional save when authenticated)
- Debug / dev-only helpers
  - /debug/fit-upload – raw FIT upload + ParsedSession JSON preview and debug checks
  - /session/debug – additional debug view for sessions


## Testing

This project uses Vitest.

Run the full test suite:

```bash
npm test
```

By default this runs vitest once in non-watch mode (see package.json: "test": "vitest run").

Test files live under:
- tests/analysis – deterministic metrics engine tests
- tests/fit – FIT parsing, normalization, debug analysis tests
- other top-level tests (e.g. smoke.test.ts, validation.profile.test.ts)

When adding or updating tests, refer to .github/instructions/testing.instructions.md for guidelines (AAA pattern, focused tests, mocking external deps, etc.).

## Current Functionality (MVP Scope)

According to the implementation plan and current codebase, the app supports:

- FIT File Handling
  - Upload .fit files via /session/upload (not .fit files are validated and reported back to the user)
  - Client-side parsing in a Web Worker using @garmin/fitsdk (no raw FIT leaves the browser)
  - Normalization into a ParsedSession (records + summary) with basic de-duplication and speed derivation
  - Debug analysis checks (record count, timestamp monotonicity, GPS presence)

- Deterministic Metrics Engine
  - Total distance and duration
  - Average pace and cadence
  - Per-km splits (pace & cadence)
  - Pace and cadence variance
  - First-half vs second-half pace comparison
  - Simple stop/pause detection and consistency scores

- Map & Geospatial Visualization
  - Leaflet-based route map component (src/components/maps/RouteMap.tsx)
  - Route polyline from GPS track with start/finish markers
  - Automatic bounds fitting
  - Graceful handling when GPS data is missing (fallback messaging)

- Charts & Session UI
  - Pace vs distance chart (src/components/charts/PaceChart.tsx)
  - Cadence vs distance chart (src/components/charts/CadenceChart.tsx)
  - Splits table (src/components/charts/SplitsTable.tsx)
  - Session summary panel with key metrics and a short "data limitations" note (src/components/ui/SessionSummaryPanel.tsx)
  - Single-session upload/detail page that composes map, charts, splits, and summary in one view

- Auth & Accounts
  - NextAuth with Google OAuth under src/app/api/auth/[...nextauth]/route.ts
  - JWT-based sessions (no DB-backed session table)
  - Route grouping into (auth) and (app) with protected app views
  - Header auth control in src/components/ui/HeaderAuthControl.tsx showing user info and sign-in/out actions

- User Profile & Onboarding
  - Profile form at /(app)/profile capturing running background, PBs, lifestyle, and stress level
  - Validation via src/lib/validation/profile.ts using Zod
  - Profile persistence in sqlite via src/db/schema and src/db/queries/profile.ts
  - Derived "analytics readiness" flag indicating whether profile is sufficient for later analytics

- Session Persistence & History
  - Sqlite sessions table and queries in src/db/schema/init.ts and src/db/queries/session.ts
  - API routes under src/app/api/sessions for:
    - Listing a user's sessions
    - Saving a new session (summary, metrics, route polyline, normalized records; no raw FIT)
    - Fetching session detail by id
    - Deleting a session for the current user
  - Sessions list page at /(app)/sessions with:
    - Card layout (distance, elapsed time, static map thumbnail, name/sequence)
    - "Add New Session" button linking to /session/upload
    - Per-session "Remove" button that calls DELETE /api/sessions/[id] and updates local state
  - Session detail page at /(app)/sessions/[id] reusing the same visualization components as the upload view, backed by persisted JSON blobs

## Architecture Overview

High-level structure (see src/ for details):

- src/app – Next.js App Router pages and layouts, grouped into (auth), (app), debug, session, etc.
- src/components/ui – Reusable UI components (auth provider, headers, panels).
- src/components/charts – Chart components built on uPlot.
- src/components/maps – Leaflet-based map components.
- src/lib/fit – FIT parsing, normalization, Web Worker, route extraction, debug analysis.
- src/lib/analysis – Deterministic metrics engine (pace, cadence, splits, consistency).
- src/lib/auth – NextAuth helpers (config, hooks, session helpers).
- src/lib/goals – (Planned) deterministic goal calculations (required pace/volume).
- src/lib/ai – (Planned) AI prompt builder and client for narrative analysis.
- src/lib/validation – Env, profile, sqlite-related validation using Zod.
- src/db/schema – Sqlite schema definition.
- src/db/queries – Sqlite query helpers (profiles, sessions).
- src/types – Shared domain types (FIT, session, profile, etc.).
- src/utils – Utility helpers (e.g., formatting).

## Roadmap

The remaining phases from docs/implementation-plan.md include:
- Goal definition module (per-user goals and deterministic projections).
- AI integration for narrative session feedback (non-medical, metrics-based).
- UX hardening (loading states, clearer error messaging, data limitation explanations, AI disclaimers).

Contributions and experiments should follow the conventions and constraints described in:
- docs/implementation-plan.md
- .github/copilot-instructions.md
- .github/instructions/functional-requirements.instructions.md

This README will evolve as new phases are implemented.