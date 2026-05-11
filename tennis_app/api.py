"""
JarvisAPI — Python backend exposed to the frontend via PyWebView.
All data reads happen here. Frontend just calls these methods.
"""

import json
import re
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

VAULT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(VAULT_ROOT))
WHOOP_DIR = VAULT_ROOT / "03 Projects" / "Tennis" / "WHOOP Data"
MATCH_LOG_DIR = VAULT_ROOT / "03 Projects" / "Tennis" / "Match Log"
MATCH_SCHEDULE = VAULT_ROOT / "03 Projects" / "Tennis" / "(C) Match Schedule.md"
PLAYERS_FILE = VAULT_ROOT / "03 Projects" / "Tennis" / "(C) Players.md"
GOALS_FILE = VAULT_ROOT / "GOALS.md"
WHOOP_SYNC_SCRIPT = VAULT_ROOT / "whoop_sync.py"


class JarvisAPI:
    """Bridge between the frontend and the vault."""

    # ── WHOOP ─────────────────────────────────────────────────────────────────

    def get_latest_whoop(self):
        """Return the most recent WHOOP daily log as structured data."""
        files = sorted([f for f in WHOOP_DIR.glob("*.md") if re.match(r"\d{4}-\d{2}-\d{2}\.md", f.name)])
        if not files:
            return {"error": "No WHOOP data yet. Click Sync to pull the latest."}

        latest = files[-1]
        text = latest.read_text(encoding="utf-8")

        def find(pattern):
            m = re.search(pattern, text)
            return m.group(1).strip() if m else None

        return {
            "date": latest.stem,
            "recovery": find(r"\*\*Score:\*\*\s*(\d+)%"),
            "hrv": find(r"\*\*HRV:\*\*\s*([\d.]+)\s*ms"),
            "rhr": find(r"\*\*Resting HR:\*\*\s*(\d+)\s*bpm"),
            "spo2": find(r"\*\*SpO2:\*\*\s*([\d.]+)%"),
            "sleep_hours": find(r"\*\*Total:\*\*\s*([\d.]+)\s*hrs"),
            "sleep_efficiency": find(r"\*\*Efficiency:\*\*\s*([\d.]+)%"),
            "strain": find(r"\*\*Score:\*\*\s*([\d.]+)\s*\n"),
            "calories": find(r"\*\*Calories burned:\*\*\s*(\d+)\s*kcal"),
            "recommendation": find(r"## Jarvis Recommendation\s*\n(.+?)(?:\n\n|$)") or "",
        }

    def sync_whoop(self):
        """Trigger a fresh WHOOP pull. Returns success/failure."""
        try:
            result = subprocess.run(
                [sys.executable, str(WHOOP_SYNC_SCRIPT)],
                cwd=str(VAULT_ROOT),
                capture_output=True,
                text=True,
                timeout=60,
            )
            if result.returncode == 0:
                return {"success": True, "output": result.stdout}
            return {"success": False, "error": result.stderr or result.stdout}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Schedule & matches ────────────────────────────────────────────────────

    def get_schedule(self):
        """Return upcoming matches from the schedule file."""
        if not MATCH_SCHEDULE.exists():
            return []
        text = MATCH_SCHEDULE.read_text(encoding="utf-8")
        # Parse upcoming table rows
        upcoming_section = re.search(r"## Upcoming\s*\n(.*?)## Past Matches", text, re.DOTALL)
        if not upcoming_section:
            return []
        rows = []
        for line in upcoming_section.group(1).splitlines():
            if line.startswith("|") and not line.startswith("|---") and "Date" not in line and "_No" not in line:
                cells = [c.strip() for c in line.strip("|").split("|")]
                if len(cells) >= 6 and cells[0]:
                    rows.append({
                        "date": cells[0],
                        "time": cells[1],
                        "type": cells[2],
                        "players": cells[3],
                        "location": cells[4],
                        "status": cells[5],
                    })
        return rows

    def log_match(self, payload):
        """Save a new match log file. payload is a dict with the form data."""
        try:
            date = payload.get("date") or datetime.now().strftime("%Y-%m-%d")
            match_type = payload.get("type", "").strip() or "Singles"
            players = payload.get("players", "").strip()
            location = payload.get("location", "").strip()
            result = payload.get("result", "").strip()
            notes = payload.get("notes", "").strip()
            recovery = payload.get("recovery", "")

            MATCH_LOG_DIR.mkdir(parents=True, exist_ok=True)
            safe_players = re.sub(r"[^\w\s-]", "", players).replace(" ", "-") or "match"
            filename = f"(C) {date} {safe_players}.md"
            filepath = MATCH_LOG_DIR / filename

            content = f"""---
type: match
date: {date}
project: Tennis
---

# Match — {date}

**Type:** {match_type}
**Players:** {players}
**Location:** {location}
**Result:** {result}

## WHOOP Pre-Match
- Recovery: {recovery}%

## How It Went
{notes}

## Action Items
- [ ] Review and add follow-ups
"""
            filepath.write_text(content, encoding="utf-8")
            return {"success": True, "file": str(filepath.name)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Goals & status ────────────────────────────────────────────────────────

    def get_goals_summary(self):
        """Return a quick summary from GOALS.md."""
        if not GOALS_FILE.exists():
            return ""
        text = GOALS_FILE.read_text(encoding="utf-8")
        return text[:2000]

    # ── System ────────────────────────────────────────────────────────────────

    def open_vault_in_explorer(self):
        """Open the vault folder in Windows Explorer."""
        try:
            subprocess.Popen(f'explorer "{VAULT_ROOT}"')
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_app_info(self):
        """Return info about the running app."""
        return {
            "vault": str(VAULT_ROOT),
            "version": "0.2.0",
            "started": datetime.now().isoformat(),
        }

    # ── Google Calendar ───────────────────────────────────────────────────────

    def calendar_status(self):
        """Check whether Google Calendar is configured and authenticated."""
        creds_exist = (VAULT_ROOT / "google_credentials.json").exists()
        token_exist = (VAULT_ROOT / ".google_token.json").exists()
        return {
            "credentials_present": creds_exist,
            "authenticated": token_exist,
            "setup_url": "https://console.cloud.google.com",
        }

    def calendar_authenticate(self):
        """Trigger the OAuth flow for Google Calendar."""
        try:
            import calendar_sync
            calendar_sync._load_credentials()
            return {"success": True}
        except FileNotFoundError as e:
            return {"success": False, "error": "Google credentials file missing. Save google_credentials.json in the vault folder first."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def calendar_upcoming(self, days=7):
        """Return upcoming events from the user's primary calendar."""
        try:
            import calendar_sync
            return {"success": True, "events": calendar_sync.list_upcoming(days=days)}
        except FileNotFoundError:
            return {"success": False, "error": "Not authenticated. Go to Settings and connect Google Calendar."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def calendar_create_event(self, payload):
        """Create a calendar event. payload: title, start_iso, end_iso, location, description."""
        try:
            import calendar_sync
            result = calendar_sync.create_event(
                title=payload["title"],
                start_iso=payload["start_iso"],
                end_iso=payload["end_iso"],
                location=payload.get("location", ""),
                description=payload.get("description", ""),
            )
            return {"success": True, "event": result}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Training scheduler ────────────────────────────────────────────────────

    def schedule_propose_week(self):
        """Generate training block proposals for the next 7 days."""
        try:
            import training_scheduler
            return {"success": True, **training_scheduler.propose_week(days=7)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def schedule_accept_block(self, payload):
        """Accept a single training block and write it to Google Calendar."""
        try:
            import calendar_sync
            result = calendar_sync.create_event(
                title=payload["title"],
                start_iso=payload["start_iso"],
                end_iso=payload["end_iso"],
                description=payload.get("description", ""),
            )
            return {"success": True, "event": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
