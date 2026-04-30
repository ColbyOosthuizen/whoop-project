Run a security review on: $ARGUMENTS

Spawn the **Security** agent to review the implementation for vulnerabilities.

Security reviews:
- Input validation and injection risks (SQL, XSS, command, path traversal)
- Authentication and authorization enforcement
- Secrets and credentials handling
- Data protection and PII handling
- OWASP Top 10 for the relevant stack
- Third-party dependency risks

Produces a report with severity-classified findings: Critical, Major, Minor.

Critical findings block shipping — escalate immediately.
Major findings must be fixed before proceeding.
Minor findings get noted for follow-up.

Be adversarial. The job is to find problems, not approve work.
