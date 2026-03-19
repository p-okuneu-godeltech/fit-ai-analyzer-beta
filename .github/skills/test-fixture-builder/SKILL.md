# Test Fixture Builder

## Purpose
Create reusable, deterministic fixtures for tests in this repository, especially around FIT parsing, deterministic analysis, and API request payloads.

## Use this skill when
- Adding or refactoring tests in `tests/**`.
- You see repeated inline object literals in multiple tests.
- New edge-case coverage is needed for FIT records, splits, cadence, or API validation.

## Inputs expected
- Target test file(s).
- Domain model to fixture (for example ParsedSession, profile payload, route payload).
- Behavior under test and edge cases.

## Outputs required
- A fixture module under `tests/fixtures/` when reuse is expected.
- Small builder helpers with sane defaults and explicit overrides.
- Updated tests using fixtures, following Arrange-Act-Assert.

## Guardrails
- Keep fixtures deterministic: stable timestamps, predictable distance increments.
- Prefer small builders over giant "kitchen sink" objects.
- Name fixtures by intent (`makeSessionWithPause`, `makeMinimalSession`) rather than source.
- Do not hide test intent in fixture complexity.
- Do not use production DB or real FIT binaries for unit tests.

## Repo-specific conventions
- Mirror style from existing tests in `tests/fit` and `tests/analysis`.
- Keep pure-logic tests isolated from UI concerns.
- Favor straightforward synthetic data over opaque snapshots.

## Completion checklist
- Added at least one happy-path and one edge-case fixture.
- No fixture relies on wall clock time or random values.
- Test names clearly describe expected behavior.
- New fixtures are used by at least one test or kept local if single-use.
