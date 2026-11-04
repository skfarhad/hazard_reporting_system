// Live dashboard: incidents (left), map (centre) and volunteers (right), kept up to date over a WebSocket.
// Non-operators get the "Report an incident" panel instead.
import { requireLogin, initNavbar } from './auth.js';
import { apiGet, apiPost, apiDelete } from './api.js';
import { API } from './constants.js';
import { reportPanelHtml } from './tables.js';
import { createMap, drawMarkers } from './map.js';
import { addLegend } from './map-legend.js';
import { createReportModal } from './report-modal.js';
import { showToast } from './ui.js';
import { getAccessToken } from './utils.js';
import {
    PERIODS, readDashboardState, dashboardToSearch, withArea, incidentApiParams, summaryApiParams,
    volunteerApiParams, volunteerSummaryParams, incidentsShowingText, volunteersShowingText,
} from './dashboard-query.js';
import {
    dashIncidentCard, incidentPopupCard, statCardsHtml, volunteerCard, zillaOptions, upazilaOptions,
} from './dashboard-views.js';
import { readPanels, savePanels, togglePanel, applyPanels, setMobileTab } from './dashboard-layout.js';
import { createLiveSocket, debounceNudges, socketUrl } from './live.js';
import { setUpIncidentModal } from './incident-modal.js';

const SEARCH_DELAY_MS = 300;
const NUDGE_DELAY_MS = 2000;
const SELECTED_ZOOM = 13;
const PHONE_QUERY = '(max-width: 991.98px)';
// Popups pan clear of the live badge (top) and the Report incident button (bottom).
const POPUP_OPTIONS = { autoPanPaddingTopLeft: [16, 56], autoPanPaddingBottomRight: [16, 84] };

const els = {};
const state = { ...readDashboardState(window.location.search) };
const data = {
    places: [], needTypes: [], events: [], incidents: [], summary: null, volunteers: [], volunteerSummary: null,
    assigned: new Set(), // volunteer ids assigned to the selected incident
};
const view = { map: null, drawn: null, fitNext: true, legend: false, requests: { incidents: 0, volunteers: 0 } };
let detail = null;

const selectedIncident = () => data.incidents.find((i) => i.id === state.selected) || null;

function saveUrl() {
    window.history.replaceState(null, '', `${window.location.pathname}${dashboardToSearch(state)}${window.location.hash}`);
}

// ---- Rendering ----

function renderAreaSelects() {
    [[els.zilla, els.upazila], [els.vZilla, els.vUpazila]].forEach(([zilla, upazila]) => {
        zilla.innerHTML = zillaOptions(data.places, state.district);
        upazila.innerHTML = upazilaOptions(data.places, state.district, state.thana);
        upazila.disabled = !state.district;
    });
}

function renderIncidents() {
    const s = data.summary;
    els.incidentStats.innerHTML = statCardsHtml([
        { key: 'pending', label: 'Pending', count: s?.pending },
        { key: 'resolved', label: 'Resolved', count: s?.resolved },
        { key: 'all', label: 'Total', count: s?.total },
    ], state.status, 'status');
    els.incidentShowing.textContent = incidentsShowingText(data.incidents.length, state.status);
    els.incidentList.innerHTML = data.incidents.map((i) => dashIncidentCard(i, { selected: i.id === state.selected })).join('');
}

function renderVolunteers() {
    const s = data.volunteerSummary;
    els.volunteerStats.innerHTML = statCardsHtml([
        { key: 'active', label: 'Active', count: s?.active },
        { key: 'inactive', label: 'Inactive', count: s?.inactive },
        { key: 'all', label: 'Total', count: s?.total },
    ], state.vstatus, 'vstatus');
    const incident = selectedIncident();
    els.assignHint.hidden = !incident;
    els.assignHint.textContent = incident ? `Assigning to incident #${incident.id}, nearest volunteers first.` : '';
    els.volunteerShowing.textContent = volunteersShowingText(data.volunteers.length, state.vstatus);
    els.volunteerList.innerHTML = data.volunteers
        .map((v) => volunteerCard(v, { selectedIncident: incident, assigned: data.assigned.has(v.id) })).join('');
}

function drawMap() {
    view.drawn?.layers.forEach((layer) => layer.remove());
    view.drawn = drawMarkers(window.L, view.map, data.incidents, data.volunteers, data.needTypes, {
        incidentPopup: incidentPopupCard,
        popupOptions: POPUP_OPTIONS,
        onIncidentClick: (incident) => selectIncident(incident.id, { from: 'map' }),
        fit: view.fitNext,
    });
    view.fitNext = false;
    if (!view.legend) {
        // Starts collapsed here: the side panels leave a narrow map, and the open legend would cover the
        // Report button. An operator's own open/closed choice is still remembered.
        addLegend(window.L, view.map, data.needTypes, { storage: window.localStorage, isWide: false });
        view.legend = true;
    }
}

function renderLiveStatus(status) {
    const text = { connecting: 'Connecting…', live: 'Live', reconnecting: 'Reconnecting…', offline: 'Not live: reload to retry' };
    els.liveStatus.dataset.status = status;
    els.liveStatus.querySelector('[data-live-text]').textContent = text[status] || '';
}

// ---- Loading ----

// Returns false when the account isn't an operator.
async function loadIncidents({ quiet = false } = {}) {
    const request = ++view.requests.incidents;
    const [list, summary] = await Promise.all([
        apiGet(`${API.incidents}?${incidentApiParams(state)}`, { quiet }),
        apiGet(`${API.incidentSummary}?${summaryApiParams(state)}`, { quiet }),
    ]);
    if (request !== view.requests.incidents) return true; // a newer load has started
    if (list.status === 403) return false;
    if (!list.ok && !quiet) showToast('Could not load incidents.', 'error');
    data.incidents = list.ok ? list.data.results : [];
    data.summary = summary.ok ? summary.data : null;
    if (state.selected && !selectedIncident()) {
        state.selected = null; // no longer in this period, status or area
        data.assigned = new Set();
        saveUrl();
    }
    renderIncidents();
    drawMap();
    return true;
}

async function loadAssigned() {
    const incident = selectedIncident();
    if (!incident) {
        data.assigned = new Set();
        return;
    }
    const res = await apiGet(API.incident(incident.id), { quiet: true });
    data.assigned = new Set(res.ok ? res.data.volunteers.map((v) => v.id) : []);
}

async function loadVolunteers({ quiet = false } = {}) {
    const request = ++view.requests.volunteers;
    const [list, summary] = await Promise.all([
        apiGet(`${API.volunteers}?${volunteerApiParams(state, selectedIncident())}`, { quiet }),
        apiGet(`${API.volunteerSummary}?${volunteerSummaryParams(state)}`, { quiet }),
        loadAssigned(),
    ]);
    if (request !== view.requests.volunteers) return;
    if (!list.ok && !quiet) showToast('Could not load volunteers.', 'error');
    data.volunteers = list.ok ? list.data : [];
    data.volunteerSummary = summary.ok ? summary.data : null;
    renderVolunteers();
    drawMap();
}

function reloadAll({ quiet = true } = {}) {
    return Promise.all([loadIncidents({ quiet }), loadVolunteers({ quiet })]);
}

// ---- Interaction ----

function isPhone() {
    return window.matchMedia(PHONE_QUERY).matches;
}

// Selecting a card pans the map to its pin; clicking a pin highlights and scrolls to its card.
// Selecting the selected card again clears the selection.
async function selectIncident(id, { from = 'list' } = {}) {
    state.selected = state.selected === id && from === 'list' ? null : id;
    saveUrl();
    renderIncidents();
    const incident = selectedIncident();
    if (incident && from === 'list') {
        if (isPhone()) setMobileTab(els.root, 'map');
        const marker = view.drawn?.incidentMarkers.get(incident.id);
        if (marker) {
            view.map.setView(marker.getLatLng(), Math.max(view.map.getZoom(), SELECTED_ZOOM));
            marker.openPopup();
        }
    }
    if (incident && from === 'map') {
        els.incidentList.querySelector(`[data-incident-id="${incident.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    await loadVolunteers({ quiet: true });
    // Redrawing the map closes popups: reopen the selected pin's.
    if (incident) view.drawn?.incidentMarkers.get(incident.id)?.openPopup();
}

async function changeAssignment(volunteerId, assign) {
    const incident = selectedIncident();
    if (!incident) return;
    const res = assign
        ? await apiPost(API.incidentVolunteers(incident.id), { volunteer: volunteerId }, { quiet: true })
        : await apiDelete(API.incidentVolunteer(incident.id, volunteerId), { quiet: true });
    if (!res.ok) {
        showToast(res.data?.detail || 'Could not change the assignment.', 'error');
        return;
    }
    showToast(assign ? 'Volunteer assigned.' : 'Volunteer unassigned.', 'success');
    await reloadAll();
}

function applyChange(change, { refit = true, incidents = true, volunteers = true } = {}) {
    Object.assign(state, change);
    if (refit) view.fitNext = true;
    saveUrl();
    renderAreaSelects();
    if (incidents) loadIncidents();
    if (volunteers) loadVolunteers();
}

function debounce(fn, wait) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}

function bindControls() {
    els.period.addEventListener('change', () => applyChange({ period: els.period.value }, { volunteers: false }));
    els.incidentStats.addEventListener('click', (event) => {
        const card = event.target.closest('[data-status]');
        if (card) applyChange({ status: card.dataset.status }, { volunteers: false });
    });
    els.volunteerStats.addEventListener('click', (event) => {
        const card = event.target.closest('[data-vstatus]');
        if (card) applyChange({ vstatus: card.dataset.vstatus }, { incidents: false, refit: false });
    });
    [els.zilla, els.vZilla].forEach((select) => select.addEventListener('change', () => {
        Object.assign(state, withArea(state, { district: select.value }));
        applyChange({});
    }));
    [els.upazila, els.vUpazila].forEach((select) => select.addEventListener('change', () => {
        Object.assign(state, withArea(state, { thana: select.value }));
        applyChange({});
    }));
    els.incidentSearch.addEventListener('input', debounce(
        () => applyChange({ q: els.incidentSearch.value }, { volunteers: false }), SEARCH_DELAY_MS,
    ));
    els.volunteerSearch.addEventListener('input', debounce(
        () => applyChange({ vq: els.volunteerSearch.value }, { incidents: false, refit: false }), SEARCH_DELAY_MS,
    ));
    els.root.querySelectorAll('[data-toggle-search]').forEach((button) => button.addEventListener('click', () => {
        const box = document.getElementById(button.getAttribute('aria-controls'));
        box.hidden = !box.hidden;
        button.setAttribute('aria-expanded', String(!box.hidden));
        if (!box.hidden) box.querySelector('input').focus();
    }));

    els.incidentList.addEventListener('click', (event) => {
        const item = event.target.closest('[data-incident-id]');
        if (!item || event.target.closest('[data-action="incident-details"]')) return;
        if (event.target.closest('[data-action="select-incident"]')) selectIncident(Number(item.dataset.incidentId));
    });
    // "View details" on cards and in map popups.
    els.root.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="incident-details"]');
        if (button) detail.open(Number(button.dataset.incidentId));
    });
    els.volunteerList.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-action="assign"], [data-action="unassign"]');
        if (!button) return;
        button.disabled = true;
        await changeAssignment(Number(button.closest('[data-volunteer-id]').dataset.volunteerId), button.dataset.action === 'assign');
        button.disabled = false;
    });

    let panels = readPanels(window.localStorage);
    applyPanels(els.root, panels);
    els.root.querySelectorAll('[data-toggle-panel]').forEach((button) => button.addEventListener('click', () => {
        panels = togglePanel(panels, button.dataset.togglePanel);
        savePanels(window.localStorage, panels);
        applyPanels(els.root, panels);
        // The map's box changed size.
        setTimeout(() => view.map.invalidateSize(), 260);
    }));
    els.root.querySelectorAll('[data-mobile-tab]').forEach((button) => button.addEventListener('click', () => {
        if (setMobileTab(els.root, button.dataset.mobileTab) === 'map') setTimeout(() => view.map.invalidateSize(), 0);
    }));
}

function setUpDetail() {
    detail = setUpIncidentModal({
        lists: () => ({ needTypes: data.needTypes, events: data.events, volunteers: data.volunteers }),
        page: () => ({ ids: data.incidents.map((i) => i.id), page: 1, pages: 1 }),
        goToPage: async () => [],
        onSaved: () => reloadAll(),
        onClosed: (id) => els.incidentList.querySelector(`[data-incident-id="${id}"] [data-action="incident-details"]`)?.focus(),
    });
}

function startLive() {
    const refresh = debounceNudges((kinds) => {
        if (kinds.has('incident')) loadIncidents({ quiet: true });
        // Assignments change volunteers' counts and the selected incident's volunteers.
        loadVolunteers({ quiet: true });
        window.dispatchEvent(new CustomEvent('hrs:incidents-changed'));
    }, NUDGE_DELAY_MS);
    createLiveSocket({
        url: socketUrl(window.location),
        getToken: getAccessToken,
        WebSocket: window.WebSocket,
        onNudge: refresh,
        onStatus: renderLiveStatus,
        onReconnect: () => reloadAll(),
    });
}

function showReportPanel() {
    els.root.className = 'hrs-container py-4';
    els.root.innerHTML = reportPanelHtml();
}

async function init() {
    if (!requireLogin()) return;
    initNavbar();
    Object.assign(els, {
        root: document.getElementById('dashboard'),
        period: document.getElementById('periodSelect'),
        incidentStats: document.getElementById('incidentStats'),
        zilla: document.getElementById('zillaSelect'),
        upazila: document.getElementById('upazilaSelect'),
        vZilla: document.getElementById('volunteerZillaSelect'),
        vUpazila: document.getElementById('volunteerUpazilaSelect'),
        incidentSearch: document.getElementById('incidentSearch'),
        incidentShowing: document.getElementById('incidentShowing'),
        incidentList: document.getElementById('incidentList'),
        volunteerStats: document.getElementById('volunteerStats'),
        volunteerSearch: document.getElementById('volunteerSearch'),
        volunteerShowing: document.getElementById('volunteerShowing'),
        volunteerList: document.getElementById('volunteerList'),
        assignHint: document.getElementById('assignHint'),
        liveStatus: document.getElementById('liveStatus'),
    });
    setMobileTab(els.root, 'map');
    els.period.innerHTML = PERIODS.map((p) => `<option value="${p.value}"${p.value === state.period ? ' selected' : ''}>${p.label}</option>`).join('');
    els.incidentSearch.value = state.q;
    els.volunteerSearch.value = state.vq;
    if (state.q) document.getElementById('incidentSearchBox').hidden = false;
    if (state.vq) document.getElementById('volunteerSearchBox').hidden = false;
    view.map = createMap(window.L, document.getElementById('map'));

    const [needTypes, places, events] = await Promise.all([apiGet(API.needTypes), apiGet(API.places), apiGet(API.events)]);
    data.needTypes = needTypes.ok ? needTypes.data : [];
    data.places = places.ok ? places.data : [];
    data.events = events.ok ? events.data : [];
    renderAreaSelects();

    const isOperator = await loadIncidents();
    createReportModal({
        L: window.L,
        Modal: window.bootstrap.Modal,
        element: document.getElementById('reportModal'),
        // Operators get the new report through the live socket; nothing to do here.
        onCreated: () => {},
    });
    if (!isOperator) {
        showReportPanel();
        return;
    }
    await loadVolunteers();
    bindControls();
    setUpDetail();
    startLive();
}

init();
