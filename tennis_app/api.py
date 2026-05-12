"""
JarvisAPI — Python backend exposed to the frontend via PyWebView.
All data reads happen here. Frontend just calls these methods.
"""

import json
import re
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path

VAULT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(VAULT_ROOT))
WHOOP_DIR = VAULT_ROOT / "03 Projects" / "Tennis" / "WHOOP Data"
MATCH_LOG_DIR = VAULT_ROOT / "03 Projects" / "Tennis" / "Match Log"
MATCH_SCHEDULE = VAULT_ROOT / "03 Projects" / "Tennis" / "(C) Match Schedule.md"
PLAYERS_FILE = VAULT_ROOT / "players.json"
GOALS_FILE = VAULT_ROOT / "GOALS.md"
WHOOP_SYNC_SCRIPT = VAULT_ROOT / "whoop_sync.py"


def _load_env():
    env_file = VAULT_ROOT / ".env"
    env = {}
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


# ── Council agent definitions ─────────────────────────────────────────────────

COUNCIL_AGENTS = [
    {
        "id": "head-coach",
        "name": "Head Coach",
        "role": "Technique & Tactics",
        "icon": "🎾",
        "color": "#0ea5e9",
        "model": "claude-haiku-4-5-20251001",
        "system": (
            "You are the Head Coach on Colby Oosthuizen's personal tennis advisory council — his JARVIS. "
            "Speak precisely, analytically, with dry wit. Focus: stroke mechanics, tactical patterns, "
            "match preparation, opponent reading. You have access to his WHOOP recovery and calendar. "
            "Give 3-4 sentences of sharp, actionable coaching insight. No fluff. No lists."
        ),
    },
    {
        "id": "sc-coach",
        "name": "S&C Coach",
        "role": "Strength & Conditioning",
        "icon": "⚡",
        "color": "#f59e0b",
        "model": "claude-haiku-4-5-20251001",
        "system": (
            "You are the S&C Coach on Colby's tennis council — his JARVIS. "
            "Speak precisely. Focus: training load, periodization, injury prevention, athletic development. "
            "You have his WHOOP recovery, strain, and sleep data. "
            "Give 3-4 sentences of sharp, actionable conditioning guidance. No fluff. No lists."
        ),
    },
    {
        "id": "tournament-advisor",
        "name": "Tournament Advisor",
        "role": "Competition & Peaking",
        "icon": "🏆",
        "color": "#8b5cf6",
        "model": "claude-haiku-4-5-20251001",
        "system": (
            "You are the Tournament Advisor on Colby's tennis council — his JARVIS. "
            "Speak precisely. Focus: competition calendar, scheduling, peaking cycles, draw strategy, travel logistics. "
            "Give 3-4 sentences of sharp tournament strategy. No fluff."
        ),
    },
    {
        "id": "sports-psych",
        "name": "Sports Psychologist",
        "role": "Mental Performance",
        "icon": "🧠",
        "color": "#ec4899",
        "model": "claude-haiku-4-5-20251001",
        "system": (
            "You are the Sports Psychologist on Colby's tennis council — his JARVIS. "
            "Speak precisely. Focus: competitive mindset, pressure management, confidence, focus routines, mental edge. "
            "Give 3-4 sentences of sharp psychological insight. No fluff."
        ),
    },
    {
        "id": "nutritionist",
        "name": "Nutritionist",
        "role": "Fuel & Recovery",
        "icon": "🥗",
        "color": "#10b981",
        "model": "claude-haiku-4-5-20251001",
        "system": (
            "You are the Nutritionist on Colby's tennis council — his JARVIS. "
            "Speak precisely. Focus: match-day nutrition, hydration, pre/post training fuel, recovery eating. "
            "Use his WHOOP strain and sleep data to inform recommendations. "
            "Give 3-4 sentences of sharp, practical nutrition advice. No fluff."
        ),
    },
    {
        "id": "recovery-specialist",
        "name": "Recovery Specialist",
        "role": "Sleep & HRV",
        "icon": "💤",
        "color": "#6366f1",
        "model": "claude-haiku-4-5-20251001",
        "system": (
            "You are the Recovery Specialist on Colby's tennis council — his JARVIS. "
            "Speak precisely. Focus: sleep quality, HRV trends, parasympathetic activation, recovery protocols, red flags. "
            "You have full WHOOP data. Give 3-4 sentences of sharp recovery insight. No fluff."
        ),
    },
]

JARVIS_SYSTEM = """\
You are JARVIS — Chief of Staff of Colby Oosthuizen's personal tennis advisory council.
You are his Iron Man suit for tennis: precise, dry wit, always one step ahead.

You receive input from 6 specialist advisors and synthesize their views into one clear, actionable brief.

Format your response in exactly this structure:
VERDICT: [one sentence — the headline decision or key insight]
REASONING: [2-3 sentences weaving the most important threads from the council, grounded in the data]
ACTION: [one specific thing Colby should do today or this week]

Speak like JARVIS: precise, confident, slight wit. Never verbose.\
"""

CHAT_SYSTEM = """\
You are JARVIS — Colby Oosthuizen's personal AI chief of staff for tennis.
You are his Iron Man suit. Precise, analytical, a touch of dry wit. Never verbose.

You have access to his full data: WHOOP recovery, calendar, match history.
When he asks questions, give sharp, direct, actionable answers.
You know his goals, his schedule, his physical state.

Keep responses tight. Lead with the answer. Support with data when relevant. End with action when useful.\
"""


class JarvisAPI:

    def __init__(self):
        self._window = None
        self._env = _load_env()
        self._sync_status = {
            "whoop_last": None,
            "calendar_last": None,
            "whoop_syncing": False,
            "calendar_syncing": False,
        }
        self._stop_sync = threading.Event()
        self._anthropic = None

    # ── Window & sync ─────────────────────────────────────────────────────────

    def set_window(self, window):
        self._window = window

    def start_auto_sync(self):
        self._stop_sync.clear()
        t = threading.Thread(target=self._sync_loop, daemon=True)
        t.start()

    def _sync_loop(self):
        whoop_interval = 30 * 60
        cal_interval = 5 * 60
        last_whoop = 0
        last_cal = 0
        while not self._stop_sync.is_set():
            now = time.time()
            if now - last_cal >= cal_interval:
                self._bg_sync_calendar()
                last_cal = time.time()
            if now - last_whoop >= whoop_interval:
                self._bg_sync_whoop()
                last_whoop = time.time()
            self._stop_sync.wait(timeout=30)

    def _bg_sync_whoop(self):
        self._sync_status["whoop_syncing"] = True
        self._push_js("window._onSyncStatus && window._onSyncStatus('whoop','syncing')")
        result = self.sync_whoop()
        self._sync_status["whoop_syncing"] = False
        if result.get("success"):
            self._sync_status["whoop_last"] = datetime.now().strftime("%H:%M")
            self._push_js("window._onAutoSync && window._onAutoSync('whoop')")
        status = "ok" if result.get("success") else "error"
        self._push_js(f"window._onSyncStatus && window._onSyncStatus('whoop','{status}')")

    def _bg_sync_calendar(self):
        self._sync_status["calendar_syncing"] = True
        self._push_js("window._onSyncStatus && window._onSyncStatus('calendar','syncing')")
        try:
            import calendar_sync
            calendar_sync.list_upcoming(days=7)
            self._sync_status["calendar_last"] = datetime.now().strftime("%H:%M")
            self._push_js("window._onAutoSync && window._onAutoSync('calendar')")
            self._push_js("window._onSyncStatus && window._onSyncStatus('calendar','ok')")
        except Exception:
            self._push_js("window._onSyncStatus && window._onSyncStatus('calendar','error')")
        self._sync_status["calendar_syncing"] = False

    def _push_js(self, js):
        if self._window:
            try:
                self._window.evaluate_js(js)
            except Exception:
                pass

    def get_sync_status(self):
        return dict(self._sync_status)

    # ── Anthropic client ──────────────────────────────────────────────────────

    def _get_anthropic(self):
        if self._anthropic is None:
            try:
                import anthropic
                key = self._env.get("ANTHROPIC_API_KEY", "")
                if not key:
                    return None
                self._anthropic = anthropic.Anthropic(api_key=key)
            except ImportError:
                return None
        return self._anthropic

    def check_anthropic_key(self):
        return {"has_key": bool(self._env.get("ANTHROPIC_API_KEY", ""))}

    def save_anthropic_key(self, key):
        try:
            env_file = VAULT_ROOT / ".env"
            lines = []
            if env_file.exists():
                lines = [l for l in env_file.read_text(encoding="utf-8").splitlines()
                         if not l.startswith("ANTHROPIC_API_KEY")]
            lines.append(f"ANTHROPIC_API_KEY={key.strip()}")
            env_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
            self._env["ANTHROPIC_API_KEY"] = key.strip()
            self._anthropic = None
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Context builder ───────────────────────────────────────────────────────

    def _build_context(self):
        parts = []

        whoop = self.get_latest_whoop()
        if not whoop.get("error"):
            parts.append(
                f"WHOOP ({whoop.get('date', 'today')}):\n"
                f"  Recovery: {whoop.get('recovery', '?')}% | "
                f"HRV: {whoop.get('hrv', '?')} ms | "
                f"RHR: {whoop.get('rhr', '?')} bpm | "
                f"Sleep: {whoop.get('sleep_hours', '?')} hrs ({whoop.get('sleep_efficiency', '?')}% efficiency) | "
                f"Strain: {whoop.get('strain', '?')} | "
                f"Calories: {whoop.get('calories', '?')} kcal"
            )
        else:
            parts.append("WHOOP: No data available.")

        try:
            import calendar_sync
            events = calendar_sync.list_upcoming(days=7)
            if events:
                lines = []
                for ev in events[:10]:
                    s = ev.get("start", "")
                    if "T" in s:
                        s = s[5:16].replace("T", " ")
                    lines.append(f"  - {ev.get('title','Untitled')} ({s})")
                parts.append("CALENDAR (next 7 days):\n" + "\n".join(lines))
            else:
                parts.append("CALENDAR: No events.")
        except Exception:
            parts.append("CALENDAR: Not connected.")

        if MATCH_LOG_DIR.exists():
            files = sorted(MATCH_LOG_DIR.glob("*.md"))[-3:]
            if files:
                summaries = []
                for f in files:
                    t = f.read_text(encoding="utf-8")
                    rm = re.search(r"\*\*Result:\*\*\s*(.+)", t)
                    pm = re.search(r"\*\*Players:\*\*\s*(.+)", t)
                    summaries.append(
                        f"  - {f.stem}: vs {pm.group(1).strip() if pm else '?'} | {rm.group(1).strip() if rm else '?'}"
                    )
                parts.append("RECENT MATCHES:\n" + "\n".join(summaries))

        return "\n\n".join(parts)

    # ── Chat ──────────────────────────────────────────────────────────────────

    def chat_message(self, messages):
        """Send a message to Jarvis. messages = [{role, content}, ...]"""
        client = self._get_anthropic()
        if not client:
            return {"success": False, "error": "Add your ANTHROPIC_API_KEY in Settings to enable AI chat."}
        try:
            context = self._build_context()
            system = CHAT_SYSTEM + f"\n\n--- LIVE DATA ---\n{context}"
            resp = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=system,
                messages=messages,
            )
            return {"success": True, "content": resp.content[0].text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Council ───────────────────────────────────────────────────────────────

    def council_ask(self, question):
        """Brief all 7 advisors. Runs 6 agents in parallel, Jarvis synthesizes."""
        client = self._get_anthropic()
        if not client:
            return {"success": False, "error": "Add your ANTHROPIC_API_KEY in Settings to use the Council."}

        context = self._build_context()
        user_msg = f"Question from Colby: {question}\n\n--- DATA ---\n{context}"

        def ask_agent(agent):
            try:
                r = client.messages.create(
                    model=agent["model"],
                    max_tokens=300,
                    system=agent["system"],
                    messages=[{"role": "user", "content": user_msg}],
                )
                return {**agent, "response": r.content[0].text, "error": None}
            except Exception as e:
                return {**agent, "response": None, "error": str(e)}

        responses = []
        with ThreadPoolExecutor(max_workers=6) as ex:
            futures = {ex.submit(ask_agent, a): a for a in COUNCIL_AGENTS}
            for f in as_completed(futures):
                responses.append(f.result())

        order = {a["id"]: i for i, a in enumerate(COUNCIL_AGENTS)}
        responses.sort(key=lambda x: order.get(x["id"], 99))

        council_text = "\n\n".join(
            f"{r['name']} ({r['role']}): {r['response'] or '[no response]'}"
            for r in responses
        )
        synthesis_input = f"Question: {question}\n\nCouncil:\n{council_text}\n\nData:\n{context}"

        try:
            jr = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=400,
                system=JARVIS_SYSTEM,
                messages=[{"role": "user", "content": synthesis_input}],
            )
            jarvis = jr.content[0].text
        except Exception as e:
            jarvis = f"Synthesis error: {e}"

        return {"success": True, "question": question, "agents": responses, "jarvis": jarvis}

    def draft_message(self, payload):
        """Draft a WhatsApp/text message to send on Colby's behalf."""
        client = self._get_anthropic()
        if not client:
            return {"success": False, "error": "Add your ANTHROPIC_API_KEY in Settings."}

        recipient = payload.get("recipient", "")
        purpose = payload.get("purpose", "")
        extra = payload.get("context", "")
        ctx = self._build_context()

        prompt = (
            f"Draft a WhatsApp message from Colby Oosthuizen to {recipient}.\n"
            f"Purpose: {purpose}\n"
            + (f"Extra context: {extra}\n" if extra else "")
            + f"\nData context:\n{ctx}\n\n"
            "Write only the message text, ready to copy-paste. "
            "Natural, direct, concise. No explanation, no quotes around it."
        )

        try:
            r = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )
            return {"success": True, "draft": r.content[0].text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── WHOOP ─────────────────────────────────────────────────────────────────

    def get_latest_whoop(self):
        files = sorted([f for f in WHOOP_DIR.glob("*.md")
                        if re.match(r"\d{4}-\d{2}-\d{2}\.md", f.name)])
        if not files:
            return {"error": "No WHOOP data. Click Sync."}
        text = files[-1].read_text(encoding="utf-8")

        def find(pattern):
            m = re.search(pattern, text)
            return m.group(1).strip() if m else None

        return {
            "date": files[-1].stem,
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
        try:
            result = subprocess.run(
                [sys.executable, str(WHOOP_SYNC_SCRIPT)],
                cwd=str(VAULT_ROOT),
                capture_output=True,
                text=True,
                timeout=60,
            )
            if result.returncode == 0:
                return {"success": True}
            return {"success": False, "error": result.stderr or result.stdout}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Schedule & matches ────────────────────────────────────────────────────

    def get_schedule(self):
        if not MATCH_SCHEDULE.exists():
            return []
        text = MATCH_SCHEDULE.read_text(encoding="utf-8")
        section = re.search(r"## Upcoming\s*\n(.*?)## Past Matches", text, re.DOTALL)
        if not section:
            return []
        rows = []
        for line in section.group(1).splitlines():
            if (line.startswith("|") and not line.startswith("|---")
                    and "Date" not in line and "_No" not in line):
                cells = [c.strip() for c in line.strip("|").split("|")]
                if len(cells) >= 6 and cells[0]:
                    rows.append({
                        "date": cells[0], "time": cells[1], "type": cells[2],
                        "players": cells[3], "location": cells[4], "status": cells[5],
                    })
        return rows

    def log_match(self, payload):
        try:
            date = payload.get("date") or datetime.now().strftime("%Y-%m-%d")
            match_type = payload.get("type", "Singles").strip()
            players = payload.get("players", "").strip()
            location = payload.get("location", "").strip()
            result = payload.get("result", "").strip()
            notes = payload.get("notes", "").strip()
            recovery = payload.get("recovery", "")

            MATCH_LOG_DIR.mkdir(parents=True, exist_ok=True)
            safe = re.sub(r"[^\w\s-]", "", players).replace(" ", "-") or "match"
            filepath = MATCH_LOG_DIR / f"(C) {date} {safe}.md"

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
            return {"success": True, "file": filepath.name}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── System ────────────────────────────────────────────────────────────────

    def open_vault_in_obsidian(self):
        """Open the vault in Obsidian using the obsidian:// URI scheme."""
        try:
            vault_name = VAULT_ROOT.name
            import urllib.parse
            uri = f"obsidian://open?vault={urllib.parse.quote(vault_name)}"
            subprocess.Popen(f'start "" "{uri}"', shell=True)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def open_vault_in_explorer(self):
        try:
            subprocess.Popen(f'explorer "{VAULT_ROOT}"')
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_app_info(self):
        return {
            "vault": str(VAULT_ROOT),
            "version": "0.3.0",
            "anthropic_ready": bool(self._env.get("ANTHROPIC_API_KEY")),
        }

    # ── iCloud Calendar ───────────────────────────────────────────────────────

    def icloud_status(self):
        apple_id = self._env.get("ICLOUD_APPLE_ID", "")
        app_pw   = self._env.get("ICLOUD_APP_PASSWORD", "")
        return {"connected": bool(apple_id and app_pw), "apple_id": apple_id}

    def icloud_save_credentials(self, apple_id, app_password):
        try:
            env_file = VAULT_ROOT / ".env"
            lines = []
            if env_file.exists():
                lines = [l for l in env_file.read_text(encoding="utf-8").splitlines()
                         if not l.startswith("ICLOUD_APPLE_ID")
                         and not l.startswith("ICLOUD_APP_PASSWORD")]
            lines.append(f"ICLOUD_APPLE_ID={apple_id.strip()}")
            lines.append(f"ICLOUD_APP_PASSWORD={app_password.strip()}")
            env_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
            self._env["ICLOUD_APPLE_ID"]    = apple_id.strip()
            self._env["ICLOUD_APP_PASSWORD"] = app_password.strip()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def icloud_test(self):
        """Test iCloud credentials by fetching the calendar list."""
        apple_id = self._env.get("ICLOUD_APPLE_ID", "")
        app_pw   = self._env.get("ICLOUD_APP_PASSWORD", "")
        if not apple_id or not app_pw:
            return {"success": False, "error": "Credentials not saved yet."}
        try:
            import icloud_sync
            events = icloud_sync.list_upcoming(apple_id, app_pw, days=1)
            return {"success": True, "count": len(events)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _icloud_events(self, days=7):
        apple_id = self._env.get("ICLOUD_APPLE_ID", "")
        app_pw   = self._env.get("ICLOUD_APP_PASSWORD", "")
        if not apple_id or not app_pw:
            return []
        try:
            import icloud_sync
            return icloud_sync.list_upcoming(apple_id, app_pw, days=days)
        except Exception:
            return []

    # ── Google Calendar ───────────────────────────────────────────────────────

    def calendar_status(self):
        return {
            "credentials_present": (VAULT_ROOT / "google_credentials.json").exists(),
            "authenticated": (VAULT_ROOT / ".google_token.json").exists(),
            "icloud": self.icloud_status(),
        }

    def calendar_authenticate(self):
        try:
            import calendar_sync
            calendar_sync._load_credentials()
            return {"success": True}
        except FileNotFoundError:
            return {"success": False, "error": "google_credentials.json missing from vault folder."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def calendar_upcoming(self, days=7):
        """Return merged events from Google Calendar + iCloud Calendar."""
        events = []
        google_err = None

        # Google Calendar
        try:
            import calendar_sync
            google_events = calendar_sync.list_upcoming(days=days)
            for ev in google_events:
                ev["source"] = "google"
            events.extend(google_events)
        except FileNotFoundError:
            google_err = "Google Calendar not authenticated."
        except Exception as e:
            google_err = str(e)

        # iCloud Calendar
        icloud_events = self._icloud_events(days=days)
        events.extend(icloud_events)

        if not events and google_err:
            return {"success": False, "error": google_err}

        # Merge and sort by start time
        events.sort(key=lambda e: e.get("start", ""))
        return {"success": True, "events": events, "google_error": google_err}

    def calendar_create_event(self, payload):
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

    # ── Players & Outreach ────────────────────────────────────────────────────

    def get_players(self):
        try:
            if not PLAYERS_FILE.exists():
                return []
            return json.loads(PLAYERS_FILE.read_text(encoding="utf-8"))
        except Exception:
            return []

    def save_player(self, payload):
        try:
            players = self.get_players()
            pid = payload.get("id")
            if pid:
                players = [p for p in players if p.get("id") != pid]
            else:
                import uuid
                payload["id"] = str(uuid.uuid4())
            players.append(payload)
            PLAYERS_FILE.write_text(json.dumps(players, indent=2), encoding="utf-8")
            return {"success": True, "player": payload}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_player(self, pid):
        try:
            players = [p for p in self.get_players() if p.get("id") != pid]
            PLAYERS_FILE.write_text(json.dumps(players, indent=2), encoding="utf-8")
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def analyze_capacity(self):
        """Read WHOOP + calendar and return today's training capacity with open slots."""
        client = self._get_anthropic()
        if not client:
            return {"success": False, "error": "Add ANTHROPIC_API_KEY in Settings."}

        context = self._build_context()

        prompt = f"""You are Jarvis analyzing Colby's schedule for match scheduling.

{context}

Based on his WHOOP recovery and today's calendar, determine:
1. How many tennis matches he can fit in (be specific: 0, 1, 2, or 3)
2. Whether gym/conditioning is also viable today
3. Which time slots are open for matches (be specific with times)
4. A one-line summary to show the player

Respond in this exact JSON format:
{{
  "match_capacity": 2,
  "gym_viable": true,
  "summary": "Recovery 78% — you can handle 2 matches + gym today.",
  "slots": ["10:00 AM – 12:00 PM", "3:00 PM – 5:00 PM"],
  "reasoning": "HRV and recovery score are in the green zone. Calendar is clear in the morning and mid-afternoon."
}}"""

        try:
            resp = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = resp.content[0].text.strip()
            # Extract JSON from response
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if m:
                data = json.loads(m.group())
                return {"success": True, **data}
            return {"success": False, "error": "Could not parse capacity response."}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def generate_outreach(self, payload):
        """Generate WhatsApp messages for selected players based on available slots."""
        client = self._get_anthropic()
        if not client:
            return {"success": False, "error": "Add ANTHROPIC_API_KEY in Settings."}

        player_ids = [str(x) for x in payload.get("player_ids", [])]
        slots = payload.get("slots", 1)
        context_note = payload.get("note", "")

        all_players = self.get_players()
        selected = [p for p in all_players if str(p.get("id")) in player_ids]
        if not selected:
            return {"success": False, "error": "No players selected."}

        if isinstance(slots, int):
            slots_str = f"{slots} slot{'s' if slots != 1 else ''} available today"
        elif isinstance(slots, list):
            slots_str = ", ".join(slots) if slots else "flexible — suggest a time that works"
        else:
            slots_str = str(slots)
        whoop = self.get_latest_whoop()
        recovery = whoop.get("recovery", "?") if not whoop.get("error") else "?"

        def generate_for_player(player):
            name = player.get("name", "mate")
            level = player.get("level", "")
            notes = player.get("notes", "")

            prompt = f"""Draft a short, casual WhatsApp message from Colby Oosthuizen to {name} asking to play tennis.

Context:
- Colby's recovery today: {recovery}%
- Available slots: {slots_str}
- Match type context: {context_note or "just looking to get a game in"}
- Player notes: {notes or "none"}
- Player level: {level or "unknown"}

Write a natural, friendly WhatsApp message. Keep it short (2-4 sentences). Don't be formal. Sound like a real person texting a tennis mate. Suggest the time slots naturally. End with a question.

Write ONLY the message text, ready to send."""

            try:
                resp = client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=200,
                    messages=[{"role": "user", "content": prompt}],
                )
                msg = resp.content[0].text.strip()
                phone = player.get("phone", "").replace(" ", "").replace("-", "")
                import urllib.parse
                wa_link = f"https://wa.me/{phone}?text={urllib.parse.quote(msg)}" if phone else None
                return {
                    "player": player,
                    "message": msg,
                    "wa_link": wa_link,
                    "error": None,
                }
            except Exception as e:
                return {"player": player, "message": None, "wa_link": None, "error": str(e)}

        results = []
        with ThreadPoolExecutor(max_workers=5) as ex:
            futures = [ex.submit(generate_for_player, p) for p in selected]
            for f in futures:
                results.append(f.result())

        return {"success": True, "messages": results}

    def send_whatsapp(self, phone, message):
        """Send a WhatsApp message via WhatsApp Web automation (pywhatkit)."""
        try:
            import pywhatkit as pwk

            # Normalise phone number — must start with + and country code
            phone = str(phone).strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            if not phone.startswith("+"):
                phone = "+" + phone

            # sendwhatmsg_instantly opens WhatsApp Web, waits for load, then sends
            # wait_time=12 gives WhatsApp Web 12 seconds to load before typing
            pwk.sendwhatmsg_instantly(
                phone_no=phone,
                message=message,
                wait_time=12,
                tab_close=True,
                close_time=3,
            )
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── Training scheduler ────────────────────────────────────────────────────

    def schedule_propose_week(self):
        try:
            import training_scheduler
            return {"success": True, **training_scheduler.propose_week(days=7)}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def schedule_accept_block(self, payload):
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
