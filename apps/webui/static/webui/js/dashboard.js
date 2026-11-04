// Dashboard: summary cards and the incident/volunteer map.
import { requireLogin, initNavbar } from './auth.js';
import { apiGet } from './api.js';
import { API } from './constants.js';
import { summarize } from './tables.js';
import { createMap, drawMarkers } from './map.js';
import { showToast } from './ui.js';

async function init() {
    if (!requireLogin()) return;
    initNavbar();
    const map = createMap(window.L, document.getElementById('map'));

    const [incidents, volunteers] = await Promise.all([apiGet(API.incidents), apiGet(API.volunteers)]);
    if (!incidents.ok || !volunteers.ok) {
        showToast('Could not load the map data.', 'error');
    }
    const incidentList = incidents.ok ? incidents.data : [];
    const volunteerList = volunteers.ok ? volunteers.data : [];

    const summary = summarize(incidentList, volunteerList);
    document.querySelectorAll('[data-summary]').forEach((el) => {
        el.textContent = summary[el.dataset.summary];
    });
    drawMarkers(window.L, map, incidentList, volunteerList);
}

init();
