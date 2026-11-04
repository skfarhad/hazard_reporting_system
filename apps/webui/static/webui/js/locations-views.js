// Location tab: district and thana rows, the place editor, and reading GeoJSON boundary files.
// The server checks boundaries again (valid shape, inside Bangladesh); this gives quick feedback.
import { escapeHtml } from './utils.js';

const AREA_TYPES = ['Polygon', 'MultiPolygon'];
const AREA_HELP = 'The file must hold a Polygon or MultiPolygon.';

function areaOf(geometry) {
    if (!geometry || !AREA_TYPES.includes(geometry.type)) return { error: AREA_HELP };
    if (!Array.isArray(geometry.coordinates)) return { error: 'The shape has no coordinates.' };
    return { geometry };
}

// GeoJSON text -> { geometry } or { error }. Takes a bare geometry, a Feature, or a FeatureCollection
// with exactly one feature.
export function readBoundaryFile(text) {
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        return { error: 'This file is not valid GeoJSON.' };
    }
    if (!data || typeof data !== 'object') return { error: 'This file is not valid GeoJSON.' };
    if (data.type === 'FeatureCollection') {
        const features = Array.isArray(data.features) ? data.features : [];
        if (features.length !== 1) return { error: `The file must hold one area, but it has ${features.length}.` };
        return areaOf(features[0]?.geometry);
    }
    if (data.type === 'Feature') return areaOf(data.geometry);
    return areaOf(data);
}

function count(n, word) {
    const value = Number(n) || 0;
    return `${value} ${word}${value === 1 ? '' : 's'}`;
}

function boundaryBadge(hasBoundary) {
    return hasBoundary
        ? '<span class="hrs-badge hrs-badge-volunteer"><i class="bi bi-bounding-box" aria-hidden="true"></i> Boundary set</span>'
        : '<span class="hrs-badge">No boundary</span>';
}

function editButton(place, kind) {
    return `<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit-place" data-kind="${kind}" `
        + `data-id="${escapeHtml(place.id)}">Edit<span class="visually-hidden"> ${escapeHtml(place.name)}</span></button>`;
}

export function districtRowHtml(district, { open = false, selected = false } = {}) {
    return `<li class="hrs-place${selected ? ' is-selected' : ''}" data-district-id="${escapeHtml(district.id)}">
        <div class="hrs-place-row">
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-action="toggle-thanas" aria-expanded="${open}"
                aria-label="Thanas of ${escapeHtml(district.name)}"><i class="bi bi-chevron-${open ? 'down' : 'right'}" aria-hidden="true"></i></button>
            <div class="hrs-place-text">
                <div class="fw-semibold">${escapeHtml(district.name)} <span class="small text-secondary fw-normal">${escapeHtml(district.division?.name || '')}</span></div>
                <div class="small text-secondary">${count(district.thana_count, 'thana')} · ${count(district.incident_count, 'incident')} · ${count(district.volunteer_count, 'volunteer')}</div>
            </div>
            ${boundaryBadge(district.has_boundary)}
            ${editButton(district, 'district')}
        </div>
        <ul class="hrs-place-thanas" data-thanas-of="${escapeHtml(district.id)}"${open ? '' : ' hidden'}></ul>
    </li>`;
}

export function thanaRowHtml(thana, { selected = false } = {}) {
    return `<li class="hrs-place-row hrs-place-row--thana${selected ? ' is-selected' : ''}" data-thana-id="${escapeHtml(thana.id)}">
        <div class="hrs-place-text">
            <div>${escapeHtml(thana.name)}</div>
            <div class="small text-secondary">${count(thana.incident_count, 'incident')} · ${count(thana.volunteer_count, 'volunteer')}</div>
        </div>
        ${boundaryBadge(thana.has_boundary)}
        ${editButton(thana, 'thana')}
    </li>`;
}

export function divisionOptions(divisions, selected) {
    const option = (value, label) => `<option value="${escapeHtml(value)}"${String(value) === String(selected ?? '') ? ' selected' : ''}>${escapeHtml(label)}</option>`;
    return option('', 'Choose a division') + divisions.map((d) => option(d.id, d.name)).join('');
}

// The editor for one place: rename, boundary (upload a GeoJSON file, or clear), map preview, delete.
export function placeEditorHtml(place, kind) {
    const word = kind === 'district' ? 'district' : 'thana';
    return `<h2 class="h5 mb-3">${escapeHtml(place.name)} <span class="small text-secondary fw-normal">${word}</span></h2>
    <form data-form="rename" class="d-flex gap-2 mb-3" novalidate>
        <label class="visually-hidden" for="placeName">Name</label>
        <input class="form-control form-control-sm" id="placeName" name="name" value="${escapeHtml(place.name)}" maxlength="100" required>
        <button type="submit" class="btn btn-sm btn-primary">Rename</button>
    </form>
    <div class="mb-2 d-flex flex-wrap align-items-center gap-2">
        <label class="btn btn-sm btn-outline-secondary mb-0" for="boundaryFile"><i class="bi bi-upload" aria-hidden="true"></i> Upload boundary</label>
        <input type="file" id="boundaryFile" class="visually-hidden" accept=".geojson,.json,application/geo+json,application/json">
        <button type="button" class="btn btn-sm btn-ghost" data-action="clear-boundary"${place.boundary ? '' : ' disabled'}>Clear boundary</button>
        <span class="small text-secondary">GeoJSON Polygon or MultiPolygon</span>
    </div>
    <div class="small text-danger mb-2" data-error-for="boundary" role="alert"></div>
    <div class="hrs-place-map mb-3" data-place-map aria-label="Boundary preview"></div>
    <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-place">Delete ${word}</button>
    <div class="small text-danger mt-2" data-error-for="delete" role="alert"></div>`;
}
