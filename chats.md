# AI Development Workflow Log

## Overview

This document outlines the process of building the app using AI-assisted tools. It details the key prompts, context, tools, and workflow steps, along with observations and learnings from the process.

---

## 1. Key Prompts & Workflow

### Step -1: Research
First I had to understand whether my idea could be implemented in a language of choice, so I spun up a session of deep research in ChatGPT (I have private subscription there). [Link to the session](https://chatgpt.com/share/698b7596-b42c-8003-aaee-fd46dc570b52). This is how first version of `implementation-plan.md` appeared.

### Step 0: Initial Prompt
- **Prompt:**  
  Prompt:
  "I'm assuming you have access to instructions setup in this repo. Proceed with the phase 0 of the **implementation plan** and apply changes to the repository. Don't move to the next phase unless explicitly asked. Scaffold Next.js project into current folder."

- **Context Provided:**  
  Reference to `docs/implementation-plan.md` and `*.instructions.md` files
- **Model/Tool Used:**  
  GPT 5.1
- **Result (Summary):**  
  As the result agent has scaffolded the project which successfully booted up with `npm run dev`, first test passed.
  The project didn't contain data source and didn't initiate connection to SQLite.
- **Accepted/Changed & Why:**  
  I removed initial output, since it looked incomplete in files and app couldn't start, maybe because I prompted to a background agent which isn't supposed to provide any output to the chat.
- **Insights:**  
  Next.js scaffolding requires to specify location where the project is located.

## Asking to connect to a data source during app startup
## Asking for a change in .gitignore (forgot to add this info to instructions on how to work with this repo)
---

Any further interaction with Agentic chat can be described the following way:
- User created new chat, activated Plan mode and asked to prepare a plan for Phase {Phase number} + provided some additional requirements from the top of head.
- Chat responded with brief well-defined instruction for user to review, offering some questions regarding the implementation it needs to consider.
- User approved or corrected the output until finally approved.
- User started implementation.
- Chat went thinking and eventually produced some code (hundreds or thousands lines of code) + several test scenarios (testing pure functions ONLY).
- User followed the instructions on how to visualize code changes and checked it for bugs/misbehaviors.
- User provided feedback on bugs and asked to fix them.
- All bugs resolved, phase completed.  

### Chat sample (summarized by AI)
Implement Phase 1 - FIT parsing & debug pipeline

- **Prompt:**  
Asked Copilot to plan and then implement Phase 1 of the implementation plan: “Use the official Garmin @garmin/fitsdk to parse .FIT files client-side via a Web Worker, expose a typed ParsedSession, and add a debug upload/inspect page. Don’t move to later phases yet. Also help me understand what data comes out of a real session and add a simple analysis function for a test file.”

- **Context Provided:**  
References to implementation-plan.md, functional requirements in functional-requirements.instructions.md, the Garmin SDK notes in garmin:fitsdk-README.md, and later a real decoded sample in debug-fit-sample.json.

- **Model/Tool Used:**  
GPT 5.1 via GitHub Copilot in VS Code, using @garmin/fitsdk, a Web Worker-based parser, React hook and debug page, plus Vitest for unit tests.

- **Result (Summary):**  
Implemented a thin FIT decode wrapper (src/lib/fit/decoder.ts), a worker entry + messaging (src/lib/fit/fitParser.worker.ts, src/lib/fit/workerMessages.ts), a ParsedSession builder with normalization (src/lib/fit/parsedSessionBuilder.ts, src/lib/fit/normalize.ts), and a dev-only upload/inspect page at /debug/fit-upload (src/app/debug/fit-upload/page.tsx). Added a debug analysis helper (src/lib/fit/debugAnalysis.ts) and tests (tests/fit/debugAnalysis.test.ts, tests/fit/normalize.test.ts). Updated both the implementation plan and functional-requirements docs to describe the current FIT pipeline.

- **Accepted/Changed & Why:**  
Kept the worker-based parsing and @garmin/fitsdk integration as-is, but explicitly deferred any hard decision about whether to trust record-derived vs session-header totals until after inspecting real data. Adjusted the builder once (after an accidental overwrite) to ensure it always runs the normalizer. Relaxed the file input filter so non-.fit files can be chosen and trigger the validation error, matching the “clear error messages” requirement.

- **Insights:**  
Defining a concrete, library-specific plan first (how @garmin/fitsdk integrates, where the worker lives, how ParsedSession is shaped) made the implementation straightforward. Using a debug upload page plus a tiny analysis helper and tests to inspect a real FIT session before deciding on normalization rules was very effective and avoided premature assumptions about the data.

### Chat sample (summarizes by AI)
Step 4: Single-Session UI – Summary, Splits, Map & Charts

- **Prompt:**  
Asked Copilot to plan and implement Phase 4 of the implementation plan: “Use the existing ParsedSession + metrics to build a desktop-first single-session debug view with workout/elapsed time, splits table, route map, and pace/cadence charts. Keep everything read-only and in-memory.”

- **Context Provided:**  
References to implementation-plan.md (Phase 4), `functional-requirements.instructions.md`, existing FIT pipeline and metrics in `src/lib/fit` and `src/lib/analysis/sessionMetrics.ts`, the debug upload page at `src/app/debug/fit-upload/page.tsx`, and the new `RouteMap` component.

- **Model/Tool Used:**  
GPT 5.1 via GitHub Copilot in VS Code, using Next.js App Router, Leaflet/react-leaflet, uPlot, and Vitest.

- **Result (Summary):**  
Added a reusable SessionSummaryPanel (src/components/ui/SessionSummaryPanel.tsx) that shows distance, workout time, elapsed time, average pace, and average cadence, plus a short “data limitations” note, driven by a computeSessionTimeSummary helper.
Added SplitsTable (src/components/charts/SplitsTable.tsx) to render per‑km splits (km index, distance, pace, cadence) with responsive width.
Implemented a shared TimeSeriesChart wrapper around uPlot (src/components/charts/TimeSeriesChart.tsx) and built PaceChart + CadenceChart (src/components/charts/PaceChart.tsx, CadenceChart.tsx) that aggregate data into per‑minute bins and render bar charts (green pace bars, magenta cadence bars).
Created a single-session debug layout at page.tsx that reuses useFitParser, computeSessionMetrics, RouteMap, SplitsTable, SessionSummaryPanel, and the two charts, with clear loading/error states and “no GPS” handling.
Refreshed the older /debug/fit-upload page to reuse the new summary and splits components so metrics look consistent across debug views.

- **Accepted/Changed & Why:**  
Accepted per-minute bar aggregation for pace and cadence instead of per-record line charts to better match the “per-minute” mental model and keep charts performant for long runs.
Kept pace/cadence charts qualitative for now: bars and axes use simple numeric scales; exact mm:ss axis labelling and “absolute” bar height semantics are deferred to a later iteration.
Chose a vertical layout (summary → splits → map → charts) and simple CSS Modules tweaks for map/table widths to keep the Phase 4 UI desktop-first without over-investing in responsive design.

- **Insights:**  
Building small, composable presentation components (summary panel, splits table, generic chart wrapper) made it easy to wire a full single-session view without mixing domain logic into React.
For running metrics, chart design needs an explicit separation between numeric storage (seconds/km, spm) and human-readable formatting (mm:ss, spm labels); ad‑hoc conversions easily get confusing.
Treating this as a “debug session viewer” first (no persistence, no auth) was useful: it let us experiment with aggregation and layout without locking in UX decisions for the eventual authenticated session detail page.

---

## 2. External Tools & Servers

- **MCP Servers/External Tools Used:**  
  No MCP servers used, didn't have enough time to figure out how to work with them. But general idea understood.
---

## 3. Observations & Learnings

### What Worked Well
- Incremental, phased development through first 7 phases went quite well. The scaffolded project had run successfully and first test passed. 
- Integrations with tools, like @garmin/fitsdk, leaflet and uPlot went smoothly, probably thanks to manually uploaded READMEs (thanks open-source).
- Plan mode for AI Agents allowed to provide human-readable and focused input for GPT agents and implementation never ended badly.

### What Didn’t Work & Why
- Sometimes agent stopped at some stage during plan implementation and no feedback was provided. I believe this could be fixed with more granular tasks.
- Context limit could be used wiser (36% of month limit in 3 days of development)
  - Maybe should rely more on Ask and Edit modes, not just Plan and Agent (although they were awesome!)