// Jarvis Tennis OS — v0.3
// Frontend logic. Talks to Python via window.pywebview.api

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ── Boot ─────────────────────────────────────────────────────────────────────

window.addEventListener('pywebviewready', async () => {
    initApp();
    await Promise.all([loadDashboard(), loadAppInfo()]);
});

// Fallback for browser testing without pywebview
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    bindNav();
    bindActions();
    startClock();
    updateGreeting();
    setDefaultDate();
    initChat();
    initCouncil();
    initSync();
    bindCalNav();
    initOutreach();
}

function updateGreeting() {
    const h = new Date().getHours();
    const text = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const el = $('#greeting-text');
    if (el) el.textContent = text;
}

// ── Navigation ────────────────────────────────────────────────────────────────

function bindNav() {
    $$('.nav-item, .tab-settings').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    $$('[data-view-shortcut]').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.viewShortcut));
    });
}

function switchView(view) {
    $$('.nav-item, .tab-settings').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.remove('active-view'));
    const target = $(`#view-${view}`);
    if (target) target.classList.add('active-view');

    const titles = {
        dashboard: 'Dashboard',
        chat: 'Chat with Jarvis',
        council: 'The Council',
        outreach: 'Outreach',
        matches: 'Matches',
        calendar: 'Calendar',
        settings: 'Settings',
    };
    $('#view-title').textContent = titles[view] || view;

    if (view === 'calendar') loadCalendar();
    if (view === 'outreach') loadOutreach();
    if (view === 'chat') $('#chat-input')?.focus();
}

// ── Clock ─────────────────────────────────────────────────────────────────────

function startClock() {
    const update = () => {
        const d = new Date();
        $('#datetime').textContent = d.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };
    update();
    setInterval(update, 30000);
}

function setDefaultDate() {
    const el = $('#m-date');
    if (el) el.value = new Date().toISOString().slice(0, 10);
}

// ── API bridge ────────────────────────────────────────────────────────────────

async function api(method, ...args) {
    if (!window.pywebview?.api) {
        console.warn('No pywebview — mock mode');
        return null;
    }
    try {
        return await window.pywebview.api[method](...args);
    } catch (err) {
        console.error(`api.${method} failed:`, err);
        return null;
    }
}

// ── Auto-sync callbacks (called from Python via evaluate_js) ──────────────────

window._onAutoSync = async (type) => {
    if (type === 'whoop') {
        const whoop = await api('get_latest_whoop');
        if (whoop && !whoop.error) renderWhoop(whoop);
    }
    if (type === 'calendar') {
        // Refresh calendar if that view is active
        if ($('#view-calendar') && !$('#view-calendar').classList.contains('hidden')) {
            loadCalendarEvents();
        }
    }
};

window._onSyncStatus = (type, status) => {
    const dot = type === 'whoop' ? $('#sync-dot-whoop') : $('#sync-dot-cal');
    const timeEl = type === 'whoop' ? $('#sync-whoop-time') : $('#sync-cal-time');
    if (!dot) return;
    dot.className = `sync-dot ${status}`;
    if (status === 'ok' && timeEl) timeEl.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

function initSync() {
    // Poll sync status once on load to show last known times
    setTimeout(async () => {
        const status = await api('get_sync_status');
        if (!status) return;
        if (status.whoop_last) $('#sync-whoop-time').textContent = status.whoop_last;
        if (status.calendar_last) $('#sync-cal-time').textContent = status.calendar_last;
    }, 1000);
}

// ── Actions ───────────────────────────────────────────────────────────────────

function bindActions() {
    $('#sync-whoop')?.addEventListener('click', manualSyncWhoop);
    $('#sync-whoop-2')?.addEventListener('click', manualSyncWhoop);
    $('#open-vault')?.addEventListener('click', () => api('open_vault_in_obsidian'));
    $('#match-form')?.addEventListener('submit', handleMatchSubmit);
    $('#calendar-refresh')?.addEventListener('click', loadCalendarEvents);
    $('#event-form')?.addEventListener('submit', handleEventSubmit);
    $('#plan-week')?.addEventListener('click', generatePlan);
    $('#save-anthropic-key')?.addEventListener('click', saveAnthropicKey);
    $('#draft-btn')?.addEventListener('click', generateDraft);
    $('#draft-copy')?.addEventListener('click', copyDraft);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function loadDashboard() {
    const [whoop, schedule] = await Promise.all([
        api('get_latest_whoop'),
        api('get_schedule'),
    ]);
    if (whoop && !whoop.error) renderWhoop(whoop);
    renderSchedule(schedule || []);
}

function renderWhoop(data) {
    const recovery = parseInt(data.recovery, 10);
    const scoreEl = $('#recovery-score');
    const zoneEl  = $('#recovery-zone');

    scoreEl.textContent = isNaN(recovery) ? '—' : `${recovery}`;
    zoneEl.className = 'recovery-zone';

    let zoneHex = '#0a2030';
    if (isNaN(recovery)) {
        zoneEl.textContent = 'No data';
        zoneEl.classList.add('zone-none');
        scoreEl.style.color = 'var(--muted)';
    } else if (recovery >= 67) {
        zoneEl.textContent = 'Green · Go';
        zoneEl.classList.add('zone-green');
        scoreEl.style.color = 'var(--green)';
        scoreEl.style.textShadow = '0 0 32px rgba(0,255,136,0.6)';
        zoneHex = '#00ff88';
    } else if (recovery >= 34) {
        zoneEl.textContent = 'Yellow · Steady';
        zoneEl.classList.add('zone-yellow');
        scoreEl.style.color = 'var(--yellow)';
        scoreEl.style.textShadow = '0 0 32px rgba(255,214,0,0.6)';
        zoneHex = '#ffd600';
    } else {
        zoneEl.textContent = 'Red · Rest';
        zoneEl.classList.add('zone-red');
        scoreEl.style.color = 'var(--red)';
        scoreEl.style.textShadow = '0 0 32px rgba(255,34,68,0.6)';
        zoneHex = '#ff2244';
    }

    // Animate recovery ring (r=60, circumference = 2π×60 = 376.99)
    const ring = $('#recovery-ring-fill');
    const ringSvg = $('.recovery-ring-svg');
    if (ring && !isNaN(recovery)) {
        const circ = 376.99;
        ring.style.strokeDashoffset = circ * (1 - recovery / 100);
        ring.style.stroke = zoneHex;
    }
    if (ringSvg && !isNaN(recovery)) {
        ringSvg.style.filter = `drop-shadow(0 0 22px ${zoneHex}55)`;
    }

    $('#metric-hrv').textContent      = data.hrv        ? `${data.hrv} ms`   : '—';
    $('#metric-rhr').textContent      = data.rhr        ? `${data.rhr} bpm`  : '—';
    $('#metric-spo2').textContent     = data.spo2       ? `${data.spo2}%`    : '—';
    $('#metric-sleep').textContent    = data.sleep_hours ? `${data.sleep_hours}h` : '—';
    $('#metric-strain').textContent   = data.strain     ?? '—';
    $('#metric-calories').textContent = data.calories   ? `${data.calories} kcal` : '—';

    const rec = $('#recommendation');
    if (rec) rec.innerHTML = data.recommendation ? markdownToHtml(data.recommendation) : '';

    const mr = $('#m-recovery');
    if (mr && !mr.value && !isNaN(recovery)) mr.value = recovery;
}

function renderSchedule(rows) {
    const list = $('#schedule-list');
    if (!rows.length) {
        list.innerHTML = '<div class="empty-state">No matches scheduled.</div>';
        return;
    }
    list.innerHTML = rows.map(r => `
        <div class="list-row">
            <span class="row-date">${esc(r.date)}</span>
            <span class="row-time">${esc(r.time)}</span>
            <span class="row-main">${esc(r.players)} · ${esc(r.location)}</span>
            <span class="row-status">${esc(r.status)}</span>
        </div>
    `).join('');
}

async function manualSyncWhoop() {
    window._onSyncStatus('whoop', 'syncing');
    const result = await api('sync_whoop');
    if (result?.success) {
        const whoop = await api('get_latest_whoop');
        if (whoop && !whoop.error) renderWhoop(whoop);
        window._onSyncStatus('whoop', 'ok');
    } else {
        window._onSyncStatus('whoop', 'error');
        if (result?.error) alert('WHOOP sync failed:\n\n' + result.error);
    }
}

// ── App info / settings ───────────────────────────────────────────────────────

async function loadAppInfo() {
    const info = await api('get_app_info');
    if (info) {
        const pathEl = $('#vault-path');
        if (pathEl) pathEl.textContent = info.vault;
    }

    const keyStatus = await api('check_anthropic_key');
    if (keyStatus?.has_key) {
        const inp = $('#anthropic-key-input');
        if (inp) inp.placeholder = 'Key saved ✓';
        const statusEl = $('#anthropic-key-status');
        if (statusEl) statusEl.textContent = 'API key active — AI features enabled.';
    }
}

async function saveAnthropicKey() {
    const key = $('#anthropic-key-input')?.value?.trim();
    if (!key) return;
    const statusEl = $('#anthropic-key-status');
    statusEl.textContent = 'Saving...';
    const r = await api('save_anthropic_key', key);
    if (r?.success) {
        statusEl.textContent = 'Saved. AI features enabled.';
        $('#anthropic-key-input').value = '';
        $('#anthropic-key-input').placeholder = 'Key saved ✓';
    } else {
        statusEl.textContent = 'Error: ' + (r?.error || 'unknown');
    }
}

// ── Chat ──────────────────────────────────────────────────────────────────────

let chatHistory = [];

function initChat() {
    const input = $('#chat-input');
    const btn   = $('#chat-send');
    if (!input) return;

    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChat();
        }
    });

    btn.addEventListener('click', sendChat);
}

async function sendChat() {
    const input = $('#chat-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    $('#chat-send').disabled = true;

    appendChatMsg('user', text);
    chatHistory.push({ role: 'user', content: text });

    const typingEl = appendTyping();

    const result = await api('chat_message', chatHistory);

    typingEl.remove();
    $('#chat-send').disabled = false;

    if (result?.success) {
        appendChatMsg('jarvis', result.content);
        chatHistory.push({ role: 'assistant', content: result.content });
    } else {
        appendChatMsg('jarvis', result?.error || 'Something went wrong. Check your API key in Settings.');
    }

    input.focus();
}

function appendChatMsg(role, text) {
    const container = $('#chat-messages');
    const isJarvis = role === 'jarvis';

    const div = document.createElement('div');
    div.className = `chat-msg ${isJarvis ? 'jarvis' : 'user'}`;

    div.innerHTML = `
        <div class="chat-avatar">${isJarvis ? 'J' : 'C'}</div>
        <div class="chat-bubble">${markdownToHtml(esc(text))}</div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

function appendTyping() {
    const container = $('#chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-msg jarvis';
    div.innerHTML = `
        <div class="chat-avatar">J</div>
        <div class="chat-bubble">
            <div class="chat-typing">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

// ── Council ───────────────────────────────────────────────────────────────────

function initCouncil() {
    $('#council-ask')?.addEventListener('click', briefCouncil);
    $('#council-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') briefCouncil();
    });
}

async function briefCouncil() {
    const input = $('#council-input');
    const question = input.value.trim();
    if (!question) return;

    const output = $('#council-output');
    const btn = $('#council-ask');
    btn.disabled = true;
    btn.textContent = 'Briefing...';

    // Show loading skeletons
    output.innerHTML = `
        <div class="council-loading">
            ${'<div class="council-skel"></div>'.repeat(6)}
        </div>
        <div class="council-skel" style="height:160px;border-radius:10px"></div>
    `;

    const result = await api('council_ask', question);

    btn.disabled = false;
    btn.textContent = 'Brief Council';

    if (!result?.success) {
        output.innerHTML = `<div class="empty-state" style="color:var(--red)">${esc(result?.error || 'Council unavailable')}</div>`;
        return;
    }

    // Render advisor cards
    const cards = result.agents.map(a => `
        <div class="advisor-card loaded">
            <div class="advisor-head">
                <span class="advisor-icon">${a.icon}</span>
                <div class="advisor-info">
                    <div class="advisor-name">${esc(a.name)}</div>
                    <div class="advisor-role">${esc(a.role)}</div>
                </div>
            </div>
            <div class="advisor-body ${a.error ? 'advisor-error' : ''}">
                ${a.error ? esc(a.error) : markdownToHtml(esc(a.response || ''))}
            </div>
        </div>
    `).join('');

    // Format Jarvis synthesis — parse VERDICT / REASONING / ACTION
    const jarvisText = result.jarvis || '';
    const formattedJarvis = jarvisText
        .replace(/^VERDICT:/m, '<strong>VERDICT:</strong>')
        .replace(/^REASONING:/m, '<strong>REASONING:</strong>')
        .replace(/^ACTION:/m, '<strong>ACTION:</strong>');

    output.innerHTML = `
        <div class="council-grid">${cards}</div>
        <div class="jarvis-synthesis">
            <div class="synthesis-head">
                <div class="synthesis-logo">J</div>
                <div>
                    <div class="synthesis-title">Jarvis — Chief of Staff</div>
                    <div class="synthesis-subtitle">Synthesis of all 6 advisors</div>
                </div>
            </div>
            <div class="synthesis-body">${markdownToHtml(formattedJarvis)}</div>
        </div>
    `;
}

// ── Draft message ─────────────────────────────────────────────────────────────

async function generateDraft() {
    const recipient = $('#draft-recipient').value.trim();
    const purpose   = $('#draft-purpose').value.trim();
    const context   = $('#draft-context').value.trim();

    if (!recipient || !purpose) {
        alert('Please fill in recipient and purpose.');
        return;
    }

    const btn = $('#draft-btn');
    btn.textContent = 'Generating...';
    btn.disabled = true;

    const result = await api('draft_message', { recipient, purpose, context });

    btn.textContent = 'Generate Draft';
    btn.disabled = false;

    const outputEl = $('#draft-output');
    const textEl   = $('#draft-text');

    if (result?.success) {
        textEl.textContent = result.draft;
        outputEl.classList.remove('hidden');
    } else {
        alert('Failed: ' + (result?.error || 'unknown'));
    }
}

function copyDraft() {
    const text = $('#draft-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = $('#draft-copy');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
    });
}

// ── Match form ────────────────────────────────────────────────────────────────

async function handleMatchSubmit(e) {
    e.preventDefault();
    const statusEl = $('#match-status');
    statusEl.textContent = 'Saving...';

    const payload = {
        date:     $('#m-date').value,
        type:     $('#m-type').value,
        players:  $('#m-players').value,
        location: $('#m-location').value,
        result:   $('#m-result').value,
        recovery: $('#m-recovery').value,
        notes:    $('#m-notes').value,
    };

    const res = await api('log_match', payload);
    if (res?.success) {
        statusEl.textContent = `Saved: ${res.file}`;
        e.target.reset();
        setDefaultDate();
    } else {
        statusEl.textContent = 'Error: ' + (res?.error || 'unknown');
    }
}

// ── Google Calendar ───────────────────────────────────────────────────────────

async function loadCalendar() {
    const status = await api('calendar_status');
    const setupCard = $('#calendar-setup-card');
    const statusDiv = $('#calendar-setup-status');
    const icloudCard = $('#icloud-card');

    // Always render iCloud card and load events — setupCard only appears for errors
    if (!status) {
        setupCard.classList.remove('hidden');
        statusDiv.innerHTML = '<p class="card-sub" style="color:var(--red)">App API unavailable.</p>';
        return;
    }

    if (!status.credentials_present) {
        setupCard.classList.remove('hidden');
        statusDiv.innerHTML = `
            <p class="card-sub">Google Calendar isn't connected yet. One-time setup:</p>
            <ol class="card-sub" style="margin:12px 0 12px 20px;line-height:2">
                <li>Go to <span style="color:var(--accent)">console.cloud.google.com</span></li>
                <li>Create a project → Enable Google Calendar API</li>
                <li>OAuth consent screen → External → fill basics</li>
                <li>Credentials → OAuth client ID → Desktop app → Download JSON</li>
                <li>Rename it <code style="font-size:11px;background:var(--bg);padding:2px 6px;border-radius:4px">google_credentials.json</code> → save to vault folder</li>
            </ol>
            <button class="btn-primary" id="check-creds">I've added the credentials</button>
        `;
        $('#check-creds')?.addEventListener('click', loadCalendar);
        return;
    }

    if (!status.authenticated) {
        setupCard.classList.remove('hidden');
        statusDiv.innerHTML = `
            <p class="card-sub">Credentials found. Authenticate to connect your calendar.</p>
            <div style="display:flex;align-items:center;gap:12px;margin-top:12px">
                <button class="btn-primary" id="auth-google">Connect Google Calendar</button>
                <span id="auth-status" class="status-text"></span>
            </div>
        `;
        $('#auth-google')?.addEventListener('click', async () => {
            $('#auth-status').textContent = 'Opening browser...';
            const r = await api('calendar_authenticate');
            if (r?.success) { setupCard.classList.add('hidden'); loadCalendar(); }
            else $('#auth-status').textContent = 'Failed: ' + (r?.error || 'unknown');
        });
        return;
    }

    // Fully connected — hide setup card, render iCloud status, load events
    setupCard.classList.add('hidden');
    icloudCard?.classList.remove('hidden');
    renderICloudCard(status.icloud);
    setDefaultEventTimes();

    // Render grid immediately so it's never blank
    buildCalGrid();
    showDayEvents(calState.selected);

    // Then fetch events and refresh
    loadCalendarEvents();
}

function renderICloudCard(icloud) {
    const card = $('#icloud-card');
    if (!card) return;

    if (icloud?.connected) {
        card.innerHTML = `
            <div class="card-header">
                <span class="card-label">Apple Calendar (iCloud)</span>
                <span class="sync-dot ok" style="width:8px;height:8px;flex-shrink:0"></span>
            </div>
            <p class="card-sub">
                Connected as <strong style="color:var(--text)">${esc(icloud.apple_id)}</strong>
                — Apple Calendar events are merged into the calendar above.
            </p>
            <button class="btn-chip" id="icloud-change" style="margin-top:6px">Change credentials</button>
        `;
        $('#icloud-change')?.addEventListener('click', () => renderICloudSetupForm());
    } else {
        renderICloudSetupForm();
    }
}

function renderICloudSetupForm() {
    const card = $('#icloud-card');
    if (!card) return;
    card.innerHTML = `
        <div class="card-header">
            <span class="card-label">Apple Calendar (iCloud)</span>
            <span class="sync-dot" style="width:8px;height:8px;flex-shrink:0"></span>
        </div>
        <p class="card-sub">Connect your iCloud account to pull Apple Calendar events alongside Google. You need an <strong style="color:var(--text)">app-specific password</strong> — not your Apple ID password.</p>
        <ol class="card-sub" style="margin:10px 0 14px 18px;line-height:2">
            <li>Go to <span style="color:var(--accent)">appleid.apple.com</span></li>
            <li>Sign In and Security → App-Specific Passwords → Generate</li>
            <li>Name it "Jarvis" → copy the password</li>
        </ol>
        <div class="draft-form" style="max-width:480px">
            <input type="email" id="icloud-apple-id" class="form-input" placeholder="Apple ID email">
            <input type="password" id="icloud-app-pw" class="form-input" placeholder="App-specific password (xxxx-xxxx-xxxx-xxxx)">
            <div style="display:flex;gap:8px;align-items:center">
                <button class="btn-primary" id="icloud-save">Connect iCloud</button>
                <span class="status-text" id="icloud-status"></span>
            </div>
        </div>
    `;
    $('#icloud-save')?.addEventListener('click', connectICloud);
}

async function connectICloud() {
    const appleId  = $('#icloud-apple-id')?.value.trim();
    const appPw    = $('#icloud-app-pw')?.value.trim();
    const statusEl = $('#icloud-status');

    if (!appleId || !appPw) { statusEl.textContent = 'Fill in both fields.'; return; }

    statusEl.textContent = 'Saving & testing connection...';
    $('#icloud-save').disabled = true;

    const saveRes = await api('icloud_save_credentials', appleId, appPw);
    if (!saveRes?.success) {
        statusEl.textContent = 'Save failed: ' + (saveRes?.error || 'unknown');
        $('#icloud-save').disabled = false;
        return;
    }

    const testRes = await api('icloud_test');
    $('#icloud-save').disabled = false;

    if (testRes?.success) {
        renderICloudCard({ connected: true, apple_id: appleId });
        loadCalendarEvents();
    } else {
        statusEl.textContent = 'Connection failed: ' + (testRes?.error || 'unknown');
    }
}

// ── Calendar widget ───────────────────────────────────────────────────────────

const calState = {
    year:     new Date().getFullYear(),
    month:    new Date().getMonth(),
    selected: new Date().toISOString().slice(0, 10),
    events:   [],
};

async function loadCalendarEvents() {
    const result = await api('calendar_upcoming', 35);
    if (!result) return;
    if (result.success) {
        calState.events = result.events || [];
    }
    // Refresh whichever view is active
    if (calMode === 'month') {
        buildCalGrid();
        showDayEvents(calState.selected);
    } else {
        build3DayView();
    }
}

function buildCalGrid() {
    const { year, month, selected, events } = calState;

    // Month label
    $('#cal-month-label').textContent = new Date(year, month, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Event map: "YYYY-MM-DD" -> [events]
    const map = {};
    for (const ev of events) {
        const key = ev.start.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
    }

    const today      = new Date().toISOString().slice(0, 10);
    const firstDay   = new Date(year, month, 1).getDay();
    const daysInMon  = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    let html = '';

    // Prev month filler
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="cal-day other-month"><span class="cal-day-num">${daysInPrev - i}</span></div>`;
    }

    // Current month
    for (let d = 1; d <= daysInMon; d++) {
        const key   = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday = key === today;
        const isSel   = key === selected;
        const dayEvs  = map[key] || [];

        const dots = dayEvs.slice(0, 3).map(ev =>
            `<span class="cal-dot ${ev.source === 'google' ? 'dot-google' : 'dot-apple'}"></span>`
        ).join('');

        html += `<div class="cal-day${isToday ? ' today' : ''}${isSel ? ' selected' : ''}"
                      data-date="${key}" onclick="calSelectDay('${key}')">
            <span class="cal-day-num">${d}</span>
            ${dots ? `<div class="cal-dots">${dots}</div>` : ''}
        </div>`;
    }

    // Next month filler
    const total = Math.ceil((firstDay + daysInMon) / 7) * 7;
    for (let n = 1; n <= total - firstDay - daysInMon; n++) {
        html += `<div class="cal-day other-month"><span class="cal-day-num">${n}</span></div>`;
    }

    $('#cal-grid').innerHTML = html;
}

function calSelectDay(dateStr) {
    calState.selected = dateStr;
    buildCalGrid();
    showDayEvents(dateStr);
}

function showDayEvents(dateStr) {
    const panel = $('#cal-day-events');
    const label = $('#cal-day-label');

    const d = new Date(dateStr + 'T12:00:00');
    const isToday = dateStr === new Date().toISOString().slice(0, 10);
    label.textContent = isToday
        ? 'Today — ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const dayEvs = calState.events.filter(ev => ev.start.slice(0, 10) === dateStr);

    if (!dayEvs.length) {
        panel.innerHTML = '<div class="empty-state">Nothing scheduled</div>';
        return;
    }

    panel.innerHTML = dayEvs.map(ev => {
        const t = fmtTime(ev.start, ev.all_day);
        return `
            <div class="cal-event-row source-${ev.source || 'google'}">
                <span class="cal-event-time">${esc(t.time)}</span>
                <div style="flex:1;min-width:0">
                    <div class="cal-event-title">${esc(ev.title)}</div>
                    ${ev.location ? `<div class="cal-event-location">${esc(ev.location)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

let calMode = 'month'; // 'month' | '3day'
let threeDayStart = new Date(); // anchor date for 3-day view

function bindCalNav() {
    // Month view nav
    $('#cal-prev')?.addEventListener('click', () => {
        calState.month--;
        if (calState.month < 0) { calState.month = 11; calState.year--; }
        buildCalGrid();
    });
    $('#cal-next')?.addEventListener('click', () => {
        calState.month++;
        if (calState.month > 11) { calState.month = 0; calState.year++; }
        buildCalGrid();
    });

    // View toggle
    $('#toggle-month')?.addEventListener('click', () => setCalMode('month'));
    $('#toggle-3day')?.addEventListener('click',  () => setCalMode('3day'));

    // 3-day nav
    $('#threeday-prev')?.addEventListener('click', () => {
        threeDayStart = addDays(threeDayStart, -3);
        build3DayView();
    });
    $('#threeday-next')?.addEventListener('click', () => {
        threeDayStart = addDays(threeDayStart, 3);
        build3DayView();
    });
    $('#threeday-today')?.addEventListener('click', () => {
        threeDayStart = new Date();
        build3DayView();
    });
}

function setCalMode(mode) {
    calMode = mode;
    $('#cal-month-view').classList.toggle('hidden', mode !== 'month');
    $('#cal-3day-view').classList.toggle('hidden', mode !== '3day');
    $('#toggle-month').classList.toggle('active', mode === 'month');
    $('#toggle-3day').classList.toggle('active', mode === '3day');

    if (mode === 'month') {
        buildCalGrid();
        showDayEvents(calState.selected);
    } else {
        if (calState.events.length === 0) loadCalendarEvents();
        else build3DayView();
    }
}

function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

function build3DayView() {
    const rangeEl = $('#threeday-range');
    const colsEl  = $('#three-day-cols');
    if (!colsEl) return;

    const days = [0, 1, 2].map(n => addDays(threeDayStart, n));
    const today = new Date().toISOString().slice(0, 10);

    // Range label
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    rangeEl.textContent = `${fmt(days[0])} — ${fmt(days[2])}`;

    // Build event map
    const map = {};
    for (const ev of calState.events) {
        const key = ev.start.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
    }

    colsEl.innerHTML = days.map(d => {
        const key     = d.toISOString().slice(0, 10);
        const isToday = key === today;
        const dayEvs  = (map[key] || []).sort((a, b) => a.start.localeCompare(b.start));

        const eventsHtml = dayEvs.length
            ? dayEvs.map(ev => {
                const t = fmtTime(ev.start, ev.all_day);
                return `
                    <div class="day-col-event source-${ev.source || 'google'}">
                        <div class="day-col-event-time">${esc(t.time)}</div>
                        <div class="day-col-event-title">${esc(ev.title)}</div>
                        ${ev.location ? `<div class="day-col-event-location">${esc(ev.location)}</div>` : ''}
                    </div>
                `;
            }).join('')
            : '<div class="day-col-empty">Clear</div>';

        return `
            <div class="day-col ${isToday ? 'is-today' : ''}">
                <div class="day-col-header">
                    <div class="day-col-weekday">${d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="day-col-num">${d.getDate()}</div>
                </div>
                <div class="day-col-events">${eventsHtml}</div>
            </div>
        `;
    }).join('');
}

async function generatePlan() {
    const out = $('#plan-output');
    out.innerHTML = '<div class="empty-state">Finding open windows...</div>';
    const result = await api('schedule_propose_week');
    if (!result?.success) {
        out.innerHTML = `<div class="empty-state" style="color:var(--red)">${esc(result?.error || 'Failed')}</div>`;
        return;
    }
    const { recovery, proposals } = result;
    if (!proposals?.length) {
        out.innerHTML = '<div class="empty-state">No open training windows in the next 7 days.</div>';
        return;
    }

    const note = recovery == null
        ? '<p class="card-sub">No WHOOP data — using default light sessions.</p>'
        : `<p class="card-sub">Today's recovery: <strong style="color:var(--text)">${recovery}%</strong>. Future days default to light sessions until WHOOP syncs.</p>`;

    const rows = proposals.map((p, i) => {
        const zone = p.intensity === 'high' ? 'zone-green' : p.intensity === 'moderate' ? 'zone-yellow' : 'zone-red';
        const s = fmtTime(p.start_iso, false);
        const e = fmtTime(p.end_iso, false);
        return `
            <div class="proposal-row">
                <div class="proposal-head">
                    <span class="proposal-date">${esc(s.date)}${p.is_today ? ' · Today' : ''}</span>
                    <span class="proposal-time">${esc(s.time)}–${esc(e.time)} (${p.duration_minutes} min)</span>
                    <span class="recovery-zone ${zone}">${esc(p.intensity)}</span>
                </div>
                <div class="proposal-title">${esc(p.title)}</div>
                <div class="proposal-desc">${esc(p.description)}</div>
                <div class="proposal-actions">
                    <button class="btn-primary btn-chip" data-accept="${i}">Add to Calendar</button>
                    <span class="status-text" data-pstatus="${i}"></span>
                </div>
            </div>
        `;
    }).join('');

    out.innerHTML = note + '<div class="proposal-list">' + rows + '</div>';

    out.querySelectorAll('[data-accept]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const i = parseInt(btn.dataset.accept, 10);
            const p = proposals[i];
            const st = out.querySelector(`[data-pstatus="${i}"]`);
            st.textContent = 'Adding...';
            const res = await api('schedule_accept_block', {
                title: p.title, start_iso: p.start_iso,
                end_iso: p.end_iso, description: p.description,
            });
            if (res?.success) {
                st.textContent = 'Added.';
                btn.disabled = true;
                btn.textContent = 'Added ✓';
            } else {
                st.textContent = 'Error: ' + (res?.error || 'unknown');
            }
        });
    });
}

async function handleEventSubmit(e) {
    e.preventDefault();
    const st = $('#event-status');
    st.textContent = 'Creating...';
    const payload = {
        title:       $('#e-title').value,
        start_iso:   new Date($('#e-start').value).toISOString(),
        end_iso:     new Date($('#e-end').value).toISOString(),
        location:    $('#e-location').value,
        description: $('#e-description').value,
    };
    const res = await api('calendar_create_event', payload);
    if (res?.success) {
        st.textContent = 'Added to Google Calendar.';
        e.target.reset();
        setDefaultEventTimes();
        loadCalendarEvents();
    } else {
        st.textContent = 'Error: ' + (res?.error || 'unknown');
    }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
}

function markdownToHtml(s) {
    return s
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function fmtTime(iso, allDay) {
    if (allDay || !iso) return { date: (iso || '').slice(5, 10), time: 'All day' };
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
}

function setDefaultEventTimes() {
    const s = $('#e-start'), e = $('#e-end');
    if (!s || s.value) return;
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    s.value = toLocalISO(now);
    e.value = toLocalISO(end);
}

function toLocalISO(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── Outreach ──────────────────────────────────────────────────────────────────

let outreachPlayers = [];

function initOutreach() {
    $('#analyze-capacity')?.addEventListener('click', analyzeCapacity);
    $('#generate-outreach')?.addEventListener('click', generateOutreach);
    $('#show-add-player')?.addEventListener('click', showAddPlayerForm);
    $('#cancel-add-player')?.addEventListener('click', hideAddPlayerForm);
    $('#save-player')?.addEventListener('click', savePlayer);
}

async function loadOutreach() {
    const players = await api('get_players');
    outreachPlayers = players || [];
    renderPlayerList(outreachPlayers);
    loadPlayersRoster(outreachPlayers);
}

// ── Capacity analysis ─────────────────────────────────────────────────────────

async function analyzeCapacity() {
    const btn = $('#analyze-capacity');
    const out = $('#capacity-output');
    btn.disabled = true;
    btn.textContent = 'Analysing...';
    out.innerHTML = '<div class="empty-state">Reading WHOOP + calendar...</div>';

    const result = await api('analyze_capacity');
    btn.disabled = false;
    btn.textContent = 'Analyse';

    if (!result?.success) {
        out.innerHTML = `<div class="empty-state" style="color:var(--red)">${esc(result?.error || 'Analysis failed')}</div>`;
        return;
    }

    const { match_capacity, gym_viable, slots, reasoning } = result;
    const recoveryColor = match_capacity >= 2 ? 'var(--green)' : match_capacity === 1 ? 'var(--yellow)' : 'var(--red)';

    out.innerHTML = `
        <div class="capacity-result">
            <div class="capacity-badges">
                <span class="badge-cap" style="background:${recoveryColor}20;border:1px solid ${recoveryColor};color:${recoveryColor}">
                    ${match_capacity} match${match_capacity !== 1 ? 'es' : ''} today
                </span>
                ${gym_viable ? '<span class="badge-cap" style="background:var(--green)20;border:1px solid var(--green);color:var(--green)">Gym ✓</span>' : '<span class="badge-cap" style="background:var(--red)20;border:1px solid var(--red);color:var(--red)">Skip gym</span>'}
            </div>
            <p class="card-sub" style="margin-top:10px">${esc(reasoning)}</p>
        </div>
    `;

    // Show slots section and pre-fill
    const slotsDiv = $('#outreach-slots');
    const slotsInput = $('#outreach-slot-count');
    if (slotsDiv) slotsDiv.style.display = '';
    if (slotsInput) slotsInput.value = match_capacity;
}

// ── Player selection list ─────────────────────────────────────────────────────

function renderPlayerList(players) {
    const container = $('#player-list');
    if (!container) return;

    if (!players.length) {
        container.innerHTML = '<div class="empty-state">No players yet — add them in the Players section below.</div>';
        return;
    }

    container.innerHTML = players.map(p => `
        <label class="player-check-row">
            <input type="checkbox" class="player-check" value="${esc(p.id)}" data-name="${esc(p.name)}">
            <span class="player-check-name">${esc(p.name)}</span>
            ${p.level ? `<span class="player-check-level">${esc(p.level)}</span>` : ''}
            ${p.notes ? `<span class="player-check-notes">${esc(p.notes)}</span>` : ''}
        </label>
    `).join('');
}

// ── Generate outreach messages ────────────────────────────────────────────────

async function generateOutreach() {
    const checked = [...$$('.player-check:checked')];
    if (!checked.length) {
        $('#outreach-status').textContent = 'Select at least one player.';
        return;
    }

    const slotCount = parseInt($('#outreach-slot-count')?.value, 10) || 1;
    const note = $('#outreach-note')?.value?.trim() || '';
    const selectedIds = checked.map(cb => cb.value);

    const btn = $('#generate-outreach');
    const status = $('#outreach-status');
    btn.disabled = true;
    btn.textContent = 'Drafting...';
    status.textContent = `Drafting ${selectedIds.length} message${selectedIds.length !== 1 ? 's' : ''}...`;

    // Python API expects player_ids and slots as a count
    const result = await api('generate_outreach', { player_ids: selectedIds, slots: slotCount, note });

    btn.disabled = false;
    btn.textContent = 'Generate Messages';

    if (!result?.success) {
        status.textContent = 'Error: ' + (result?.error || 'unknown');
        return;
    }

    status.textContent = '';
    renderOutreachMessages(result.messages || []);
}

function renderOutreachMessages(messages) {
    const container = $('#outreach-messages');
    if (!messages.length) {
        container.innerHTML = '<div class="empty-state">No messages generated.</div>';
        return;
    }

    // Default start = next hour, duration = 1.5 h
    const defaultStart = (() => {
        const d = new Date();
        d.setHours(d.getHours() + 1, 0, 0, 0);
        return toLocalISO(d);
    })();
    const defaultEnd = (() => {
        const d = new Date(defaultStart);
        d.setMinutes(d.getMinutes() + 90);
        return toLocalISO(d);
    })();

    // Python returns: {player: {...}, message: "...", wa_link: "...", error: null}
    container.innerHTML = messages.map((m, i) => {
        const name  = m.player?.name || 'Unknown';
        const phone = m.player?.phone || '';
        const draft = m.message || (m.error ? `Error: ${m.error}` : '');
        const hasPhone = !!phone;

        return `
        <div class="outreach-msg-card" id="msg-card-${i}">
            <div class="outreach-msg-head">
                <span class="outreach-msg-name">${esc(name)}</span>
                ${hasPhone
                    ? `<span class="outreach-msg-phone">${esc(phone)}</span>`
                    : `<span class="outreach-msg-phone" style="color:var(--red)">No phone — add in Players</span>`}
            </div>
            <div style="padding:12px 16px">
                <textarea class="outreach-msg-text form-input" id="msg-text-${i}" rows="4"
                    style="width:100%;box-sizing:border-box;resize:vertical;font-family:inherit">${esc(draft)}</textarea>

                <div class="outreach-msg-actions" style="margin-top:10px">
                    ${hasPhone
                        ? `<button class="btn-whatsapp" id="wa-send-${i}" onclick="sendWhatsapp(${i}, '${esc(phone)}')">Send on WhatsApp</button>`
                        : `<span class="card-sub">Add phone number to enable auto-send</span>`}
                    <button class="btn-chip" onclick="copyOutreachMsg(${i})">Copy</button>
                    <button class="btn-chip" onclick="toggleCalBlock(${i})">+ Calendar</button>
                    <span class="outreach-send-note" id="wa-status-${i}"></span>
                </div>

                <!-- Calendar block (hidden until + Calendar clicked) -->
                <div id="cal-block-${i}" class="hidden" style="margin-top:12px;padding:12px;background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.2);border-radius:8px">
                    <div style="font-size:12px;font-weight:600;color:var(--accent);margin-bottom:10px">Block match in calendar</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
                        <div class="form-row" style="margin:0">
                            <label style="font-size:11px">Start</label>
                            <input type="datetime-local" id="cal-start-${i}" class="form-input" value="${defaultStart}" style="font-size:12px">
                        </div>
                        <div class="form-row" style="margin:0">
                            <label style="font-size:11px">End</label>
                            <input type="datetime-local" id="cal-end-${i}" class="form-input" value="${defaultEnd}" style="font-size:12px">
                        </div>
                    </div>
                    <div class="form-row" style="margin:0 0 8px">
                        <label style="font-size:11px">Location (optional)</label>
                        <input type="text" id="cal-loc-${i}" class="form-input" placeholder="e.g. City Tennis Club" style="font-size:12px">
                    </div>
                    <div style="display:flex;gap:8px;align-items:center">
                        <button class="btn-primary" style="font-size:12px;padding:6px 14px" onclick="addMatchToCalendar(${i}, '${esc(name)}')">Add to Google Calendar</button>
                        <span class="status-text" id="cal-status-${i}"></span>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function toggleCalBlock(i) {
    const block = $(`#cal-block-${i}`);
    if (!block) return;
    block.classList.toggle('hidden');
}

async function addMatchToCalendar(i, playerName) {
    const start   = $(`#cal-start-${i}`)?.value;
    const end     = $(`#cal-end-${i}`)?.value;
    const loc     = $(`#cal-loc-${i}`)?.value?.trim() || '';
    const status  = $(`#cal-status-${i}`);

    if (!start || !end) { status.textContent = 'Set start and end times.'; return; }
    if (new Date(end) <= new Date(start)) { status.textContent = 'End must be after start.'; return; }

    status.textContent = 'Adding...';

    const result = await api('calendar_create_event', {
        title:       `Tennis — ${playerName}`,
        start_iso:   new Date(start).toISOString(),
        end_iso:     new Date(end).toISOString(),
        location:    loc,
        description: `Match proposed via Jarvis outreach.`,
    });

    if (result?.success) {
        status.textContent = 'Added to Google Calendar ✓';
        status.style.color = 'var(--green)';
        // Refresh calendar if it's open
        if ($('#view-calendar') && !$('#view-calendar').classList.contains('hidden')) {
            loadCalendarEvents();
        }
    } else {
        status.textContent = 'Failed: ' + (result?.error || 'unknown');
        status.style.color = 'var(--red)';
    }
}

async function sendWhatsapp(i, phone) {
    const msgEl  = $(`#msg-text-${i}`);
    const btn    = $(`#wa-send-${i}`);
    const status = $(`#wa-status-${i}`);
    if (!msgEl || !btn) return;

    const message = msgEl.value.trim();
    if (!message) { status.textContent = 'Message is empty.'; return; }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    status.textContent = 'Opening WhatsApp Web — keep browser in focus...';

    const result = await api('send_whatsapp', phone, message);

    if (result?.success) {
        btn.textContent = 'Sent ✓';
        btn.style.background = 'var(--green)';
        status.textContent = 'Delivered via WhatsApp Web';
    } else {
        btn.disabled = false;
        btn.textContent = 'Send on WhatsApp';
        status.textContent = 'Failed: ' + (result?.error || 'unknown');
        status.style.color = 'var(--red)';
    }
}

function copyOutreachMsg(i) {
    const el = $(`#msg-text-${i}`);
    if (!el) return;
    navigator.clipboard.writeText(el.value).then(() => {
        // Find the Copy button inside this specific card
        const card = el.closest('.outreach-msg-card');
        const copyBtn = card?.querySelector('.btn-chip');
        if (copyBtn) {
            const orig = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { if (copyBtn) copyBtn.textContent = orig; }, 2000);
        }
    });
}


// ── Player roster (manage contacts) ──────────────────────────────────────────

function loadPlayersRoster(players) {
    const roster = $('#players-roster');
    if (!roster) return;

    if (!players.length) {
        roster.innerHTML = '<div class="empty-state">No players added yet.</div>';
        return;
    }

    roster.innerHTML = players.map(p => `
        <div class="player-roster-row" data-id="${esc(p.id)}">
            <div class="player-roster-info">
                <span class="player-roster-name">${esc(p.name)}</span>
                ${p.level ? `<span class="player-roster-level">${esc(p.level)}</span>` : ''}
                ${p.phone ? `<span class="player-roster-phone">${esc(p.phone)}</span>` : ''}
            </div>
            ${p.notes ? `<div class="player-roster-notes">${esc(p.notes)}</div>` : ''}
            <div class="player-roster-actions">
                <button class="btn-chip" onclick="editPlayer('${esc(p.id)}')">Edit</button>
                <button class="btn-chip btn-danger" onclick="deletePlayer('${esc(p.id)}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function showAddPlayerForm() {
    $('#add-player-form')?.classList.remove('hidden');
    $('#edit-player-id').value = '';
    $('#player-name').value = '';
    $('#player-phone').value = '';
    $('#player-level').value = '';
    $('#player-notes').value = '';
    $('#player-name')?.focus();
}

function hideAddPlayerForm() {
    $('#add-player-form')?.classList.add('hidden');
}

function editPlayer(id) {
    const p = outreachPlayers.find(x => String(x.id) === String(id));
    if (!p) return;
    $('#add-player-form')?.classList.remove('hidden');
    $('#edit-player-id').value = p.id;
    $('#player-name').value = p.name || '';
    $('#player-phone').value = p.phone || '';
    $('#player-level').value = p.level || '';
    $('#player-notes').value = p.notes || '';
    $('#player-name')?.focus();
}

async function savePlayer() {
    const name  = $('#player-name')?.value.trim();
    const phone = $('#player-phone')?.value.trim();
    const level = $('#player-level')?.value;
    const notes = $('#player-notes')?.value.trim();
    const editId = $('#edit-player-id')?.value;

    if (!name) { alert('Name is required.'); return; }

    const btn = $('#save-player');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const payload = { name, phone, level, notes };
    if (editId) payload.id = editId;

    const result = await api('save_player', payload);
    btn.disabled = false;
    btn.textContent = 'Save Player';

    if (result?.success) {
        hideAddPlayerForm();
        await loadOutreach();
    } else {
        alert('Save failed: ' + (result?.error || 'unknown'));
    }
}

async function deletePlayer(id) {
    if (!confirm('Delete this player?')) return;
    const result = await api('delete_player', id);
    if (result?.success) {
        await loadOutreach();
    } else {
        alert('Delete failed: ' + (result?.error || 'unknown'));
    }
}
