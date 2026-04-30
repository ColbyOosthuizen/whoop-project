Run the Builder agent on: $ARGUMENTS

Spawn the **Builder** agent to implement the approved spec.

Before building, read:
1. The architectural spec (if one exists for this feature)
2. The project's existing code structure and patterns

Builder implements the spec completely and exactly:
- Follows existing code style and patterns
- Prefixes all new files with `(C)`
- Writes readable, production-quality code
- No TODOs, no stubs, no partial work
- Nothing outside the spec

If there is no architectural spec for a non-trivial feature, stop and recommend running `/architect` first.
