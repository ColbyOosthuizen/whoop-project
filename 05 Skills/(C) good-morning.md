# Skill: Good Morning

Morning briefing. Read the current state of all active projects, summarise what's in progress, what's next, and ask if Colby wants to start building.

---

## When to Use

- Start of a session
- Colby says "good morning" or "what are we working on?"
- Need a quick orientation before diving in

---

## How It Works

### Step 1 — Read the Vault

Scan silently before saying anything:

1. `GOALS.md` — current goals and progress
2. `CLAUDE.md` (vault level) — weekly update section, any in-progress notes
3. Every active project folder under `03 Projects/` — read each project's `CLAUDE.md` for status, current phase, and open tasks
4. Note any projects with no `CLAUDE.md` — flag them as untracked

### Step 2 — Deliver the Briefing

Format:

```
## Good morning, Colby.

### What's in progress
- [Project]: [one sentence on current status and where it's at]
- [Project]: ...

### What's next
- [Project]: [the most logical next task or decision based on current state]
- [Project]: ...

### Anything to flag
- [Blockers, stale projects, decisions that haven't been made, anything that needs attention]
- (or "Nothing to flag — all clear.")
```

Keep it tight. No padding, no filler. If there are no active projects, say so and suggest starting one with the New Project skill.

### Step 3 — Ask to Build

End every briefing with:

> "Want me to run Jarvis on any of these? Just say which one and I'll start."

If Colby picks a project, kick off the **Jarvis** skill immediately — read the project state and move into planning.

---

## Rules

- Read first, brief second — never guess at project status
- One line per project in the briefing — this is a morning scan, not a deep dive
- If a project has no CLAUDE.md, flag it — it's invisible to Jarvis until it has one
- End every briefing with the offer to build — that's the point
