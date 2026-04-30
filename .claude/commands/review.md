Run a code review on: $ARGUMENTS

Spawn the **Reviewer** agent for final code review.

Reviewer checks (not bugs, not vulnerabilities — those are QA and Security):
- Code quality and readability
- Performance (N+1s, unnecessary computation, blocking operations)
- Maintainability and appropriate abstraction
- Architecture alignment with the approved spec
- Scope — nothing extra built, nothing over-engineered

Verdict: APPROVED or CHANGES REQUESTED.

APPROVED means the code is genuinely good.
CHANGES REQUESTED means specific issues that must be fixed before shipping.

Review with the mindset of someone maintaining this code in two years.
