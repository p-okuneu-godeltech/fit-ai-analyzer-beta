## MVP Phased Implementation Plan – FIT AI Analyzer

Goal: Ship a desktop-first MVP where a signed-in Google user can upload FIT files, see deterministic analysis (metrics, maps, charts), and persist sessions, profile, and goals to sqlite. AI analysis comes last and must work in local/dev the same way as in a deployed environment.

---

### Phase 0 – Project Skeleton & Conventions
Goal: Stable, strict Next.js foundation with predictable structure and sqlite wired, no domain features yet.

Code generation focus
- Scaffold Next.js app (App Router, TypeScript) with strict TS (`strict`, `noImplicitAny`, etc.), ESLint, and Prettier.
- Create folder skeleton under `src/`:
  - `src/app`
  - `src/components/ui`, `src/components/charts`, `src/components/maps`
  - `src/lib/fit`, `src/lib/analysis`, `src/lib/goals`, `src/lib/ai`, `src/lib/validation`
  - `src/db/schema`, `src/db/queries`
  - `src/types`, `src/utils`
- Add basic sqlite wiring (file-based DB) and env validation helpers (DB path, future AI key) in `src/lib/validation`.
- Define core domain types in `src/types`:
  - `SessionRecord`, `SessionSummary`, `ParsedSession`
  - `UserProfile`, `RunningGoal`, `AnalysisResult`
  - Include `userId` where relevant, but do not implement auth yet.
- Set up a minimal test runner and add at least one passing test.

Exit criteria
- `npm run dev` and tests run without errors.
- Folder structure and core types exist; no app-specific features implemented.

---

### Phase 1 – FIT File Parsing (Core Constraint)
Goal: Prove the app can understand FIT data and normalize it into a typed `ParsedSession` on the client.

Code generation focus
- Implement a dev-only FIT upload/inspect page (e.g. `src/app/debug/fit-upload/page.tsx`) using the File API that passes the FIT file to a Web Worker-based parser and shows JSON output.
- Implement FIT parsing logic in `src/lib/fit` using `@garmin/fitsdk`:
  - Parse FIT file client-side only, inside a Web Worker.
  - Use a thin decoder wrapper (`src/lib/fit/decoder.ts`) around `Decoder.read` / `Stream.fromArrayBuffer`.
  - Extract per-record fields into `SessionRecord` shape:
    - timestamp
    - distance
    - speed
    - cadence
    - lat / long (when present)
  - Normalize records (later Phase 2+ can refine to strict 1-second intervals and GPS de-noising).
  - Surface both raw decoded messages and a provisional `ParsedSession` for inspection.
- Populate a typed `ParsedSession`:
  ```ts
  type ParsedSession = {
    records: SessionRecord[]
    summary: SessionSummary
  }
  ```
- Surface clear, typed errors for malformed / unsupported / non-running FIT files.
  - Defer the choice of which total distance/duration fields to trust (per-record vs `session` header) until we have inspected a few real decoded activities via the debug page.

Additional dev tooling
- Add a small debug analysis helper (`src/lib/fit/debugAnalysis.ts`) that runs simple checks on a `ParsedSession` (record count, monotonic timestamps, basic totals, presence of GPS) so we can quickly understand the shape of real sessions.
- Cover the debug analysis with a focused unit test in `tests/fit/debugAnalysis.test.ts` using synthetic in-memory `ParsedSession` data.

Exit criteria
- Given a valid running FIT file, the dev page shows a JSON view of `ParsedSession`.
- Invalid files produce visible, user-friendly error messages (no crashes).

---

### Phase 2 – Deterministic Metrics Engine (No UI, No AI)
Goal: Turn `ParsedSession` into deterministic metrics using pure functions only.

Code generation focus
- Add metric types to `src/types/session.ts` (e.g. `Split`, `PaceStats`, `CadenceStats`).
- Implement pure utilities in `src/lib/analysis` to compute:
  - total distance
  - duration
  - average pace
  - average cadence
  - per-km splits (pace, cadence)
  - pace variance and cadence variance
  - first-half vs second-half pace
  - simple stop/pauses detection and consistency scores
- Ensure all functions accept `ParsedSession` or derived arrays and return typed objects.
- Add focused unit tests in `tests/analysis` using synthetic fixtures.

Rules
- No UI, no React, no AI.
- Pure functions only, easy to test.

Exit criteria
- Metrics functions are covered by tests and can be composed into a single `computeSessionMetrics(parsed: ParsedSession)` entry point.

---

### Phase 3 – Map Visualization
Goal: Visualize the route on a map for a single session using deterministic data.

Code generation focus
- Integrate Leaflet or MapLibre via components in `src/components/maps`:
  - Map shell component (tile layer, basic controls).
  - Route map component that accepts a polyline (lat/long array) and start/end markers.
- Implement bounds fitting to the route.
- Handle missing or partial GPS gracefully:
  - Show fallback messaging when no GPS data is present.
- Create a dev route (e.g. `src/app/debug/map/page.tsx`) that:
  - Uses a mock `ParsedSession` or the output of Phase 1.
  - Renders the route polyline and markers.

Exit criteria
- A developer can load a mocked or parsed session and see a route map with correct bounds and markers.
- No runtime errors when GPS is missing.

---

### Phase 4 – Charts & Single-Session UI (Read-Only, No Persistence)
Goal: Make one session understandable at a glance via charts, splits, and summary.

Code generation focus
- ensure you can integrate uPlot library in app without breaking it or causing rendering issues, library documentation stored in **docs/libraries/uPlot-README.md**
- Build presentational components:
  - `PaceChart` and `CadenceChart` in `src/components/charts` (pace vs distance, cadence vs distance).
  - `SplitsTable` in `src/components/charts` to render per-km splits.
  - `SessionSummaryPanel` in `src/components/ui` to show key metrics and a short “data limitations” note.
- Create a session upload/detail layout in `src/app/session/upload/page.tsx` that:
  - Uses existing `/debug/fit-upload/page.tsx` for initial parsing behavior.  
  - Accepts a `ParsedSession` + metrics (from Phase 2).
  - Composes map, charts, splits table, and summary panel in a single view.
  - Remains usable in a read-only, in-memory mode (persistence is added later in Phase 7).
- Keep flows read-only with no persistence or history; use hardcoded or in-memory data only.

Known limitations (to fix later)
- Pace and cadence charts currently use per-minute bar aggregation with raw numeric bar heights; axis value formatting and absolute bar values are approximate and should be treated as qualitative, not precise timing.

Constraints
- Desktop-first, Chromium/Firefox focus.
- Mobile-specific UX is out of scope for MVP.

Exit criteria
- A single session can be inspected end-to-end (map + charts + summary) using only in-memory data.

---

### Phase 5 – Auth & Accounts (NextAuth + Google, JWT Sessions)
Goal: Require Google login for meaningful actions and reliably identify the current user.

Code generation focus
- Integrate NextAuth under `src/app/api/auth/[...nextauth]/route.ts` with:
  - Google as the only OAuth provider for MVP.
  - JWT-based sessions (no DB sessions).
- Restructure routes into groups:
  - `src/app/(auth)/login` as the initial page for unauthenticated users.
  - `src/app/(app)/...` for protected app views (sessions, profile, goals).
- Add small auth utilities:
  - Server-side helpers to get the current user and `userId`.
  - Client hooks to access auth state and trigger sign-in/out.
 - Add a small auth UI control in the main header (desktop-first) that:
   - Shows the current user's email and avatar when authenticated.
   - Opens a lightweight dropdown with account info and a "Sign Out" action, similar to the NextAuth example screenshot.
   - Falls back to a "Sign In with Google" button when no user is authenticated.
- Define behavior when tokens expire:
  - Redirect to login with a clear message.
- Ensure setup works identically in local/dev and in a deployed environment.

Exit criteria
- Users must sign in with Google before accessing app views.
- API routes and pages can reliably access `userId` from auth context.

---

### Phase 6 – User Profile & Onboarding (Per-User, Latest Only, Not Yet Used)
Goal: Capture and store the latest running profile per authenticated user (no version history), editable at any time and ready for future analytics.

Code generation focus
- Define a `profiles` table schema in `src/db/schema` and queries in `src/db/queries` keyed by `userId`, storing a single latest row per user.
- Implement a profile onboarding/edit form in `src/app/(app)/profile`:
  - Running background (years, weekly km, PBs, etc.) as the required section.
  - Personal bests support an explicit "none" option (represented as empty/`null` in storage).
  - Lifestyle context (sleep, stress, etc.), with stress on a 4-option scale (never, few times a week, few times a day, everyday).
  - Weekly kilometrage is a numeric input with positive-number validation.
- Add validation logic in `src/lib/validation/profile` using Zod to enforce questionnaire rules and shape data for persistence.
- Expose a simple "analytics readiness" flag derived from the profile (running background present), to be used later by the analytics engine and UI controls.
- Do not connect profile to analysis yet; just persist it and surface readiness.

Exit criteria
- An authenticated user can create and update their profile via the profile page without blocking FIT uploads.
- A single latest profile row per `userId` is stored in sqlite.
- The profile validation layer exposes whether the profile is ready for analytics (running background present), so later phases can gate analytics UI accordingly.

---

### Phase 7 – Session Persistence & History (Per-User)
Goal: Enable per-user history without re-parsing the same FIT files.

Code generation focus
- Define session-related schema in `src/db/schema/init.ts` and queries in `src/db/queries/session.ts`:
  - `sessions` table keyed by `id` and `user_id` with:
    - Session summary fields: `start_time`, `end_time`, `total_distance_meters`, `total_duration_seconds`, `average_pace_seconds_per_km`, `average_cadence_spm`.
    - Display fields: `sequence_number` (per-user index) and optional `user_provided_name`.
    - Serialized JSON blobs: `metrics_json` (derived `SessionMetrics`), `route_polyline_json` (route polyline), and `records_json` (normalized `SessionRecord[]`).
  - Do **not** store raw FIT binaries; only derived/normalized data is persisted.
- Implement session API endpoints:
  - `GET /api/sessions` – list summaries for the current `userId` using `getSessionsByUserId`.
  - `POST /api/sessions/save` – save a session for the current `userId` from a client-provided `ParsedSession` + metrics (called from the upload page).
  - `GET /api/sessions/[id]` – fetch full session detail for the current `userId` using `getSessionDetailById`.
  - `DELETE /api/sessions/[id]` – delete a single session for the current `userId` using `deleteSessionForUser`.
- Reuse the upload/detail layout at `src/app/session/upload/page.tsx` for persistence:
  - Keep FIT parsing and deterministic analysis client-side.
  - When authenticated, show a "Save session" control with an optional inline name field; on success, show a green "Session saved!" message.
- Build history UI in `src/app/(app)/sessions`:
  - Session list view at `src/app/(app)/sessions/page.tsx` that:
    - Shows one card per session with name (`userProvidedName` or `session {sequence_number}`), distance, elapsed time, and a static map thumbnail (`/map.svg`) in a 500×500-style container.
    - Lays out items in a single column on small screens and two columns (50% width each) on large screens.
    - Includes an "Add New Session" (+) button linking to `/session/upload`.
    - Provides a per-session "Remove" button that issues `DELETE /api/sessions/[id]` and updates local state.
  - Session detail view at `src/app/(app)/sessions/[id]/page.tsx` that:
    - Loads detail via `GET /api/sessions/[id]` and reconstructs metrics, polyline, and records from stored JSON.
    - Reuses Phase 4 components (`SessionSummaryPanel`, `RouteMap`, `SplitsTable`, `PaceChart`, `CadenceChart`) backed by persisted data.

Exit criteria
- An authenticated user sees only their own sessions.
- Sessions can be re-opened from history without re-uploading the FIT file.
- Users can remove individual sessions from their history via the sessions list.

---
## TODO
### Phase 8 – Goal Definition Module (Per-User)
Goal: Give deterministic analysis a target via user-defined goals.

Code generation focus
- Define goal schema in `src/db/schema` and queries in `src/db/queries/goal` keyed by `userId`.
- Implement goal creation and management UI under `src/app/(app)/goals`:
  - Target distance
  - Target pace
  - Target date
- Implement deterministic calculations in `src/lib/goals`:
  - Required pace
  - Required weekly volume
- Store goal snapshots and expose the “active” goal per user.

Exit criteria
- Authenticated users can define and update running goals.
- Required pace and weekly volume are computed and displayed deterministically.

---

### Phase 9 – AI Integration (Last, Always Last)
Goal: Add narrative synthesis on top of existing metrics, profile, and goals, never doing calculations itself.

Code generation focus
- Implement AI prompt builder in `src/lib/ai/prompt` that receives:
  - Session metrics
  - Profile snapshot
  - Goal snapshot
- Implement AI client in `src/lib/ai/client` (provider to be chosen later) with config suitable for both local and deployed environments.
- Add API route(s) under `src/app/api/ai/...` to:
  - Build prompts
  - Call AI
  - Return structured feedback and short actionable advice
- Cache AI responses per session in sqlite.

Rules
- AI never calculates numbers.
- AI never sees raw records.
- AI never predicts injuries or gives medical advice.
- On errors or heavy load, show clear UI messages ("AI feedback unavailable, please try again later").

Exit criteria
- For any stored session with metrics, profile, and goal, AI feedback can be requested and cached.
- The app runs with AI fully enabled in local/dev using the same code paths as in production.

---

### Phase 10 – UX Hardening
Goal: Prevent user confusion and AI embarrassment, desktop-first.

Code generation focus
- Add loading states across upload, parsing, auth, persistence, and AI calls.
- Improve error handling:
  - Bad FIT files (clear messages, next steps).
  - Auth expiry (prompt re-login).
  - Missing data (profile, goal, GPS).
  - AI errors and rate limits.
- Add "data limitations" explanations wherever metrics or AI feedback could be misinterpreted.
- Add clear AI disclaimers (non-medical, uncertainty with sparse data).

Exit criteria
- Typical user flows show clear progress and error states.
- The app explains its limitations instead of overpromising.

---

### MVP Deliverables Checklist
- Google sign-in (NextAuth, JWT sessions).
- FIT upload + client-side parsing to `ParsedSession`.
- Deterministic metrics engine (pace, cadence, splits, consistency).
- Route map visualization.
- Pace & cadence charts + splits table + summary panel.
- Profile onboarding and storage (per user).
- Goal definition and deterministic projections (per user).
- Session persistence and per-user history view.
- Self-serve "delete my data" for the current user.
- AI session feedback (narrative, cached per session).

### Future Extensions (Not MVP)
- Trend-based fatigue detection.
- Multi-session AI summaries.
- Race simulation pacing.
- Shoe rotation tracking.
- Export to PDF for coach sharing.
- Export & delete data anytime (beyond self-serve in-app deletion).