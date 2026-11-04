// Incidents page: server-side filters, search and pages, kept in the page URL.
import { requireLogin, initNavbar } from './auth.js';
import { apiGet } from './api.js';
import { API } from './constants.js';
import { operatorAccessNotice } from './tables.js';
import { showToast } from './ui.js';
import {
    DEFAULT_FILTERS, readFilters, filtersToSearch, filtersToApiParams, withFilter, withScope, scopeValue,
    showingText, totalPages,
} from './incident-query.js';
import {
    incidentTableRow, incidentCard, needChips, eventHazardOptions, pagerHtml, incidentDetailsHtml,
} from './incident-views.js';
import { createIncidentDetail, incidentIdFromHash } from './incident-detail.js';
import { incidentIcon } from './map.js';

const SEARCH_DELAY_MS = 300;

const els = {};
const state = { filters: { ...DEFAULT_FILTERS }, needTypes: [], events: [], page: { count: 0, results: [] }, request: 0 };
let detail = null;

function isFiltered(filters) {
    return filtersToSearch({ ...filters, page: 1 }) !== '';
}

function renderControls() {
    const { filters } = state;
    if (document.activeElement !== els.search) els.search.value = filters.q;
    els.status.value = filters.status;
    els.scope.innerHTML = eventHazardOptions(state.events, scopeValue(filters));
    els.urgent.setAttribute('aria-pressed', String(filters.lifeThreatening));
    els.chips.innerHTML = needChips(state.needTypes, filters.needs);
    els.clear.classList.toggle('d-none', !isFiltered(filters));
}

function renderResults() {
    const { results, count } = state.page;
    els.rows.innerHTML = results.map((i) => incidentTableRow(i, state.needTypes)).join('');
    els.cards.innerHTML = results.map((i) => incidentCard(i, state.needTypes)).join('');
    els.empty.classList.toggle('d-none', results.length > 0);
    els.showing.textContent = showingText(state.filters.page, count);
    els.pager.innerHTML = pagerHtml(state.filters.page, totalPages(count));
}

// Loads one page of incidents for the given filters. Returns false when the account isn't an operator.
async function loadPage(filters) {
    const request = ++state.request;
    const res = await apiGet(`${API.incidents}?${filtersToApiParams(filters)}`);
    if (request !== state.request) return true; // a newer request has been made since
    if (res.status === 403) {
        document.querySelector('[data-page-body]').innerHTML = operatorAccessNotice();
        return false;
    }
    if (res.status === 404 && filters.page > 1) {
        // Past the last page (e.g. after other filters shrank the list): go to page 1.
        return applyFilters(withFilter(filters, { page: 1 }), { replace: true });
    }
    if (!res.ok) {
        showToast('Could not load incidents.', 'error');
        state.page = { count: 0, results: [] };
    } else {
        state.page = res.data;
    }
    state.filters = filters;
    renderControls();
    renderResults();
    return true;
}

async function applyFilters(filters, { replace = false } = {}) {
    const url = `${window.location.pathname}${filtersToSearch(filters)}${window.location.hash}`;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
    return loadPage(filters);
}

function bindControls() {
    let searchTimer;
    els.search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => applyFilters(withFilter(state.filters, { q: els.search.value }), { replace: true }), SEARCH_DELAY_MS);
    });
    els.form.addEventListener('submit', (event) => event.preventDefault());
    els.status.addEventListener('change', () => applyFilters(withFilter(state.filters, { status: els.status.value })));
    els.scope.addEventListener('change', () => applyFilters(withScope(state.filters, els.scope.value)));
    els.urgent.addEventListener('click', () => applyFilters(withFilter(state.filters, { lifeThreatening: !state.filters.lifeThreatening })));
    els.clear.addEventListener('click', () => applyFilters({ ...DEFAULT_FILTERS }));
    els.chips.addEventListener('click', (event) => {
        const chip = event.target.closest('button[data-need]');
        if (!chip) return;
        const code = chip.dataset.need;
        const needs = state.filters.needs.includes(code)
            ? state.filters.needs.filter((c) => c !== code)
            : [...state.filters.needs, code];
        applyFilters(withFilter(state.filters, { needs }));
    });
    els.pager.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-page]');
        if (!button || button.disabled) return;
        const { page } = state.filters;
        const target = { prev: page - 1, next: page + 1 }[button.dataset.page] ?? Number(button.dataset.page);
        applyFilters(withFilter(state.filters, { page: target })).then(() => els.rows.closest('.card').scrollIntoView({ block: 'start' }));
    });
    window.addEventListener('popstate', () => loadPage(readFilters(window.location.search)));

    const openFrom = (event) => {
        const target = event.target.closest('[data-incident-id]');
        if (target && !event.target.closest('a')) detail.open(Number(target.dataset.incidentId));
    };
    els.rows.addEventListener('click', openFrom);
    els.cards.addEventListener('click', openFrom);
    els.rows.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openFrom(event);
    });
}

function setUpDetail() {
    detail = createIncidentDetail({
        L: window.L,
        Modal: window.bootstrap.Modal,
        element: document.getElementById('incidentModal'),
        needTypes: state.needTypes,
        fetchIncident: (id) => apiGet(API.incident(id)),
        page: () => ({
            ids: state.page.results.map((i) => i.id),
            page: state.filters.page,
            pages: totalPages(state.page.count),
        }),
        goToPage: async (page) => {
            await applyFilters(withFilter(state.filters, { page }));
            return state.page.results.map((i) => i.id);
        },
        render: { details: incidentDetailsHtml, icon: incidentIcon },
        // Focus goes back to the incident's row (or card) so keyboard users keep their place.
        onClosed: (id) => [...document.querySelectorAll(`[data-incident-id="${id}"]`)]
            .find((el) => el.offsetParent !== null)?.focus(),
    });
}

async function init() {
    if (!requireLogin()) return;
    initNavbar();
    ['form:incidentFilters', 'search:incidentSearch', 'status:incidentStatus', 'scope:incidentScope', 'urgent:incidentUrgent',
        'clear:incidentClear', 'chips:incidentNeedChips', 'rows:incidentRows', 'cards:incidentCards', 'empty:incidentEmpty',
        'pager:incidentPager', 'showing:incidentShowing'].forEach((pair) => {
        const [key, id] = pair.split(':');
        els[key] = document.getElementById(id);
    });

    const [needTypes, events] = await Promise.all([apiGet(API.needTypes), apiGet(API.events)]);
    state.needTypes = needTypes.ok ? needTypes.data : [];
    state.events = events.ok ? events.data : [];
    bindControls();
    setUpDetail();
    const loaded = await loadPage(readFilters(window.location.search));
    const linked = incidentIdFromHash(window.location.hash);
    if (loaded && linked) detail.open(linked);
}

init();
