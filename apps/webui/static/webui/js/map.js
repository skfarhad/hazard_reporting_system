// Leaflet map of incidents and volunteers. Leaflet is loaded from the CDN as the global `L`.
import { escapeHtml, formatDateTime } from './utils.js';
import { BANGLADESH_CENTER, BANGLADESH_ZOOM, STATUS_COLORS, VOLUNTEER_COLOR } from './constants.js';

export function hasCoordinates(item) {
    return Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude);
}

export function incidentMarkerColor(status) {
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
}

export function incidentPopup(i) {
    return `<strong>${escapeHtml(i.description)}</strong><br>`
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

// Draws both layers with a toggle, and zooms to the markers when there are any.
export function drawMarkers(L, map, incidents, volunteers) {
    const incidentLayer = L.layerGroup(incidents.filter(hasCoordinates).map((i) => L.circleMarker(
        [i.latitude, i.longitude],
        { radius: 8, color: incidentMarkerColor(i.validation_status), fillOpacity: 0.8 },
    ).bindPopup(incidentPopup(i))));
    const volunteerLayer = L.layerGroup(volunteers.filter(hasCoordinates).map((v) => L.circleMarker(
        [v.latitude, v.longitude],
        { radius: 6, color: VOLUNTEER_COLOR, fillOpacity: 0.8 },
    ).bindPopup(volunteerPopup(v))));

    incidentLayer.addTo(map);
    volunteerLayer.addTo(map);
    L.control.layers(null, { Incidents: incidentLayer, Volunteers: volunteerLayer }).addTo(map);

    const points = [...incidents, ...volunteers].filter(hasCoordinates).map((p) => [p.latitude, p.longitude]);
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 12 });
}
