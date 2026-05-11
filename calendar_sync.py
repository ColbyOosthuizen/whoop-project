"""
Google Calendar sync — handles OAuth and provides read/write helpers.

Setup required (one-time):
  1. Go to https://console.cloud.google.com
  2. Create a new project (name it anything, e.g. "Jarvis Tennis")
  3. Enable the Google Calendar API
  4. APIs & Services → OAuth consent screen → External → fill in basics
  5. Credentials → Create credentials → OAuth client ID → Desktop app
  6. Download the JSON, save it in this vault as: google_credentials.json
  7. Run this script — a browser window opens for you to approve access
"""

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

VAULT_ROOT = Path(__file__).parent
CREDENTIALS_FILE = VAULT_ROOT / "google_credentials.json"
TOKEN_FILE = VAULT_ROOT / ".google_token.json"

SCOPES = ["https://www.googleapis.com/auth/calendar"]


def _load_credentials():
    """Load saved credentials or run OAuth flow if needed."""
    creds = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not CREDENTIALS_FILE.exists():
                raise FileNotFoundError(
                    f"Google credentials not found at {CREDENTIALS_FILE}.\n"
                    "Follow the setup steps in calendar_sync.py docstring."
                )
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_FILE), SCOPES)
            creds = flow.run_local_server(port=3001)

        TOKEN_FILE.write_text(creds.to_json())

    return creds


def get_service():
    """Build the Google Calendar API client."""
    creds = _load_credentials()
    return build("calendar", "v3", credentials=creds)


def list_upcoming(days=7, calendar_id="primary"):
    """Return events in the next N days from the specified calendar."""
    service = get_service()
    now = datetime.now(timezone.utc).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()

    events_result = service.events().list(
        calendarId=calendar_id,
        timeMin=now,
        timeMax=end,
        maxResults=50,
        singleEvents=True,
        orderBy="startTime",
    ).execute()

    events = events_result.get("items", [])
    parsed = []
    for ev in events:
        start = ev["start"].get("dateTime", ev["start"].get("date"))
        end_t = ev["end"].get("dateTime", ev["end"].get("date"))
        parsed.append({
            "id": ev["id"],
            "title": ev.get("summary", "(no title)"),
            "start": start,
            "end": end_t,
            "location": ev.get("location", ""),
            "description": ev.get("description", ""),
            "all_day": "date" in ev["start"],
        })
    return parsed


def list_calendars():
    """Return all calendars the user has access to."""
    service = get_service()
    result = service.calendarList().list().execute()
    return [
        {"id": c["id"], "summary": c.get("summary", ""), "primary": c.get("primary", False)}
        for c in result.get("items", [])
    ]


def create_event(title, start_iso, end_iso, location="", description="", calendar_id="primary"):
    """Create an event. start/end are ISO 8601 strings."""
    service = get_service()
    event_body = {
        "summary": title,
        "start": {"dateTime": start_iso},
        "end": {"dateTime": end_iso},
        "location": location,
        "description": description,
    }
    event = service.events().insert(calendarId=calendar_id, body=event_body).execute()
    return {"id": event["id"], "link": event.get("htmlLink", "")}


def delete_event(event_id, calendar_id="primary"):
    """Delete an event by ID."""
    service = get_service()
    service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
    return {"success": True}


# ── CLI usage ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"

    if cmd == "list":
        events = list_upcoming(days=7)
        if not events:
            print("No upcoming events in the next 7 days.")
        for ev in events:
            print(f"  {ev['start'][:16]} — {ev['title']} ({ev['location'] or 'no location'})")
    elif cmd == "auth":
        _load_credentials()
        print("Authenticated. Token saved to .google_token.json")
    elif cmd == "calendars":
        for c in list_calendars():
            primary = " [PRIMARY]" if c["primary"] else ""
            print(f"  {c['summary']}{primary} — {c['id']}")
    else:
        print(f"Unknown command: {cmd}")
        print("Usage: python calendar_sync.py [list|auth|calendars]")
