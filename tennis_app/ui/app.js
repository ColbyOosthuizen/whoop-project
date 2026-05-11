// Jarvis Tennis App — Frontend logic
// Talks to Python via window.pywebview.api

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Boot ─────────────────────────────────────────────────────────────

window.addEventListener('pywebviewready', async () => {
    bindNav();
    bindActions();
    startClock();
    await loadDashboard();
    await loadAppInfo();
    setDefaultDate();
});

// Fallback for when running in browser without pywebview
window.addEventListener('DOMContentLoaded', () => {
    bindNav();
    bindActions();
    startClock();
    setDefaultDate();
});

// ── Navigation ───────────────────────────────────────────────────────

function bindNav() {
    $$('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    $$('[data-view-shortcut]').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.viewShortcut));
    });
}

function switchView(view) {
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(s => s.classList.add('hidden'));
    const target = $(`#view-${view}`);
    if (target) target.classList.remove('hidden');
    const titleMap = {
        dashboard: 'Dashboard',
        council: 'The Council',
        matches: 'Matches',
        calendar: 'Calendar',
        settings: 'Settings',
    };
    $('#view-title').textContent = titleMap[view] || view;

    if (view === 'calendar') loadCalendar();
}

// ── Actions ──────────────────────────────────────────────────────────

function bindActions() {
    $('#sync-whoop')?.addEventListener('click', syncWhoop);
    $('#sync-whoop-2')?.addEventListener('click', syncWhoop);
    $('#open-vault')?.addEventListener('click', () => callAPI('open_vault_in_explorer'));
    $('#match-form')?.addEventListener('submit', handleMatchSubmit);
    $('#calendar-refresh')?.addEventListener('click', loadCalendarEvents);
    $('#event-form')?.addEventListener('submit', handleEventSubmit);
}

// ── Clock ────────────────────────────────────────────────────────────

function startClock() {
    const update = () => {
        const now = new Date();
        const opts = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        $('#datetime').textContent = now.toLocaleDateString('en-US', opts);
    };
    update();
    setInterval(update, 30000);
}

function setDefaultDate() {
    const today = new Date().toISOString().slice(0, 10);
    const dateInput = $('#m-date');
    if (dateInput) dateInput.value = today;
}

// ── API bridge ───────────────────────────────────────────────────────

async function callAPI(method, ...args) {
    if (!window.pywebview?.api) {
        console.warn('Not running inside PyWebView; mock response');
        return null;
    }
    try {
        return await window.pywebview.api[method](...args);
    } catch (err) {
        console.error(`API ${method} failed:`, err);
        return null;
    }
}

// ── Dashboard ────────────────────────────────────────────────────────

async function loadDashboard() {
    const whoop = await callAPI('get_latest_whoop');
    if (whoop && !whoop.error) renderWhoop(whoop);

    const schedule = await callAPI('get_schedule');
    renderSchedule(schedule || []);
}

function renderWhoop(data) {
    const recovery = parseInt(data.recovery, 10);
    $('#recovery-score').textContent = isNaN(recovery) ? '—' : `${recovery}%`;

    const zoneEl = $('#recovery-zone');
    zoneEl.classList.remove('zone-green', 'zone-yellow', 'zone-red');
    if (isNaN(recovery)) {
        zoneEl.textContent = 'No data';
    } else if (recovery >= 67) {
        zoneEl.textContent = 'Green — Go';
        zoneEl.classList.add('zone-green');
    } else if (recovery >= 34) {
        zoneEl.textContent = 'Yellow — Steady';
        zoneEl.classList.add('zone-yellow');
    } else {
        zoneEl.textContent = 'Red — Rest';
        zoneEl.classList.add('zone-red');
    }

    $('#metric-hrv').textContent = data.hrv ? `${data.hrv} ms` : '—';
    $('#metric-rhr').textContent = data.rhr ? `${data.rhr} bpm` : '—';
    $('#metric-spo2').textContent = data.spo2 ? `${data.spo2}%` : '—';
    $('#metric-sleep').textContent = data.sleep_hours ? `${data.sleep_hours} hrs` : '—';
    $('#metric-strain').textContent = data.strain ?? '—';
    $('#metric-calories').textContent = data.calories ? `${data.calories} kcal` : '—';

    $('#recommendation').innerHTML = data.recommendation
        ? markdownToHtml(data.recommendation)
        : '';

    // Auto-fill recovery in match form if blank
    const mr = $('#m-recovery');
    if (mr && !mr.value && !isNaN(recovery)) mr.value = recovery;
}

function renderSchedule(rows) {
    const list = $('#schedule-list');
    if (!rows || rows.length === 0) {
        list.innerHTML = '<div class="empty">No matches scheduled.</div>';
        return;
    }
    list.innerHTML = rows.map(r => `
        <div class="schedule-row">
            <span class="date">${escapeHtml(r.date)}</span>
            <span class="time">${escapeHtml(r.time)}</span>
            <span class="players">${escapeHtml(r.players)} · ${escapeHtml(r.location)}</span>
            <span class="muted">${escapeHtml(r.status)}</span>
        </div>
    `).join('');
}

async function syncWhoop() {
    const score = $('#recovery-score');
    const original = score.textContent;
    score.textContent = '...';
    const result = await callAPI('sync_whoop');
    if (result?.success) {
        await loadDashboard();
    } else {
        score.textContent = original;
        alert('WHOOP sync failed:\n\n' + (result?.error || 'Unknown error'));
    }
}

// ── Match form ───────────────────────────────────────────────────────

async function handleMatchSubmit(e) {
    e.preventDefault();
    const status = $('#match-status');
    status.textContent = 'Saving...';

    const payload = {
        date: $('#m-date').value,
        type: $('#m-type').value,
        players: $('#m-players').value,
        location: $('#m-location').value,
        result: $('#m-result').value,
        recovery: $('#m-recovery').value,
        notes: $('#m-notes').value,
    };

    const res = await callAPI('log_match', payload);
    if (res?.success) {
        status.textContent = `Saved → ${res.file}`;
        e.target.reset();
        setDefaultDate();
    } else {
        status.textContent = 'Failed: ' + (res?.error || 'unknown');
    }
}

// ── Google Calendar ──────────────────────────────────────────────────

async function loadCalendar() {
    const status = await callAPI('calendar_status');
    const setupCard = $('#calendar-setup-card');
    const statusEl = $('#calendar-setup-status');
    const eventsCard = $('#calendar-events-card');
    const createCard = $('#calendar-create-card');

    if (!status) {
        statusEl.innerHTML = '<p class="muted">App API unavailable.</p>';
        return;
    }

    if (!status.credentials_present) {
        setupCard.classList.remove('hidden');
        statusEl.innerHTML = `
            <p class="muted">Google Calendar isn't connected yet. One-time setup:</p>
            <ol class="muted" style="margin: 12px 0 12px 20px; line-height: 1.8;">
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" style="color:var(--accent)">console.cloud.google.com</a></li>
                <li>Create a project (any name, e.g. "Jarvis Tennis")</li>
                <li>Enable the Google Calendar API</li>
                <li>OAuth consent screen → External → fill in basics</li>
                <li>Credentials → Create credentials → OAuth client ID → Desktop app</li>
                <li>Download the JSON, rename it to <code>google_credentials.json</code></li>
                <li>Save it to your vault folder, then come back and click Connect</li>
            </ol>
            <button class="btn-primary" id="check-creds">I've added the credentials</button>
        `;
        $('#check-creds')?.addEventListener('click', loadCalendar);
        eventsCard.classList.add('hidden');
        createCard.classList.add('hidden');
        return;
    }

    if (!status.authenticated) {
        setupCard.classList.remove('hidden');
        statusEl.innerHTML = `
            <p class="muted">Credentials found. Now authenticate — a browser tab will open for you to approve access.</p>
            <button class="btn-primary" id="auth-google">Connect Google Calendar</button>
            <span id="auth-status" class="muted" style="margin-left: 12px;"></span>
        `;
        $('#auth-google')?.addEventListener('click', async () => {
            $('#auth-status').textContent = 'Opening browser...';
            const r = await callAPI('calendar_authenticate');
            if (r?.success) {
                $('#auth-status').textContent = 'Connected.';
                loadCalendar();
            } else {
                $('#auth-status').textContent = 'Failed: ' + (r?.error || 'unknown');
            }
        });
        eventsCard.classList.add('hidden');
        createCard.classList.add('hidden');
        return;
    }

    // Authenticated
    setupCard.classList.add('hidden');
    eventsCard.classList.remove('hidden');
    createCard.classList.remove('hidden');
    setDefaultEventTimes();
    loadCalendarEvents();
}

async function loadCalendarEvents() {
    const list = $('#calendar-events-list');
    list.innerHTML = '<div class="empty">Loading...</div>';
    const result = await callAPI('calendar_upcoming', 7);
    if (!result?.success) {
        list.innerHTML = `<div class="empty">${escapeHtml(result?.error || 'Failed to load')}</div>`;
        return;
    }
    if (!result.events || result.events.length === 0) {
        list.innerHTML = '<div class="empty">Nothing scheduled in the next 7 days.</div>';
        return;
    }
    list.innerHTML = result.events.map(ev => {
        const start = formatEventTime(ev.start, ev.all_day);
        return `
            <div class="schedule-row">
                <span class="date">${escapeHtml(start.date)}</span>
                <span class="time">${escapeHtml(start.time)}</span>
                <span class="players">${escapeHtml(ev.title)}${ev.location ? ' · ' + escapeHtml(ev.location) : ''}</span>
                <span class="muted"></span>
            </div>
        `;
    }).join('');
}

function formatEventTime(iso, allDay) {
    if (allDay) return { date: iso.slice(5, 10), time: 'All day' };
    const d = new Date(iso);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return { date: dateStr, time: timeStr };
}

function setDefaultEventTimes() {
    const startEl = $('#e-start');
    const endEl = $('#e-end');
    if (!startEl || startEl.value) return;
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    startEl.value = toLocalISO(now);
    endEl.value = toLocalISO(end);
}

function toLocalISO(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function handleEventSubmit(e) {
    e.preventDefault();
    const status = $('#event-status');
    status.textContent = 'Creating...';

    const startLocal = $('#e-start').value;
    const endLocal = $('#e-end').value;

    const payload = {
        title: $('#e-title').value,
        start_iso: new Date(startLocal).toISOString(),
        end_iso: new Date(endLocal).toISOString(),
        location: $('#e-location').value,
        description: $('#e-description').value,
    };

    const res = await callAPI('calendar_create_event', payload);
    if (res?.success) {
        status.textContent = 'Added to Google Calendar.';
        e.target.reset();
        setDefaultEventTimes();
        loadCalendarEvents();
    } else {
        status.textContent = 'Failed: ' + (res?.error || 'unknown');
    }
}

// ── App info / settings ──────────────────────────────────────────────

async function loadAppInfo() {
    const info = await callAPI('get_app_info');
    if (info) {
        $('#vault-path').textContent = info.vault;
        $('#app-version').textContent = info.version;
    }
}

// ── Utilities ────────────────────────────────────────────────────────

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function markdownToHtml(md) {
    return escapeHtml(md)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}
