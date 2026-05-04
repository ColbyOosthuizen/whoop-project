---
type: project
date: 2026-05-04
project: Tennis
---

## Goal
Use AI to remove friction from tennis life — scheduling, match coordination, recovery optimization, and training decisions.

## Why
Tennis is the main thing. Organizing matches, texting people, checking recovery, and managing a calendar shouldn't eat into court time.

## How This Works

### Match Organization
- Colby tells Claude who, when, where
- Claude drafts the texts, creates the calendar event, checks WHOOP recovery
- Colby copies texts and sends — eventually automated via WhatsApp

### Recovery & Training
- WHOOP data pulls in daily (recovery, strain, sleep, HRV)
- Claude advises: high intensity vs technique vs rest day based on data
- Training notes logged after sessions

### Calendar
- Google Calendar synced to Apple Calendar
- Claude reads/writes events via Google Calendar MCP
- All tennis matches, training, and rest days visible in one place

## Folder Structure
```
Tennis/
├── Tennis Overview.md      ← You are here
├── (C) Players.md          ← Contact list, preferences, availability
├── (C) Match Schedule.md   ← Upcoming and past matches
├── Match Log/              ← Individual match notes and results
├── WHOOP Data/             ← Daily recovery and strain logs
└── Training Notes/         ← Session notes, drills, things to work on
```

## Integrations Status
- [ ] WHOOP API connected — pull daily recovery/strain/sleep
- [ ] Google Calendar MCP — read/write tennis events
- [ ] Google ↔ Apple Calendar sync — bridge for iPhone
- [ ] WhatsApp automation — draft and send match coordination texts

## Open Problems
1. Get WHOOP API credentials and test data pull
2. Set up Google Calendar MCP server
3. Sync Google Calendar ↔ Apple Calendar (Settings on iPhone)
4. Explore WhatsApp Business API or alternative messaging bridge
