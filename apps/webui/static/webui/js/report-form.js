// Report-an-incident form: HTML, reading it into a request body, and client-side checks.
// The server checks the same rules (apps/incident_manager/services/places.py); these give faster feedback.
import { escapeHtml } from './utils.js';
import { safeIcon, safeColour } from './map.js';

const BD_LATITUDE = [20.3, 26.8];
const BD_LONGITUDE = [87.9, 92.8];
const BD_MOBILE = /^(?:\+?88)?(01[3-9]\d{8})$/;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_ADDRESS_LENGTH = 255;

export function normalisePhone(text) {
    const match = BD_MOBILE.exec(String(text || '').replace(/[\s\-()]/g, ''));
    return match ? match[1] : null;
}

export function insideBangladesh(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng)
        && lat >= BD_LATITUDE[0] && lat <= BD_LATITUDE[1] && lng >= BD_LONGITUDE[0] && lng <= BD_LONGITUDE[1];
}

function option(value, label, selected) {
    const v = String(value);
    return `<option value="${escapeHtml(v)}"${v === String(selected ?? '') ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}

export function districtOptions(places, selected) {
    return option('', 'Not sure', selected) + places.map((d) => option(d.id, d.name, selected)).join('');
}

export function thanaOptions(places, districtId, selected) {
    const district = places.find((d) => String(d.id) === String(districtId));
    return option('', district ? 'Not sure' : 'Pick a district first', selected)
        + (district ? district.thanas.map((t) => option(t.id, t.name, selected)).join('') : '');
}

function errorSlot(name) {
    return `<div class="invalid-feedback d-block" id="reportForm-${name}-error" data-error-for="${name}"></div>`;
}

export function reportFormHtml(needTypes, places, { phone = '' } = {}) {
    const needs = needTypes.map((t) => {
        const id = `reportForm-need-${escapeHtml(t.code)}`;
        return `<input type="checkbox" class="btn-check" name="needs" value="${escapeHtml(t.code)}" id="${id}">`
            + `<label class="hrs-chip" for="${id}"><i class="bi bi-${safeIcon(t.icon)}" style="color:${safeColour(t.colour)}" aria-hidden="true"></i>${escapeHtml(t.label_en)}</label>`;
    }).join('');

    return `<form id="reportForm" novalidate>
        <div class="alert alert-danger py-2 small mb-3" data-error-for="form" role="alert" hidden></div>
        <div class="mb-3">
            <label class="form-label fw-semibold" for="reportForm-description">What's happening? *</label>
            <textarea class="form-control" id="reportForm-description" name="description" rows="3" maxlength="${MAX_MESSAGE_LENGTH}"
                placeholder="Who needs help, how many people, what is the danger?" required></textarea>
            ${errorSlot('description')}
        </div>
        <fieldset class="mb-3">
            <legend class="form-label fw-semibold mb-1 fs-6">Needs <span class="text-secondary fw-normal small">(optional)</span></legend>
            <div class="d-flex flex-wrap gap-2">${needs}</div>
            ${errorSlot('needs')}
        </fieldset>
        <div class="row g-3 mb-3 align-items-end">
            <div class="col-sm-6">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" id="reportForm-life" name="life_threatening">
                    <label class="form-check-label" for="reportForm-life">Someone's life is in danger</label>
                </div>
            </div>
            <div class="col-sm-6">
                <label class="form-label small fw-semibold" for="reportForm-people">People affected</label>
                <input class="form-control form-control-sm" type="number" min="0" step="1" inputmode="numeric" id="reportForm-people" name="people_count">
                ${errorSlot('people_count')}
            </div>
            <div class="col-sm-6">
                <label class="form-label small fw-semibold" for="reportForm-contact">Contact number *</label>
                <input class="form-control form-control-sm" type="tel" inputmode="tel" autocomplete="tel" id="reportForm-contact" name="contact_number"
                    value="${escapeHtml(phone)}" placeholder="01XXXXXXXXX" aria-describedby="reportForm-contact-help" required>
                <div class="form-text" id="reportForm-contact-help">The number responders will call.</div>
                ${errorSlot('contact_number')}
            </div>
        </div>
        <div class="row g-3 mb-3">
            <div class="col-sm-6">
                <label class="form-label small fw-semibold" for="reportForm-district">District</label>
                <select class="form-select form-select-sm" id="reportForm-district" name="district">${districtOptions(places, '')}</select>
                ${errorSlot('district')}
            </div>
            <div class="col-sm-6">
                <label class="form-label small fw-semibold" for="reportForm-thana">Thana</label>
                <select class="form-select form-select-sm" id="reportForm-thana" name="thana">${thanaOptions(places, '', '')}</select>
                ${errorSlot('thana')}
            </div>
            <div class="col-12">
                <label class="form-label small fw-semibold" for="reportForm-address">Address or landmark *</label>
                <input class="form-control form-control-sm" id="reportForm-address" name="address" maxlength="${MAX_ADDRESS_LENGTH}"
                    placeholder="e.g. Govt. Primary School, Parshuram" required>
                ${errorSlot('address')}
            </div>
        </div>
        <div class="mb-2">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span class="form-label small fw-semibold mb-0">Location *</span>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-action="locate">
                    <i class="bi bi-crosshair" aria-hidden="true"></i> Use my location</button>
                <span class="small text-secondary ms-auto" data-location-text aria-live="polite">Tap the map to place the pin.</span>
            </div>
            <div class="hrs-report-map" data-report-map aria-label="Map: tap to place the incident's location"></div>
            <input type="hidden" name="latitude"><input type="hidden" name="longitude">
            ${errorSlot('latitude')}
        </div>
    </form>`;
}

// Stores the chosen point in the form and shows it as text (the map is not the only way to read it).
export function setLocation(form, { lat, lng }) {
    form.elements.latitude.value = String(lat);
    form.elements.longitude.value = String(lng);
    const text = form.querySelector('[data-location-text]');
    if (text) text.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function idOrNull(value) {
    return value ? Number(value) : null;
}

export function readReportForm(form) {
    const el = form.elements;
    const description = el.description.value.trim();
    const address = el.address.value.trim();
    const contact = normalisePhone(el.contact_number.value);
    const latitude = Number.parseFloat(el.latitude.value);
    const longitude = Number.parseFloat(el.longitude.value);
    const peopleText = el.people_count.value.trim();
    const people = peopleText === '' ? null : Number(peopleText);
    const needs = [...form.querySelectorAll('input[name="needs"]:checked')].map((i) => i.value);

    const errors = {};
    if (!description) errors.description = ['Describe what is happening.'];
    if (!address) errors.address = ['Give an address or a landmark.'];
    if (!contact) errors.contact_number = ['Enter a Bangladeshi mobile number, e.g. 01712345678.'];
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) errors.latitude = ['Tap the map or use your location.'];
    else if (!insideBangladesh(latitude, longitude)) errors.latitude = ['The location must be inside Bangladesh.'];
    if (people !== null && !(Number.isInteger(people) && people >= 0)) errors.people_count = ['Enter a whole number, 0 or more.'];

    const body = {
        description,
        address,
        contact_number: contact,
        latitude,
        longitude,
        life_threatening: el.life_threatening.checked,
        people_count: people,
        district: idOrNull(el.district.value),
        thana: idOrNull(el.thana.value),
    };
    if (needs.length) body.needs = needs;
    return { body, errors };
}
