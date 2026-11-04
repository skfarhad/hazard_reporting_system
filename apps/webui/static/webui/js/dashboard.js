// Dashboard: summary cards and the incident/volunteer map.
import { requireLogin, initNavbar } from './auth.js';
import { apiGet } from './api.js';
import { API, LEGEND_WIDE_QUERY } from './constants.js';
import { summarize, operatorAccessNotice } from './tables.js';
import { createMap, drawMarkers } from './map.js';
import { addLegend } from './map-legend.js';
import { showToast } from './ui.js';

async function init() {
    if (!requireLogin()) return;
    initNavbar();
    const map = createMap(window.L, document.getElementById('map'));

    const [incidents, volunteers, needTypes] = await Promise.all([
        apiGet(API.incidents), apiGet(API.volunteers), apiGet(API.needTypes),
    ]);
    if (incidents.status === 403) {
        document.querySelector('[data-page-body]').innerHTML = operatorAccessNotice();
        return;
    }
    if (!incidents.ok || !volunteers.ok) {
        showToast('Could not load the map data.', 'error');
    }
    const incidentList = incidents.ok ? incidents.data : [];
    const volunteerList = volunteers.ok ? volunteers.data : [];

    const summary = summarize(incidentList, volunteerList);
    document.querySelectorAll('[data-summary]').forEach((el) => {
        el.textContent = summary[el.dataset.summary];
    });
    // Without need types the pins still draw, with a generic icon; no toast needed.
    const needTypeList = needTypes.ok ? needTypes.data : [];
    drawMarkers(window.L, map, incidentList, volunteerList, needTypeList);
    addLegend(window.L, map, needTypeList, {
        storage: window.localStorage,
        isWide: window.matchMedia(LEGEND_WIDE_QUERY).matches,
    });
}

init();
