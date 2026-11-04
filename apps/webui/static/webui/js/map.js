// Leaflet map of incidents and volunteers. Leaflet is loaded from the CDN as the global `L`.
import { escapeHtml, formatDateTime } from './utils.js';
import {
    BANGLADESH_CENTER, BANGLADESH_ZOOM, GENERIC_NEED, STATUS_COLORS, VOLUNTEER_COLOR, INACTIVE_VOLUNTEER_COLOR,
} from './constants.js';
import { cssVar } from './theme.js';

export function hasCoordinates(item) {
    return Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude);
}

// Need-type icons and colours are admin-editable and end up in HTML/CSS, so only plain values pass.
export function safeIcon(name) {
    return /^[a-z0-9-]+$/.test(name || '') ? name : GENERIC_NEED.icon;
}

export function safeColour(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : GENERIC_NEED.colour;
}

// The incident's need types in need-type order (the API sends them by sort_order); unknown codes are dropped.
export function incidentNeeds(incident, needTypes) {
    const codes = incident?.needs || [];
    return needTypes.filter((t) => codes.includes(t.code));
}

// The need that decides the pin's icon and colour.
export function primaryNeed(incident, needTypes) {
    return incidentNeeds(incident, needTypes)[0] || needTypes.find((t) => t.is_fallback) || GENERIC_NEED;
}

// Teardrop outline in a 32×42 box; the tip is at (16, 41).
const PIN_PATH = 'M16 1.5C7.99 1.5 1.5 7.85 1.5 15.75c0 10.2 12.7 23.3 13.8 24.4a1 1 0 0 0 1.4 0C17.8 39.05 30.5 25.95 30.5 15.75 30.5 7.85 24.01 1.5 16 1.5z';

// A teardrop pin: main-need icon on its colour, outline for validation status,
// "+N" for further needs and "!" when life-threatening.
export function incidentPinHtml(incident, needTypes) {
    const need = primaryNeed(incident, needTypes);
    const needs = incidentNeeds(incident, needTypes);
    const status = incident?.validation_status in STATUS_COLORS ? incident.validation_status : 'pending';
    const urgent = Boolean(incident?.life_threatening);

    const label = (needs.length ? needs : [need]).map((t) => t.label_en);
    if (urgent) label.push('life-threatening');
    label.push(status);

    const count = needs.length > 1 ? `<span class="hrs-pin-count">+${needs.length - 1}</span>` : '';
    const alert = urgent ? '<span class="hrs-pin-alert" aria-hidden="true">!</span>' : '';

    return `<span class="hrs-pin hrs-pin--${status}${urgent ? ' hrs-pin--urgent' : ''}" `
        + `style="--hrs-pin-fill:${safeColour(need.colour)}" role="img" aria-label="${escapeHtml(label.join(', '))}">`
        + `<svg class="hrs-pin-shape" viewBox="0 0 32 42" aria-hidden="true">`
        + `<path class="hrs-pin-ring" d="${PIN_PATH}"/><path class="hrs-pin-body" d="${PIN_PATH}"/></svg>`
        + `<i class="bi bi-${safeIcon(need.icon)} hrs-pin-icon" aria-hidden="true"></i>${count}${alert}</span>`;
}

export const PIN_WIDTH = 32;
export const PIN_HEIGHT = 42;

export function incidentIcon(L, incident, needTypes) {
    return L.divIcon({
        className: 'hrs-pin-wrap',
        html: incidentPinHtml(incident, needTypes),
        iconSize: [PIN_WIDTH, PIN_HEIGHT],
        iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT],
        popupAnchor: [0, -PIN_HEIGHT + 4],
    });
}

// The volunteer colour comes from the design token, so it follows the theme.
export function volunteerMarkerColor(volunteer = {}) {
    return volunteer.is_active === false
        ? cssVar('--hrs-volunteer-inactive', INACTIVE_VOLUNTEER_COLOR)
        : cssVar('--hrs-volunteer', VOLUNTEER_COLOR);
}

export function incidentPopup(i, needTypes = []) {
    const needs = incidentNeeds(i, needTypes).map((t) => escapeHtml(t.label_en)).join(', ');
    const triage = [
        i.life_threatening ? '<span class="text-danger fw-semibold">Life-threatening</span>' : '',
        Number.isFinite(i.people_count) ? `${i.people_count} people` : '',
    ].filter(Boolean).join(' · ');
    return `<strong>${escapeHtml(i.description)}</strong><br>`
        + (needs ? `${needs}<br>` : '')
        + (triage ? `${triage}<br>` : '')
        + `${escapeHtml(i.address)}<br>`
        + `<a href="tel:${escapeHtml(i.contact_number)}">${escapeHtml(i.contact_number)}</a><br>`
        + `<small>${escapeHtml(i.validation_status)} · ${escapeHtml(formatDateTime(i.created_at))}</small>`;
}

export function volunteerPopup(v) {
    return `<strong>${escapeHtml(v.full_name)}</strong><br>`
        + `${escapeHtml(v.assistance_type)}<br><small>${escapeHtml(v.address)}</small>`;
}

export function createMap(L, element) {
    const map = L.map(element).setView(BANGLADESH_CENTER, BANGLADESH_ZOOM);
    // OSM's tile policy requires a Referer; Django's default Referrer-Policy
    // (same-origin) would strip it, so send the site origin on tile requests.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        referrerPolicy: 'strict-origin-when-cross-origin',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    return map;
}

// Draws both layers with a toggle, and zooms to the markers when there are any (unless `fit` is false).
// `incidentPopup(i)`, `popupOptions` and `onIncidentClick(i)` let a page use its own popup and react to clicks.
// Returns the layers and the toggle (to `.remove()` before drawing fresh data) and the markers by id.
export function drawMarkers(L, map, incidents, volunteers, needTypes = [], options = {}) {
    const popup = options.incidentPopup || ((i) => incidentPopup(i, needTypes));
    const incidentMarkers = new Map();
    const volunteerMarkers = new Map();

    const incidentLayer = L.layerGroup(incidents.filter(hasCoordinates).map((i) => {
        const marker = L.marker(
            [i.latitude, i.longitude],
            { icon: incidentIcon(L, i, needTypes), riseOnHover: true, zIndexOffset: i.life_threatening ? 1000 : 0 },
        ).bindPopup(popup(i), options.popupOptions);
        if (options.onIncidentClick) marker.on('click', () => options.onIncidentClick(i));
        incidentMarkers.set(i.id, marker);
        return marker;
    }));
    const volunteerLayer = L.layerGroup(volunteers.filter(hasCoordinates).map((v) => {
        const marker = L.circleMarker(
            [v.latitude, v.longitude],
            { radius: 6, color: volunteerMarkerColor(v), fillOpacity: 0.8 },
        ).bindPopup(volunteerPopup(v));
        volunteerMarkers.set(v.id, marker);
        return marker;
    }));

    incidentLayer.addTo(map);
    volunteerLayer.addTo(map);
    const layerControl = L.control.layers(null, { Incidents: incidentLayer, Volunteers: volunteerLayer }).addTo(map);

    const points = [...incidents, ...volunteers].filter(hasCoordinates).map((p) => [p.latitude, p.longitude]);
    if (points.length && options.fit !== false) map.fitBounds(points, { padding: [30, 30], maxZoom: 12 });
    return { layers: [incidentLayer, volunteerLayer, layerControl], incidentMarkers, volunteerMarkers };
}
