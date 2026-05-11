"""
iCloud Calendar sync via CalDAV.

Requires an app-specific password (NOT your Apple ID password).
Generate one at: appleid.apple.com > Sign-In and Security > App-Specific Passwords
"""

from datetime import datetime, timedelta, timezone

ICLOUD_CALDAV_URL = "https://caldav.icloud.com"


def list_upcoming(apple_id: str, app_password: str, days: int = 7):
    """Return upcoming iCloud Calendar events as a list of dicts."""
    import caldav
    from icalendar import Calendar as iCal

    client = caldav.DAVClient(
        url=ICLOUD_CALDAV_URL,
        username=apple_id,
        password=app_password,
    )

    principal = client.principal()
    calendars = principal.calendars()

    now = datetime.now(timezone.utc)
    end = now + timedelta(days=days)

    events = []
    for cal in calendars:
        try:
            cal_events = cal.date_search(start=now, end=end, expand=True)
            for ev in cal_events:
                try:
                    ical = iCal.from_ical(ev.data)
                    for component in ical.walk():
                        if component.name != "VEVENT":
                            continue
                        dtstart = component.get("DTSTART")
                        dtend   = component.get("DTEND")
                        summary  = str(component.get("SUMMARY", "Untitled"))
                        location = str(component.get("LOCATION", ""))

                        if not dtstart:
                            continue

                        dt_val = dtstart.dt
                        if hasattr(dt_val, "hour"):
                            if dt_val.tzinfo is None:
                                dt_val = dt_val.replace(tzinfo=timezone.utc)
                            all_day   = False
                            start_iso = dt_val.isoformat()
                        else:
                            all_day   = True
                            start_iso = dt_val.isoformat()

                        if dtend:
                            dt_end = dtend.dt
                            if hasattr(dt_end, "hour"):
                                if dt_end.tzinfo is None:
                                    dt_end = dt_end.replace(tzinfo=timezone.utc)
                                end_iso = dt_end.isoformat()
                            else:
                                end_iso = dt_end.isoformat()
                        else:
                            end_iso = start_iso

                        events.append({
                            "title":    summary,
                            "start":    start_iso,
                            "end":      end_iso,
                            "all_day":  all_day,
                            "location": location,
                            "source":   "icloud",
                        })
                except Exception:
                    pass
        except Exception:
            pass

    events.sort(key=lambda e: e["start"])
    return events
