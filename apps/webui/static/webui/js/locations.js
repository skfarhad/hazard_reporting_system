// Location tab (operators): add, rename and delete districts and thanas, and upload their GeoJSON boundaries.
import { requireLogin, initNavbar } from './auth.js';
import { apiGet, apiPost, apiPatch, apiDelete } from './api.js';
import { API, BANGLADESH_CENTER, BANGLADESH_ZOOM } from './constants.js';
import { operatorsOnlyHtml } from './tables.js';
import { showToast } from './ui.js';
import {
    readBoundaryFile, districtRowHtml, thanaRowHtml, divisionOptions, placeEditorHtml,
} from './locations-views.js';

const els = {};
const state = { divisions: [], districts: [], thanas: new Map(), open: new Set(), editing: null };
let previewMap = null;
let previewLayer = null;

function firstError(data, fallback) {
    if (!data) return fallback;
    if (data.detail) return data.detail;
    const first = Object.values(data)[0];
    return Array.isArray(first) ? first[0] : (typeof first === 'string' ? first : fallback);
}

function isEditing(kind, id) {
    return state.editing?.kind === kind && state.editing.place.id === id;
}

function thanaListHtml(districtId) {
    const thanas = state.thanas.get(districtId);
    const rows = thanas
        ? thanas.map((t) => thanaRowHtml(t, { selected: isEditing('thana', t.id) })).join('')
          || '<li class="small text-secondary px-3 py-2">No thanas yet.</li>'
        : '<li class="small text-secondary px-3 py-2">Loading…</li>';
    return `${rows}<li class="px-3 py-2"><form class="d-flex gap-2" data-form="add-thana" data-district-id="${districtId}" novalidate>
        <label class="visually-hidden" for="newThana-${districtId}">New thana</label>
        <input class="form-control form-control-sm" id="newThana-${districtId}" name="name" placeholder="New thana" maxlength="100" required>
        <button type="submit" class="btn btn-sm btn-outline-primary text-nowrap flex-shrink-0">Add thana</button></form>
        <div class="small text-danger" data-error-for="thana-${districtId}" role="alert"></div></li>`;
}

function renderDistricts() {
    const query = els.search.value.trim().toLowerCase();
    const shown = state.districts.filter((d) => !query || d.name.toLowerCase().includes(query));
    els.list.innerHTML = shown.map((d) => districtRowHtml(d, {
        open: state.open.has(d.id), selected: isEditing('district', d.id),
    })).join('');
    shown.filter((d) => state.open.has(d.id)).forEach((d) => {
        els.list.querySelector(`[data-thanas-of="${d.id}"]`).innerHTML = thanaListHtml(d.id);
    });
    els.empty.classList.toggle('d-none', shown.length > 0);
}

async function loadDistricts() {
    const res = await apiGet(API.manageDistricts);
    if (res.status === 403) return false;
    if (!res.ok) showToast('Could not load districts.', 'error');
    state.districts = res.ok ? res.data : [];
    renderDistricts();
    return true;
}

async function loadThanas(districtId) {
    const res = await apiGet(`${API.manageThanas}?district=${Number(districtId)}`, { quiet: true });
    state.thanas.set(districtId, res.ok ? res.data : []);
    renderDistricts();
}

function drawPreview(boundary) {
    const box = els.editor.querySelector('[data-place-map]');
    if (!box || !window.L) return;
    if (previewMap) previewMap.remove();
    previewMap = window.L.map(box, { scrollWheelZoom: false }).setView(BANGLADESH_CENTER, BANGLADESH_ZOOM);
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(previewMap);
    previewLayer = boundary ? window.L.geoJSON(boundary).addTo(previewMap) : null;
    if (previewLayer) previewMap.fitBounds(previewLayer.getBounds(), { padding: [12, 12] });
}

function placeUrl(kind, id) {
    return kind === 'district' ? API.manageDistrict(id) : API.manageThana(id);
}

async function openEditor(kind, id) {
    const res = await apiGet(placeUrl(kind, id));
    if (!res.ok) {
        showToast('Could not load this place.', 'error');
        return;
    }
    state.editing = { kind, place: res.data };
    els.editor.innerHTML = placeEditorHtml(res.data, kind);
    drawPreview(res.data.boundary);
    renderDistricts();
    if (window.matchMedia('(max-width: 991.98px)').matches) els.editor.scrollIntoView({ block: 'start' });
}

// After a change: the lists show new names, counts and boundary flags.
async function refreshLists(districtId) {
    await loadDistricts();
    if (districtId && state.open.has(districtId)) await loadThanas(districtId);
}

function districtIdOf(kind, place) {
    return kind === 'district' ? place.id : place.district?.id;
}

async function savePlace(body, errorSlot) {
    const { kind, place } = state.editing;
    const res = await apiPatch(placeUrl(kind, place.id), body);
    if (!res.ok) {
        els.editor.querySelector(`[data-error-for="${errorSlot}"]`).textContent = firstError(res.data, 'Could not save.');
        return false;
    }
    await refreshLists(districtIdOf(kind, res.data));
    await openEditor(kind, place.id);
    return true;
}

function bindEditor() {
    els.editor.addEventListener('submit', async (event) => {
        if (event.target.dataset.form !== 'rename') return;
        event.preventDefault();
        const name = event.target.elements.name.value.trim();
        if (!name) return;
        if (await savePlace({ name }, 'boundary')) showToast('Renamed.', 'success');
    });
    els.editor.addEventListener('change', async (event) => {
        if (event.target.id !== 'boundaryFile' || !event.target.files.length) return;
        const slot = els.editor.querySelector('[data-error-for="boundary"]');
        const { geometry, error } = readBoundaryFile(await event.target.files[0].text());
        slot.textContent = error || '';
        if (geometry && await savePlace({ boundary: geometry }, 'boundary')) showToast('Boundary saved.', 'success');
    });
    els.editor.addEventListener('click', async (event) => {
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (!state.editing || !action) return;
        const { kind, place } = state.editing;
        if (action === 'clear-boundary' && await savePlace({ boundary: null }, 'boundary')) showToast('Boundary cleared.', 'success');
        if (action === 'delete-place') {
            if (!window.confirm(`Delete ${place.name}? This can't be undone.`)) return;
            const res = await apiDelete(placeUrl(kind, place.id));
            if (!res.ok) {
                els.editor.querySelector('[data-error-for="delete"]').textContent = firstError(res.data, 'Could not delete.');
                return;
            }
            showToast(`${place.name} deleted.`, 'success');
            state.editing = null;
            if (previewMap) previewMap.remove();
            previewMap = null;
            els.editor.innerHTML = '<p class="text-secondary mb-0">Choose a district or thana to rename it, set its boundary or delete it.</p>';
            if (kind === 'district') state.open.delete(place.id);
            await refreshLists(districtIdOf(kind, place));
        }
    });
}

function bindList() {
    els.search.addEventListener('input', renderDistricts);
    els.list.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-action="toggle-thanas"]');
        if (toggle) {
            const id = Number(toggle.closest('[data-district-id]').dataset.districtId);
            if (state.open.has(id)) state.open.delete(id);
            else {
                state.open.add(id);
                loadThanas(id);
            }
            renderDistricts();
            return;
        }
        const edit = event.target.closest('[data-action="edit-place"]');
        if (edit) openEditor(edit.dataset.kind, Number(edit.dataset.id));
    });
    els.list.addEventListener('submit', async (event) => {
        if (event.target.dataset.form !== 'add-thana') return;
        event.preventDefault();
        const district = Number(event.target.dataset.districtId);
        const name = event.target.elements.name.value.trim();
        if (!name) return;
        const res = await apiPost(API.manageThanas, { name, district });
        if (!res.ok) {
            els.list.querySelector(`[data-error-for="thana-${district}"]`).textContent = firstError(res.data, 'Could not add the thana.');
            return;
        }
        showToast(`${res.data.name} added.`, 'success');
        await refreshLists(district);
    });
    els.addDistrict.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.target;
        const slot = form.querySelector('[data-error-for="district"]');
        const name = form.elements.name.value.trim();
        const division = Number(form.elements.division.value);
        slot.textContent = !name ? 'Enter a name.' : (!division ? 'Choose a division.' : '');
        if (slot.textContent) return;
        const res = await apiPost(API.manageDistricts, { name, division });
        if (!res.ok) {
            slot.textContent = firstError(res.data, 'Could not add the district.');
            return;
        }
        form.reset();
        showToast(`${res.data.name} added.`, 'success');
        await loadDistricts();
    });
}

async function init() {
    if (!requireLogin()) return;
    initNavbar();
    Object.assign(els, {
        body: document.querySelector('[data-page-body]'),
        list: document.getElementById('districtList'),
        empty: document.getElementById('districtEmpty'),
        search: document.getElementById('placeSearch'),
        editor: document.getElementById('placeEditor'),
        addDistrict: document.getElementById('addDistrictForm'),
    });
    const divisions = await apiGet(API.manageDivisions);
    if (divisions.status === 403) {
        els.body.innerHTML = `<div class="col-12">${operatorsOnlyHtml('locations')}</div>`;
        return;
    }
    state.divisions = divisions.ok ? divisions.data : [];
    document.getElementById('newDistrictDivision').innerHTML = divisionOptions(state.divisions, '');
    bindList();
    bindEditor();
    await loadDistricts();
}

init();
