Run the Architect agent on: $ARGUMENTS

Spawn the **Architect** agent to design a complete solution for the given feature or task.

The Architect must produce before any code is written:
- Tech decisions (with reasoning)
- File and folder structure
- Data models and types
- API contracts and interfaces
- Integration points with existing code
- Explicit out-of-scope items

Big decisions (stack, schema, structure, API contracts) get presented to Colby for approval.
Small decisions get made automatically.

Do not implement anything — design only. The output is a spec that Builder can execute without making any structural decisions.
