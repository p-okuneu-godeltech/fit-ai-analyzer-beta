## Project: FIT AI Analyzer – Copilot Custom Instructions

Web-based FIT file viewer and AI running analysis platform. Parse FIT files client-side, extract key metrics, and provide AI-powered insights to help runners understand performance and progress toward their goals.

## 1. Tech Stack & Architecture

- Frontend: Next.js (App Router) + Vite + TypeScript + CSS Modules, client-heavy rendering.
- Key browser APIs: File API (FIT upload), Web Workers (FIT parsing off main thread), Canvas/SVG for charts, map library (e.g. Leaflet) for visualization only.
- Backend: Next.js API routes used for auth, profile storage, session metadata, and AI requests (not for raw FIT parsing).
- Data storage: relational DB (sqlite - at **data/main.sqlite**); entities: users, profiles (versioned), sessions (metadata only), goals.
- Project structure (keep consistent):
  - src/app: layouts, routes, auth/public groups.
  - src/components: reusable UI (ui/, charts/, maps/).
  - src/lib: fit/, analysis/, goals/, ai/, validation/.
  - src/db: schema/ and queries/.
  - src/types and src/utils for shared types and utilities.
  - docs/ - put brief descriptions of implemented features and keep it updated as features evolve; also include any relevant notes on FIT file interpretation, edge cases, and known limitations.

When generating or refactoring code, respect this layout and prefer adding logic to lib/ and db/ instead of bloating components.

---

## 2. UI recommendations
- Keep it simple and clean; prioritize clarity of data and insights.
- Use consistent styling and spacing; follow existing CSS module patterns (https://vite.dev/guide/features#css-modules for reference).
- For charts, prefer simple line/bar charts with clear axes and labels; avoid overcomplicated visualizations.
- For maps, use Leaflet with OpenStreetMap tiles; keep interactions intuitive (zoom, pan, optional split markers).
- Screen states should be clear: loading, error, empty states should all have distinct, user-friendly messaging, animations optional but can enhance feedback.

---

## 3. Data & Privacy Constraints

- FIT files must never leave the user’s device for parsing; all raw FIT parsing is client-side, ideally in Web Workers.
- Server-side code should only receive derived/aggregated metrics and metadata, not full FIT binaries.
- AI analysis is based on computed metrics + stored profile/goal data, not raw sensor streams.
- When suggesting changes, do not introduce server-side FIT parsing or background tracking.

---

## 4. FIT Parsing & Analysis Guidelines

- Parsing:
  - Implement or use FIT parsing logic inside src/lib/fit/.
  - Offload heavy parsing to Web Workers to keep the UI responsive.
  - Surface clear errors for malformed or incomplete files; never crash the UI silently.
- Metrics & analysis:
  - Put domain logic in src/lib/analysis/ (e.g. pace, cadence, heart-rate zones, interval detection).
  - Prefer pure, testable functions; avoid binding analysis directly to React components.
  - When data is sparse or noisy, expose this uncertainty explicitly in any generated commentary.
- Input data: refer to **/docs/input-data.md** for more information on FIT file interpretation and edge cases.

Analysis must be:
- Pace-based
- Cadence-based
- Consistency- and trend-oriented
- Goal-relative, not physiology-absolute
---

## 5. Functional requirements
When implementing features, refer to functional requirements instruction **functional-requirements.instructions.md** for an overview of requirements and constraints that have direct implications on implementation choices and final behavior.

## 6. AI Integration Guidelines

- AI calls should live in src/lib/ai/ (and related API routes under src/app/api/...).
- Prompt structure:
  - System: evidence-based running coach persona, non-medical, realistic.
  - Context: user profile + current goal.
  - Data: computed metrics only (per-session and trends).
  - Instructions: give concise feedback and 2–5 concrete, actionable suggestions.
  - Emphasize uncertainty where data is thin; avoid medical claims or pseudo-physiology.
- Guardrails:
  - Respect token limits; keep prompts and outputs tight.
  - Cap output length (no long essays by default).
  - Use deterministic temperature for consistency.
  - Never fabricate precise physiological explanations or medical advice.

---

## 7. Coding Conventions

- TypeScript:
  - Prefer explicit return types on public functions.
  - Avoid `any`; use unions, generics, and discriminated unions where appropriate.
  - Centralize shared types in src/types/.
  - Prefer Functional React components using hooks.
  - Keep small, composable utilities in src/lib/ and src/utils/.
  - Keep API handlers thin, delegating logic to lib/ modules.
- React/Next.js:
  - Use the App Router with server and client components as appropriate.
  - Keep components presentational when possible; move side-effects and domain logic into hooks or lib/.
  - When adding new pages, wire them into the existing layout structure and navigation.
- Database:
  - Keep schema definitions in src/db/schema/ and querying logic in src/db/queries/.
  - Use clear, intention-revealing function names for DB access (e.g. `getUserSessionsByDateRange`).
  - Use local db server (sqlite) for development; ensure schema is compatible with potential future production DB (e.g. Postgres).
- Style:
  - Follow existing formatting and naming conventions in the repo.
  - Avoid adding comments unless the user asks; prefer clear code and function names.
- When implementing new features, also propose (and, if reasonable, add) matching docs in docs/.

---

## 8. Testing & Validation

- When changing or adding non-trivial logic, look for existing tests first and mirror their style.
- If there is a clear, existing place for a new test, prefer adding one focused test rather than broad suites.
- For FIT parsing and analysis, prioritize:
  - Unit tests for metrics calculations.
  - Simple fixtures for edge cases (short runs, missing GPS, pauses, etc.).

---

## 9. Conversation & Prompt Tracking

After every user prompt, internally track the interaction using this template (do not echo it back unless explicitly asked):

- `User ask:` 1–2 sentences summarizing what the user wanted.
- `Response summary:` 1–2 short phrases describing what was returned.
- `Prompt type:` one of `question | explanation | refactor | code generation | debugging | architecture/design | other` (pick one; add clarifier if needed).
- `Difficulties:` 1–2 short phrases on what was hard/uncertain (e.g. “missing repo context”, “ambiguous requirements”, “tool error”), or `none`.
- `Prompt quality:` `accurate/specific` or `missing details/ambiguous` (+ 1 short phrase on what was missing if applicable).
- `Tools used:` list of tools or `none`.

Use this log mentally/implicitly to improve follow-up answers and spot recurring patterns in what the user expects.

---

## 10. External References

When you need background or protocol details, prefer these sources:

- FIT file format: https://developer.garmin.com/fit/protocol/
- Next.js: https://nextjs.org/docs
- TypeScript: https://www.typescriptlang.org/docs/
- Leaflet.js (mapping lib in use): https://leafletjs.com/reference.html
- uPlot (lightweight charting lib): **/docs/libraries/uPlot-README.md**

Use external references to guide implementations, but keep all code and explanations self-contained within this project’s style and constraints.

---

## 11. Repository Copilot Customizations

Additional repository customizations are available for common workflows:

- Skills:
  - `.github/skills/test-fixture-builder/SKILL.md`
  - `.github/skills/fit-edge-cases/SKILL.md`
  - `.github/skills/session-metrics-validation/SKILL.md`
- Prompts:
  - `.github/prompts/test-fixture-builder.prompt.md`
  - `.github/prompts/fit-edge-cases.prompt.md`
  - `.github/prompts/session-metrics-validation.prompt.md`

For validation steps and acceptance criteria of these customizations, use `docs/copilot-customizations-testing.md`.
