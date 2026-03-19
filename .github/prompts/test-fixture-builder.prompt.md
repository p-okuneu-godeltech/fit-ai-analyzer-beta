---
description: Build deterministic, reusable tests fixtures and keep test intent clear.
---
When editing or generating tests:

- Prefer fixture builders over repeated large object literals.
- Keep fixture data deterministic:
  - stable timestamps
  - explicit distance increments
  - no random values
- Use Arrange-Act-Assert and test one behavior per test.
- Include at least one edge case where relevant (missing cadence, duplicate timestamp, zero distance increment, sparse records).
- Keep fixture names intention-revealing.
- If fixture reuse is likely, place shared builders in `tests/fixtures/`.
- Keep tests fast and isolated; avoid real FIT binaries unless integration coverage is explicitly requested.
