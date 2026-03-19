---
description: Keep session metrics deterministic, null-safe, and unit-tested.
---
When editing metrics logic:

- Keep calculations in pure functions with explicit return types.
- Make unit conversions explicit (pace, speed, distance, cadence).
- Guard against division-by-zero and invalid intervals.
- Prefer nullable outputs for insufficient data instead of guessed values.
- Add or update tests in `tests/analysis/**` for:
  - nominal behavior
  - boundary conditions
  - sparse/invalid input behavior
- Keep logic in analysis modules, not UI components.
