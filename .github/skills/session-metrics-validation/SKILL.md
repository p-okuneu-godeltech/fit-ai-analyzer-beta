# Session Metrics Validation

## Purpose
Ensure deterministic, testable, and null-safe session metrics in `src/lib/analysis/sessionMetrics.ts` and related helpers.

## Use this skill when
- Adding or changing pace, cadence, split, or drift calculations.
- Refactoring metric return types or score formulas.
- Fixing regressions caused by sparse or noisy data.

## Inputs expected
- Metric definition and expected units.
- Source data assumptions (distance monotonicity, timestamp continuity, cadence availability).
- Existing tests that should remain valid.

## Outputs required
- Pure function updates with explicit return types.
- Unit tests for normal path, boundary path, and insufficient-data path.
- Documented handling of null/undefined outputs where data is insufficient.

## Guardrails
- No hidden unit conversions; keep conversions explicit.
- Protect against division by zero and invalid intervals.
- Return nullable metrics for insufficient data instead of fabricated values.
- Keep domain logic in `src/lib/analysis/**`, not in UI components.

## Repo-specific conventions
- Follow test style in `tests/analysis/sessionMetrics.test.ts`.
- Keep function names intention-revealing.
- Preserve stable behavior for existing public metric helpers unless requested.

## Completion checklist
- Added tests for at least one boundary and one sparse-data case.
- No `any` introduced.
- Function contracts are explicit and deterministic.
- Updated behavior is reflected in tests, not only implementation.
