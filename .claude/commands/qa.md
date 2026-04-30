Run QA on the current implementation: $ARGUMENTS

Spawn the **QA** agent to verify the implementation.

QA checks:
- Every acceptance criterion is met
- Happy path works end to end
- Edge cases are handled (null/empty inputs, boundary values, failure scenarios)
- Integration points are correctly connected
- No regressions in existing functionality

QA produces a full report with verdict: PASS or FAIL.

FAIL means specific issues with file and line references — not vague complaints.
PASS means it's genuinely working — not rubber-stamped.

If QA fails, provide the exact findings so Builder can fix them.
