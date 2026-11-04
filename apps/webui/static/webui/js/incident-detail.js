// Incident details pop-up: details, map preview, prev/next and quick actions.

// Where Prev/Next goes from incident `id` on this page of `ids`: another incident here,
// the neighbouring page (its first or last incident), or nowhere.
export function adjacentIncident({ ids, id, dir, page, pages }) {
    const index = ids.indexOf(id);
    if (index === -1) return null;
    const target = index + dir;
    if (target >= 0 && target < ids.length) return { id: ids[target] };
    if (dir > 0 && page < pages) return { page: page + 1, position: 'first' };
    if (dir < 0 && page > 1) return { page: page - 1, position: 'last' };
    return null;
}

export function incidentHash(id) {
    return `#incident-${Number(id)}`;
}

export function incidentIdFromHash(hash) {
    const match = /^#incident-(\d+)$/.exec(hash || '');
    return match ? Number(match[1]) : null;
}

const MAP_ZOOM = 14;

function isTyping(target) {
    return target instanceof HTMLElement && target.matches('input, select, textarea, [contenteditable]');
}

// Wires the modal. `page` gives the ids on the current page, the page number and the page count;
// `goToPage(n)` loads another page of the list and resolves to its ids.
export function createIncidentDetail({ L, Modal, element, needTypes, fetchIncident, page, goToPage, render, onClosed }) {
    const modal = Modal.getOrCreateInstance(element);
    const title = element.querySelector('#incidentModalTitle');
    const body = element.querySelector('#incidentDetailBody');
    const mapBox = element.querySelector('#incidentDetailMap');
    const prev = element.querySelector('#incidentPrev');
    const next = element.querySelector('#incidentNext');
    let current = null;
    let map = null;
    let marker = null;

    function updateNav() {
        const info = page();
        const id = current?.id;
        prev.disabled = !id || !adjacentIncident({ ...info, id, dir: -1 });
        next.disabled = !id || !adjacentIncident({ ...info, id, dir: 1 });
    }

    function showOnMap(incident, { createIfMissing = false } = {}) {
        const hasPlace = Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude);
        mapBox.classList.toggle('d-none', !hasPlace);
        if (!hasPlace || !L) return;
        if (!map && !createIfMissing) return;
        if (!map) {
            map = L.map(mapBox, { scrollWheelZoom: false });
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin',
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
        }
        const latLng = [incident.latitude, incident.longitude];
        if (marker) marker.remove();
        marker = L.marker(latLng, { icon: render.icon(L, incident, needTypes), keyboard: false }).addTo(map);
        map.invalidateSize();
        map.setView(latLng, MAP_ZOOM);
    }

    function show(incident) {
        current = incident;
        title.textContent = `Incident #${incident.id}`;
        body.innerHTML = render.details(incident, needTypes);
        render.afterShow?.(incident);
        // Visible already: the map can be measured now. Otherwise `shown.bs.modal` draws it.
        if (element.classList.contains('show')) showOnMap(incident, { createIfMissing: true });
        updateNav();
    }

    async function open(id) {
        current = { id };
        title.textContent = `Incident #${id}`;
        body.innerHTML = '<div class="text-secondary">Loading…</div>';
        updateNav();
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${incidentHash(id)}`);
        modal.show();
        const res = await fetchIncident(id);
        if (current?.id !== id) return; // moved on to another incident meanwhile
        if (!res.ok) {
            body.innerHTML = `<div class="alert alert-warning mb-0">${res.status === 404 ? 'This incident no longer exists.' : 'Could not load this incident.'}</div>`;
            mapBox.classList.add('d-none');
            return;
        }
        show(res.data);
    }

    async function step(dir) {
        if (!current) return;
        const target = adjacentIncident({ ...page(), id: current.id, dir });
        if (!target) return;
        if (target.id) return open(target.id);
        const ids = await goToPage(target.page);
        if (ids.length) open(target.position === 'first' ? ids[0] : ids[ids.length - 1]);
    }

    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    element.addEventListener('keydown', (event) => {
        if (isTyping(event.target)) return;
        if (event.key === 'ArrowLeft') step(-1);
        if (event.key === 'ArrowRight') step(1);
    });
    // Leaflet measures its box, so the map is only created once the modal is visible.
    element.addEventListener('shown.bs.modal', () => { if (current?.latitude !== undefined) showOnMap(current, { createIfMissing: true }); });
    element.addEventListener('hidden.bs.modal', () => {
        const closedId = current?.id;
        current = null;
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        onClosed?.(closedId);
    });

    return { open, show, current: () => current, refreshNav: updateNav };
}
