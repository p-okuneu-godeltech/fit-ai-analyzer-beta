---
description: Provide functional requirements and constraints that should guide AI-generated code and implementation choices.
applyTo: '**'
---

## Functional requirements for app

#### FIT File Handling
Features
- Upload .fit file (drag & drop)
- Client-side parsing
- Validation (running activity only)
- Extracted session data
- Total distance
- Total duration
- Average pace
- Average cadence
- Pace per km (splits)
- Cadence per km
- Speed variability
- GPS track

Technical notes
- Parse FIT in browser: web worker
- Handle GPS noise: removing outliers, duplicate points
    ==
    = TYPE=0 NAME=record NUMBER=20
    --- position_lat=609850859=51.1171085 deg
    --- position_long=202874395=17.0047353 deg
    ...
    
    ==
    = TYPE=0 NAME=record NUMBER=20
    --- position_lat=609850859=51.1171085 deg
    --- position_long=202874395=17.0047353 deg
    ....

Current implementation snapshot (dev-only)
- FIT decoding uses the official `@garmin/fitsdk` library inside a Web Worker, via a thin wrapper in `src/lib/fit/decoder.ts`.
- A debug upload/inspect page at `src/app/debug/fit-upload/page.tsx` accepts any file, validates `.fit` extension, and displays either a typed `ParsedSession` preview or clear error messages.
- Parsed sessions are normalized in `src/lib/fit/normalize.ts` to:
    - Sort records by timestamp.
    - Deduplicate duplicate records with identical timestamp and distance.
    - Derive `speedMetersPerSecond` from distance deltas and time differences.
- A debug analysis helper in `src/lib/fit/debugAnalysis.ts`, with tests in `tests/fit`, checks basic properties (record count, monotonic timestamps, GPS presence) to validate parsed output against these requirements.

#### Map & Geospatial Visualization
Map
- Route polyline over map
- Start / finish markers
- Zoom + pan
- Optional split markers
Map provider
- OpenStreetMap tiles
- No API keys
- No usage caps drama

#### Charts & Metrics
Charts
- Pace vs distance
- Cadence vs distance
- Elevation (optional, if altitude present)
- Pace consistency (variance per split)

Metrics
- Avg / best / worst pace
- Pace drift (first half vs second half)
- Cadence stability
- Stop detection (pauses)

Libraries
- Lightweight charting, no D3 overengineering

### User Profile & Context Model

#### Pre-signup Questionnaire (Required)
Running background
- Years running
- Weekly kilometrage
- 5k PB + date
- 10k PB + date

Lifestyle
- Avg daily calorie intake
- Sleep (hours + consistency)
- Stress level (subjective scale)

Goal
- Target race distance
- Target pace
- Target date

### Session Analysis Engine

#### Deterministic Analysis (Non-AI)
Computed locally or server-side:
- Pace consistency score
- Split degradation
- Cadence efficiency (pace vs cadence correlation)

#### AI-Based Analysis
Input to AI
- Session summary (not raw records)
- Derived metrics
- User profile
- Goal definition
- Historical trends (limited)

Output
Plain-language feedback:
- Session quality
- What this run trained (endurance, tempo, fatigue)
- Risks (overreaching, inconsistency)
- Suggested focus for next 7–14 days
- Constraints
- No medical claims
- No pseudo-physiology
- Emphasize uncertainty when data is thin