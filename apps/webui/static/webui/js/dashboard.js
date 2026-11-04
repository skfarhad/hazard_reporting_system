// Dashboard: summary cards and the incident/volunteer map, plus "Report incident" for everyone.
import { requireLogin, initNavbar } from './auth.js';
import { apiGet } from './api.js';
import { API, DASHBOARD_MAP_PAGE_SIZE, LEGEND_WIDE_QUERY } from './constants.js';
import { summarize, reportPanelHtml } from './tables.js';
import { createMap, drawMarkers } from './map.js';
import { addLegend } from './map-legend.js';
import { createReportModal } from './report-modal.js';
import { showToast } from './ui.js';

const view = { map: null, drawn: [], legend: false };

// Loads incidents and volunteers and (re)draws the cards and the map.
// Returns false when the account isn't an operator.
async function load() {
    const [incidents, volunteers, needTypes] = await Promise.all([
        apiGet(`${API.incidents}?page_size=${DASHBOARD_MAP_PAGE_SIZE}`), apiGet(API.volunteers), apiGet(API.needTypes),
    ]);
    if (incidents.status === 403) {
        document.querySelector('[data-page-body]').innerHTML = reportPanelHtml();
        return false;
    }
    if (!incidents.ok || !volunteers.ok) {
        showToast('Could not load the map data.', 'error');
    }
    // The list API is paginated; the map takes one page of up to 500, newest first.
    const incidentList = incidents.ok ? incidents.data.results : [];
    const volunteerList = volunteers.ok ? volunteers.data : [];

    const summary = summarize(incidentList, volunteerList);
    summary.total = incidents.ok ? incidents.data.count : 0;
    document.querySelectorAll('[data-summary]').forEach((el) => {
        el.textContent = summary[el.dataset.summary];
    });
    // Without need types the pins still draw, with a generic icon; no toast needed.
    const needTypeList = needTypes.ok ? needTypes.data : [];
    view.drawn.forEach((layer) => layer.remove());
    view.drawn = drawMarkers(window.L, view.map, incidentList, volunteerList, needTypeList);
    if (!view.legend) {
        addLegend(window.L, view.map, needTypeList, {
            storage: window.localStorage,
            isWide: window.matchMedia(LEGEND_WIDE_QUERY).matches,
        });
        view.legend = true;
    }
    return true;
}

async function init() {
    if (!requireLogin()) return;
    initNavbar();
    view.map = createMap(window.L, document.getElementById('map'));
    const isOperator = await load();
    createReportModal({
        L: window.L,
        Modal: window.bootstrap.Modal,
        element: document.getElementById('reportModal'),
        // Operators see the new report straight away; others can't see incidents.
        onCreated: () => { if (isOperator) load(); },
    });
}

init();
