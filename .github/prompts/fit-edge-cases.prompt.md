---
description: Handle FIT normalization edge cases with deterministic, test-backed rules.
---
When editing FIT logic:

- Keep parsing and normalization deterministic and worker-safe.
- Make ordering and dedupe behavior explicit before deriving speed, splits, or route shape.
- For edge-case handling, add or update focused tests under `tests/fit/**`.
- Define behavior for:
  - out-of-order timestamps
  - duplicate records
  - missing GPS fields
  - implausible distance or time jumps
- Do not silently discard records unless the rule is explicit and tested.
- Return clear typed errors or fallback states for malformed data.
- Preserve privacy constraint: raw FIT parsing remains client-side.
