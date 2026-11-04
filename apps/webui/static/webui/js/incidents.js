// Incidents table with search and status filter.
import { requireLogin, initNavbar } from './auth.js';
import { apiGet } from './api.js';
import { API } from './constants.js';
import { filterIncidents, incidentRow, operatorAccessNotice } from './tables.js';
import { showToast } from './ui.js';

async function init() {
    if (!requireLogin()) return;
    initNavbar();
    const search = document.getElementById('incidentSearch');
    const status = document.getElementById('incidentStatus');
    const rows = document.getElementById('incidentRows');
    const empty = document.getElementById('incidentEmpty');

    const res = await apiGet(API.incidents);
    if (res.status === 403) {
        document.querySelector('[data-page-body]').innerHTML = operatorAccessNotice();
        return;
    }
    if (!res.ok) showToast('Could not load incidents.', 'error');
    const incidents = res.ok ? res.data : [];

    const render = () => {
        const shown = filterIncidents(incidents, { query: search.value, status: status.value });
        rows.innerHTML = shown.map(incidentRow).join('');
        empty.classList.toggle('d-none', shown.length > 0);
    };
    search.addEventListener('input', render);
    status.addEventListener('change', render);
    render();
}

init();
