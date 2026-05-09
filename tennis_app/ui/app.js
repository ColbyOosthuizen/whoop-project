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
}

// ── Actions ──────────────────────────────────────────────────────────

function bindActions() {
    $('#sync-whoop')?.addEventListener('click', syncWhoop);
    $('#sync-whoop-2')?.addEventListener('click', syncWhoop);
    $('#open-vault')?.addEventListener('click', () => callAPI('open_vault_in_explorer'));
    $('#match-form')?.addEventListener('submit', handleMatchSubmit);
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
