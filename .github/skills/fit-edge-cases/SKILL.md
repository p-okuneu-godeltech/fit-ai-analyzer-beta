# FIT Edge Case Handling

## Purpose
Guide safe, deterministic handling of noisy or incomplete FIT-derived records in `src/lib/fit`.

## Use this skill when
- Modifying FIT decoding, parsing, normalization, or route derivation.
- Handling duplicate points, out-of-order timestamps, missing GPS, or implausible jumps.
- Adding debug checks in FIT analysis helpers.

## Inputs expected
- Affected file(s) in `src/lib/fit/**`.
- Current behavior and failing/desired scenario.
- Any known data limitations from `docs/input-data.md`.

## Outputs required
- Clear normalization or validation rules expressed in code.
- Focused tests for the edge case in `tests/fit/**`.
- Explicit error or fallback behavior for malformed or sparse data.

## Guardrails
- Keep FIT parsing client-side and worker-friendly.
- Avoid silently dropping large sets of records without a documented rule.
- Make dedupe and outlier logic deterministic and testable.
- Preserve ordering guarantees before deriving speed or splits.
- Never crash UI paths on malformed files; return typed failure states.

## Repo-specific conventions
- Keep heavy FIT operations in `src/lib/fit/**`, not in React components.
- Reuse existing normalized session shape and record typing.
- Add targeted tests near `tests/fit/normalize.test.ts` style.

## Completion checklist
- Rule added/changed is covered by at least one edge-case test.
- Timestamp ordering and duplicate behavior are explicit.
- Behavior for missing GPS records is defined.
- No server-side raw FIT handling introduced.
