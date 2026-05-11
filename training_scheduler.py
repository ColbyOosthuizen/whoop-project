"""
Training Scheduler — finds open windows in the calendar and proposes training
blocks based on WHOOP recovery.

Input: Google Calendar events + latest WHOOP data
Output: List of proposed training blocks Colby can approve.
"""

import re
from datetime import datetime, timedelta, time, timezone
from pathlib import Path

import calendar_sync

VAULT_ROOT = Path(__file__).parent
WHOOP_DIR = VAULT_ROOT / "03 Projects" / "Tennis" / "WHOOP Data"

# ── Day shape rules ───────────────────────────────────────────────────────────

DAY_START = time(7, 0)   # earliest training window each day
DAY_END = time(20, 0)    # latest training window each day
MIN_GAP_MINUTES = 75     # minimum open window to consider a training slot
BUFFER_MINUTES = 15      # gap to leave on either side of an existing event

# ── Recovery → session prescription ───────────────────────────────────────────

def session_for_recovery(recovery_score):
    """Return the type, intensity, and duration for a given recovery score."""
    if recovery_score is None:
        return {"label": "Light hit", "duration": 60, "intensity": "low", "description": "No recovery data — default to light hitting until WHOOP syncs."}
    if recovery_score >= 67:
        return {"label": "High intensity training", "duration": 120, "intensity": "high",
                "description": f"Recovery {recovery_score}%. Match-intensity work — point play, conditioning, top-end speed."}
    if recovery_score >= 34:
        return {"label": "Technical session", "duration": 90, "intensity": "moderate",
                "description": f"Recovery {recovery_score}%. Technique work, controlled tempo drills, tactical patterns. No max efforts."}
    return {"label": "Active recovery", "duration": 45, "intensity": "low",
            "description": f"Recovery {recovery_score}%. Light hitting only, mobility, stretching. Rest is the work today."}


# ── WHOOP read ────────────────────────────────────────────────────────────────

def latest_recovery():
    """Read most recent WHOOP file and return recovery score as int."""
    files = sorted([f for f in WHOOP_DIR.glob("*.md") if re.match(r"\d{4}-\d{2}-\d{2}\.md", f.name)])
    if not files:
        return None
    text = files[-1].read_text(encoding="utf-8")
    m = re.search(r"\*\*Score:\*\*\s*(\d+)%", text)
    return int(m.group(1)) if m else None


# ── Calendar window finder ────────────────────────────────────────────────────

def parse_event_time(iso_str):
    """Parse a Google Calendar ISO timestamp into a timezone-aware datetime."""
    if not iso_str:
        return None
    if "T" not in iso_str:
        # All-day event — treat as full day
        d = datetime.strptime(iso_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return d
    # Strip Z and parse
    s = iso_str.replace("Z", "+00:00")
    return datetime.fromisoformat(s)


def find_open_windows(events, days=7):
    """
    Walk through the next N days. For each day, find gaps between events
    that are ≥ MIN_GAP_MINUTES inside the daily window (DAY_START → DAY_END).
    Returns a list of {date, start, end, duration_minutes} dicts.
    """
    now = datetime.now().astimezone()
    windows = []

    # Group events by date
    by_date = {}
    for ev in events:
        if ev.get("all_day"):
            continue
        start = parse_event_time(ev["start"])
        end = parse_event_time(ev["end"])
        if not start or not end:
            continue
        start_local = start.astimezone()
        end_local = end.astimezone()
        date_key = start_local.date()
        by_date.setdefault(date_key, []).append((start_local, end_local))

    for offset in range(days):
        day = (now + timedelta(days=offset)).date()
        day_start = datetime.combine(day, DAY_START).astimezone()
        day_end = datetime.combine(day, DAY_END).astimezone()

        # Don't propose windows in the past
        cursor = max(day_start, now + timedelta(minutes=10))

        day_events = sorted(by_date.get(day, []), key=lambda x: x[0])

        for ev_start, ev_end in day_events:
            if ev_start > cursor:
                gap_minutes = (ev_start - cursor).total_seconds() / 60 - BUFFER_MINUTES
                if gap_minutes >= MIN_GAP_MINUTES:
                    windows.append({
                        "date": day.isoformat(),
                        "start": cursor,
                        "end": ev_start - timedelta(minutes=BUFFER_MINUTES),
                        "duration_minutes": int(gap_minutes),
                    })
            cursor = max(cursor, ev_end + timedelta(minutes=BUFFER_MINUTES))

        # End of day window
        if cursor < day_end:
            gap_minutes = (day_end - cursor).total_seconds() / 60
            if gap_minutes >= MIN_GAP_MINUTES:
                windows.append({
                    "date": day.isoformat(),
                    "start": cursor,
                    "end": day_end,
                    "duration_minutes": int(gap_minutes),
                })

    return windows


# ── Proposal generator ────────────────────────────────────────────────────────

def propose_week(days=7):
    """
    Build a list of proposed training blocks for the next N days.
    Today uses today's recovery. Future days use a generic prescription
    until WHOOP data exists for that day.
    """
    events = calendar_sync.list_upcoming(days=days)
    windows = find_open_windows(events, days=days)
    recovery = latest_recovery()
    base_session = session_for_recovery(recovery)

    # One training block per day, choose the first qualifying window
    seen_dates = set()
    proposals = []
    for w in windows:
        if w["date"] in seen_dates:
            continue
        seen_dates.add(w["date"])

        is_today = w["date"] == datetime.now().date().isoformat()
        session = base_session if is_today else session_for_recovery(None)

        duration = min(session["duration"], w["duration_minutes"] - 5)
        session_end = w["start"] + timedelta(minutes=duration)

        proposals.append({
            "date": w["date"],
            "is_today": is_today,
            "start_iso": w["start"].isoformat(),
            "end_iso": session_end.isoformat(),
            "title": f"Tennis — {session['label']}",
            "description": session["description"],
            "intensity": session["intensity"],
            "duration_minutes": duration,
            "window_minutes": w["duration_minutes"],
        })

    return {"recovery": recovery, "proposals": proposals}


# ── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    result = propose_week(days=7)
    print(f"\nWHOOP Recovery: {result['recovery']}%\n")
    if not result["proposals"]:
        print("No open training windows found in the next 7 days.")
    else:
        print("Proposed training blocks:\n")
        for p in result["proposals"]:
            tag = " (today)" if p["is_today"] else ""
            print(f"  {p['date']}{tag}  {p['start_iso'][11:16]}–{p['end_iso'][11:16]}  {p['title']}")
            print(f"    -> {p['description']}\n")
