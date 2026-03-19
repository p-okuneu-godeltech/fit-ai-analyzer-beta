# Copilot Customizations: Skill Testing Playbook

This playbook validates whether repository skills and prompts are being applied consistently.

## 1) Manual smoke scenarios

Run these three prompts in a fresh Copilot chat in this workspace and inspect generated output.

### Scenario A: Test Fixture Builder
Prompt:
"Add tests for a new helper in `src/lib/analysis/sessionMetrics.ts` and create reusable fixtures for sparse cadence and duplicate timestamps."

Pass criteria:
- Uses or creates fixture builders.
- Fixture values are deterministic.
- Tests follow Arrange-Act-Assert.
- Includes at least one edge-case test.

### Scenario B: FIT Edge Cases
Prompt:
"Update FIT normalization to handle duplicate records with same timestamp and distance, and add regression tests."

Pass criteria:
- Deterministic dedupe rule is explicit in code.
- Test added/updated in `tests/fit/**`.
- Behavior for malformed/sparse records is explicit.
- No server-side FIT parsing introduced.

### Scenario C: Session Metrics Validation
Prompt:
"Add a metric for pace variability and validate behavior for empty records and zero-duration segments."

Pass criteria:
- Function remains pure with explicit return type.
- Division-by-zero and invalid interval handling present.
- Sparse-data behavior returns null/empty contract, not fabricated values.
- Tests cover nominal + boundary + sparse cases.

## 2) Review checklist for each run

- Output changed files are within expected paths (`src/lib/fit`, `src/lib/analysis`, `tests/**`).
- Style aligns with existing repository conventions.
- No introduction of `any` in changed TypeScript files.
- Tests are focused and deterministic.

## 3) Fast regression command

Run after each scenario:

`npm test -- tests/fit tests/analysis`

If a scenario touches other test suites, run the targeted Vitest command for those files as well.

## 4) Tuning loop

If a scenario fails pass criteria:
1. Tighten the relevant prompt text in `.github/prompts/*.prompt.md`.
2. Add concrete examples to the corresponding `SKILL.md`.
3. Re-run only the failing scenario and compare output quality.

Use at least two consecutive successful runs per scenario before considering the customization stable.
