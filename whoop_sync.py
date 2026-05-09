"""
WHOOP daily sync — pulls recovery, strain, sleep, HRV and writes to vault.
Run manually or via scheduled task.
"""

import os
import json
import secrets
import webbrowser
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlencode, urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# ── Config ────────────────────────────────────────────────────────────────────

load_dotenv()
CLIENT_ID = os.getenv("WHOOP_CLIENT_ID")
CLIENT_SECRET = os.getenv("WHOOP_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:3000/callback"
TOKEN_FILE = Path(__file__).parent / ".whoop_token.json"
VAULT_DIR = Path(__file__).parent / "03 Projects" / "Tennis" / "WHOOP Data"
VAULT_DIR.mkdir(parents=True, exist_ok=True)

AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
API_BASE = "https://api.prod.whoop.com/developer/v2"

SCOPES = "offline read:cycles read:recovery read:sleep read:workout read:body_measurement read:profile"

# ── Auth ──────────────────────────────────────────────────────────────────────

auth_code = None
oauth_state = secrets.token_urlsafe(16)

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        params = parse_qs(urlparse(self.path).query)
        returned_state = params.get("state", [None])[0]
        error = params.get("error", [None])[0]

        if error:
            print(f"WHOOP returned an error: {error}")
            self.send_response(400)
            self.end_headers()
            self.wfile.write(f"<h2>Error: {error}</h2>".encode())
            return

        if returned_state != oauth_state:
            print("State mismatch — possible CSRF. Aborting.")
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"<h2>State mismatch error. Close this and try again.</h2>")
            return

        auth_code = params.get("code", [None])[0]
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"<h2>Authenticated! You can close this tab.</h2>")

    def log_message(self, *args):
        pass


def get_auth_code():
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "state": oauth_state,
    }
    url = f"{AUTH_URL}?{urlencode(params)}"
    print("Opening WHOOP login in browser...")
    webbrowser.open(url)

    server = HTTPServer(("localhost", 3000), CallbackHandler)
    server.timeout = 300
    print("Waiting for you to log in to WHOOP in the browser...")
    print("(You have 5 minutes)")
    while auth_code is None:
        server.handle_request()
    return auth_code


def fetch_tokens(code):
    resp = requests.post(TOKEN_URL, data={
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    })
    resp.raise_for_status()
    tokens = resp.json()
    tokens["fetched_at"] = datetime.now(timezone.utc).isoformat()
    TOKEN_FILE.write_text(json.dumps(tokens, indent=2))
    return tokens


def refresh_tokens(refresh_token):
    resp = requests.post(TOKEN_URL, data={
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    })
    resp.raise_for_status()
    tokens = resp.json()
    tokens["fetched_at"] = datetime.now(timezone.utc).isoformat()
    TOKEN_FILE.write_text(json.dumps(tokens, indent=2))
    return tokens


def get_access_token():
    if TOKEN_FILE.exists():
        tokens = json.loads(TOKEN_FILE.read_text())
        fetched = datetime.fromisoformat(tokens["fetched_at"])
        expires_in = tokens.get("expires_in", 3600)
        if datetime.now(timezone.utc) < fetched + timedelta(seconds=expires_in - 60):
            return tokens["access_token"]
        print("Token expired — refreshing...")
        tokens = refresh_tokens(tokens["refresh_token"])
        return tokens["access_token"]

    print("No token found — starting OAuth flow...")
    code = get_auth_code()
    if not code:
        raise RuntimeError("Failed to get auth code from WHOOP.")
    tokens = fetch_tokens(code)
    return tokens["access_token"]


# ── API calls ─────────────────────────────────────────────────────────────────

def api_get(path, token, params=None):
    resp = requests.get(f"{API_BASE}{path}", headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }, params=params)
    if resp.status_code == 401:
        raise RuntimeError("401 Unauthorized — token may be expired. Delete .whoop_token.json and re-run to re-authenticate.")
    resp.raise_for_status()
    return resp.json()


def get_latest_recovery(token):
    data = api_get("/recovery", token, params={"limit": 1})
    records = data.get("records", [])
    return records[0] if records else None


def get_latest_sleep(token):
    data = api_get("/activity/sleep", token, params={"limit": 1})
    records = data.get("records", [])
    return records[0] if records else None


def get_latest_strain(token):
    data = api_get("/cycle", token, params={"limit": 1})
    records = data.get("records", [])
    return records[0] if records else None


# ── Recommendation ────────────────────────────────────────────────────────────

def training_recommendation(recovery_score):
    if recovery_score is None:
        return "_No recovery data — check your WHOOP app._"
    if recovery_score >= 67:
        return f"**Green ({recovery_score}%) — Go hard.** Match play, high-intensity drills, conditioning. Your body is ready."
    elif recovery_score >= 34:
        return f"**Yellow ({recovery_score}%) — Take it steady.** Technique work, light hitting, tactical drills. Don't push it."
    else:
        return f"**Red ({recovery_score}%) — Rest day.** Light movement only. Pushing hard today will cost you tomorrow."


# ── Write to vault ────────────────────────────────────────────────────────────

def write_daily_note(recovery, sleep, strain):
    today = datetime.now().strftime("%Y-%m-%d")
    filepath = VAULT_DIR / f"{today}.md"

    # Extract values safely
    rec_score = round(recovery["score"]["recovery_score"]) if recovery else None
    hrv = round(recovery["score"]["hrv_rmssd_milli"], 1) if recovery else None
    rhr = round(recovery["score"]["resting_heart_rate"]) if recovery else None
    spo2 = round(recovery["score"].get("spo2_percentage", 0), 1) if recovery else None

    sleep_duration = round(sleep["score"]["stage_summary"]["total_in_bed_time_milli"] / 3600000, 1) if sleep else None
    sleep_efficiency = round(sleep["score"].get("sleep_efficiency_percentage", 0), 1) if sleep else None
    sleep_disturbances = sleep["score"].get("disturbances", "N/A") if sleep else None

    strain_score = round(strain["score"]["strain"], 1) if strain and strain.get("score") else None
    calories = round(strain["score"].get("kilojoule", 0) * 0.239006) if strain and strain.get("score") else None

    recommendation = training_recommendation(rec_score)

    note = f"""---
type: whoop
date: {today}
---

# WHOOP — {today}

## Recovery
- **Score:** {rec_score}%
- **HRV:** {hrv} ms
- **Resting HR:** {rhr} bpm
- **SpO2:** {spo2}%

## Sleep
- **Total:** {sleep_duration} hrs
- **Efficiency:** {sleep_efficiency}%
- **Disturbances:** {sleep_disturbances}

## Previous Day Strain
- **Score:** {strain_score}
- **Calories burned:** {calories} kcal

## Jarvis Recommendation
{recommendation}
"""

    filepath.write_text(note, encoding="utf-8")
    print(f"Written: {filepath}")
    return rec_score


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("WHOOP Sync starting...")
    token = get_access_token()

    recovery = get_latest_recovery(token)
    sleep = get_latest_sleep(token)
    strain = get_latest_strain(token)

    score = write_daily_note(recovery, sleep, strain)
    print(f"Done. Recovery today: {score}%")
