// Volunteers table with search.
import { requireLogin, initNavbar } from './auth.js';
import { apiGet } from './api.js';
import { API } from './constants.js';
import { filterVolunteers, volunteerRow } from './tables.js';
import { showToast } from './ui.js';

async function init() {
    if (!requireLogin()) return;
    initNavbar();
    const search = document.getElementById('volunteerSearch');
    const rows = document.getElementById('volunteerRows');
    const empty = document.getElementById('volunteerEmpty');

    const res = await apiGet(API.volunteers);
    if (!res.ok) showToast('Could not load volunteers.', 'error');
    const volunteers = res.ok ? res.data : [];

    const render = () => {
        const shown = filterVolunteers(volunteers, { query: search.value });
        rows.innerHTML = shown.map(volunteerRow).join('');
        empty.classList.toggle('d-none', shown.length > 0);
    };
    search.addEventListener('input', render);
    render();
}

init();
