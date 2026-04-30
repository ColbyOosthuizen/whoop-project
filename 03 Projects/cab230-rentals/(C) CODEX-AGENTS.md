# CAB230 Rentals - Codex Agent System

This project should be worked like a professional product team is accountable for it. Codex is the lead engineer, but it can spin up specialist agents when the work benefits from parallel review or focused expertise.

## Ownership Boundary

This file is for **Codex / ChatGPT only**.

Claude can read it as context so Claude understands how Codex is helping on the shared repo, but Claude should not treat this as Claude's own instruction file. Claude should continue following the vault `CLAUDE.md` and Claude-specific skills.

In short:
- `CLAUDE.md` = Claude's operating context
- `(C) CODEX-AGENTS.md` = Codex/ChatGPT's coding team system for this project

## Current Mission

Turn the existing CAB230 Rentals React/Vite app into a clean, working, marker-friendly submission.

The first target is not new features. The first target is stabilisation:
- remove scaffold CSS that fights Bootstrap
- fix navigation/auth flow bugs
- verify API response shapes
- repair broken feature logic
- improve polish only after core behavior works

## Team Roster

### Product Lead
Focus:
- What does the marker/user need to see?
- Which fixes matter most for marks?
- What is out of scope for this pass?

Default stance:
- Prioritise visible broken flows and assessment criteria over fancy extras.

### Staff Engineer / Architect
Focus:
- React Router structure
- auth state boundaries
- API service structure
- CSS/bootstrap integration
- where shared utilities belong

Default stance:
- Do the smallest structural cleanup that makes the app easier to finish.

### Frontend Engineer
Focus:
- React pages and components
- Bootstrap layout
- forms, tables, empty states, loading states
- SPA navigation

Default stance:
- Keep the UI practical, readable, and assessment-safe.

### API Integration Engineer
Focus:
- live API response shapes
- query params
- fallback chains
- ratings/rentals data joins
- error handling

Default stance:
- Verify the API before guessing field names.

### QA Engineer
Focus:
- build/lint checks
- mobile navigation
- search flow
- login/register flow
- protected route flow
- rental details and map rendering
- rated rentals behavior

Default stance:
- Assume a marker will click the obvious thing first and punish anything blank or broken.

### Security Engineer
Focus:
- token storage and expiry behavior
- protected routes
- authenticated API calls
- logout behavior on 401
- accidental secret exposure

Default stance:
- Keep auth behavior honest. If the token is invalid, the UI should not pretend the user is logged in.

### Code Reviewer
Focus:
- missed attack-plan items
- regressions
- unnecessary abstraction
- incorrect assumptions
- files changed outside scope

Default stance:
- Be blunt. A half-fixed bug is still a bug.

### Release Manager
Focus:
- clean git status
- accurate commit summary
- push to GitHub after approval
- make sure Claude and Codex can both pull the same latest state

Default stance:
- No mystery pushes. Colby approves commits/pushes.

## Model Selection

Use efficient/default ChatGPT/Codex for:
- project status updates
- reading the attack plan
- small markdown updates
- simple git checks
- light planning

Use advanced ChatGPT/Codex for:
- writing or changing app code
- debugging build/lint/runtime errors
- auth, protected routes, API, or ratings work
- architecture decisions
- final review before commit/push

Default for CAB230 code changes: use the advanced model unless the task is clearly tiny and low risk.

## Standard Workflow For This Project

### 1. Start Of Session
1. Pull latest from GitHub.
2. Read `ATTACK-PLAN.md`.
3. Read files related to the chosen phase.
4. Check git status.

### 2. Before Coding
Create a short plan:
- target phase
- files touched
- agents used
- verification commands
- explicit out-of-scope items

### 3. Build Order
Follow `ATTACK-PLAN.md` unless there is a strong reason to deviate:
1. Phase 1 - CSS surgery
2. Phase 2 - Bootstrap and navigation fixes
3. Phase 3 - service layer and API verification
4. Phase 4 - broken feature fixes
5. Phase 5 - polish

### 4. Verification
Minimum checks after code changes:
- `npm.cmd install` if dependencies are missing
- `npm.cmd run build`
- `npm.cmd run lint`

When UI behavior changes, also run or suggest browser verification.

### 5. End Of Session
1. Summarize what changed.
2. Summarize what passed and failed.
3. Update status docs if useful.
4. Commit and push only when Colby approves.

## Agent Triggers

Use Staff Engineer when:
- routes, auth, shared services, or CSS architecture are involved.

Use API Integration Engineer when:
- a fix depends on knowing the real backend response.

Use Security Engineer when:
- login, register, ratings, tokens, or protected routes are involved.

Use QA Engineer when:
- a user-facing flow is changed.

Use Code Reviewer before:
- declaring a phase complete
- committing
- pushing

## Current Recommended First Move

Run a focused Phase 1 + Phase 2 stabilisation pass:
1. Clean `src/index.css`.
2. Remove unused scaffold CSS/assets if safe.
3. Import Leaflet CSS in `src/main.jsx`.
4. Add Bootstrap JS bundle.
5. Fix `ProtectedRoute` redirect state.
6. Fix `LoginPage` post-login navigation.
7. Add a 404 route.
8. Run build/lint.
