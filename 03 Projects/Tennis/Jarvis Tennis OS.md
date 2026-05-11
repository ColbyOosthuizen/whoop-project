# Jarvis Tennis OS

> Desktop app (PyWebView) that unifies WHOOP recovery, Google + Apple Calendar, AI coaching, and WhatsApp outreach into one interface.

**GitHub:** https://github.com/ColbyOosthuizen/whoop-project  
**App location:** `Documents/Claude second-brain/tennis_app/`  
**Launch:** Double-click `Jarvis Tennis.lnk` on Desktop (or run `python main.py` from `tennis_app/`)

---

## What it does

| Tab | Function |
|-----|----------|
| **Dashboard** | Live WHOOP recovery score, HRV, RHR, sleep, strain — auto-syncs every 5 min |
| **Chat** | Direct conversation with Claude (Sonnet 4.6) — has context of your WHOOP + calendar |
| **Council** | 6 AI advisors brief in parallel (Head Coach, S&C, Tournament, Psych, Nutrition, Recovery) — Jarvis synthesises |
| **Outreach** | Reads WHOOP + calendar → determines match capacity → drafts personalised WhatsApp messages per player → wa.me link pre-loads message, you hit Send |
| **Matches** | Log match results, recovery, notes to vault |
| **Calendar** | Month grid + 3-day view, Google + Apple Calendar merged |
| **Settings** | Anthropic API key, vault path, sync status |

---

## Outreach flow

1. Hit **Analyse** — AI reads WHOOP recovery + today's calendar, returns match capacity + gym viability
2. Check players to reach out to (managed in Players section)
3. Adjust slot count + optional context note
4. Hit **Generate Messages** — parallel AI drafts per player
5. Edit message if needed → **Open WhatsApp** (pre-loaded, you hit Send)

---

## Key files

```
tennis_app/
├── main.py           # PyWebView entry point, starts auto-sync thread
├── api.py            # All Python methods exposed to JS
├── icloud_sync.py    # CalDAV client for Apple Calendar
├── players.json      # Player contacts (name, phone, level, notes)
└── ui/
    ├── index.html
    ├── app.js
    └── styles.css
```

---

## Integrations

- **WHOOP** — OAuth via WHOOP API v7, auto-syncs recovery/HRV/sleep every 5 min
- **Google Calendar** — OAuth v3, read + create events
- **Apple Calendar** — CalDAV via `caldav` library, app-specific password in `.env`
- **Anthropic** — claude-sonnet-4-6 for chat/synthesis, claude-haiku-4-5-20251001 for council agents
- **WhatsApp** — `wa.me/{phone}?text=...` links (no API needed)
- **Obsidian** — `obsidian://open?vault=` URI to open vault from app

---

## Setup (one-time)

1. `pip install pywebview anthropic caldav icalendar google-auth-oauthlib google-api-python-client`
2. Add `ANTHROPIC_API_KEY` in Settings tab
3. Add `google_credentials.json` to vault root → authenticate via Calendar tab
4. Add iCloud app-specific password via Calendar tab → Settings > iCloud

---

## Build phases

- **Phase 1** — Dashboard, match log, WHOOP sync
- **Phase 2** — Google Calendar integration, OAuth, event creation
- **Phase 3** — Training auto-scheduler (reads calendar + WHOOP, proposes blocks)
- **Phase 4** — iCloud Calendar, Chat, Council, Outreach + player roster, full UI overhaul
