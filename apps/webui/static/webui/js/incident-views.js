// HTML builders for the Incidents page; all text is escaped. formToPatch and showFieldErrors read or
// update a rendered edit form; everything else only returns HTML.
import { escapeHtml, formatDateTime } from './utils.js';
import { incidentNeeds, primaryNeed, safeIcon, safeColour } from './map.js';
import { pageRange } from './incident-query.js';
import { statusBadge } from './tables.js';
import { TASK_STATUSES } from './constants.js';

function needIcon(need) {
    return `<span class="hrs-need-icon" style="--hrs-pin-fill:${safeColour(need.colour)}" title="${escapeHtml(need.label_en)}">`
        + `<i class="bi bi-${safeIcon(need.icon)}" aria-hidden="true"></i>`
        + `<span class="visually-hidden">${escapeHtml(need.label_en)}</span></span>`;
}

// The incident's needs in need-type order; the fallback need when it has none we know.
export function needIcons(incident, needTypes) {
    const needs = incidentNeeds(incident, needTypes);
    return `<span class="hrs-need-icons">${(needs.length ? needs : [primaryNeed(incident, needTypes)]).map(needIcon).join('')}</span>`;
}

export function hazardLabel(event) {
    if (!event) return '<span class="text-secondary">No event</span>';
    const hazard = event.hazard;
    const icon = hazard
        ? `<i class="bi bi-${safeIcon(hazard.icon)} me-1" style="color:${safeColour(hazard.colour)}" aria-hidden="true"></i>`
        : '';
    const hazardText = hazard ? ` <span class="text-secondary">· ${escapeHtml(hazard.label_en)}</span>` : '';
    return `<span class="hrs-hazard">${icon}${escapeHtml(event.name)}${hazardText}</span>`;
}

// Reports sent from the web app (rather than by an SMS provider) are marked for reviewers.
export function sourceBadge(incident) {
    return incident.source === 'web' ? ' <span class="hrs-badge hrs-badge-web" title="Reported from the web app">Web</span>' : '';
}

export function urgencyBadge(incident) {
    const parts = [];
    if (incident.life_threatening) {
        parts.push('<span class="hrs-badge hrs-badge-urgent"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>Life-threatening</span>');
    }
    if (Number.isFinite(incident.people_count)) {
        const n = incident.people_count;
        parts.push(`<span class="small text-secondary text-nowrap">${n} ${n === 1 ? 'person' : 'people'}</span>`);
    }
    return parts.join(' ');
}

export function locationText(incident) {
    const places = [incident.thana, incident.district].filter(Boolean);
    return places.length ? places.join(', ') : (incident.address || '');
}

export function incidentTableRow(incident, needTypes) {
    const id = Number(incident.id);
    return `<tr class="hrs-row-link" tabindex="0" data-incident-id="${id}" aria-label="Open incident ${id}">
        <td class="hrs-cell-needs">${needIcons(incident, needTypes)}<div class="mt-1">${urgencyBadge(incident)}</div></td>
        <td class="hrs-cell-message"><div class="hrs-truncate-2">${escapeHtml(incident.description)}</div>
            <div class="small text-secondary">${escapeHtml(locationText(incident))}</div></td>
        <td class="small">${hazardLabel(incident.event)}</td>
        <td class="text-nowrap">${statusBadge(incident.validation_status)}${sourceBadge(incident)}</td>
        <td class="text-nowrap small text-secondary"><time datetime="${escapeHtml(incident.created_at)}">${escapeHtml(formatDateTime(incident.created_at))}</time></td>
    </tr>`;
}

export function incidentCard(incident, needTypes) {
    const id = Number(incident.id);
    return `<button type="button" class="hrs-incident-card" data-incident-id="${id}" aria-label="Open incident ${id}">
        <span class="hrs-incident-card-top">${needIcons(incident, needTypes)}${urgencyBadge(incident)}
            <span class="ms-auto text-nowrap">${statusBadge(incident.validation_status)}${sourceBadge(incident)}</span></span>
        <span class="hrs-truncate-2 hrs-incident-card-message">${escapeHtml(incident.description)}</span>
        <span class="small text-secondary">${escapeHtml(locationText(incident))}</span>
        <span class="hrs-incident-card-bottom small">${hazardLabel(incident.event)}
            <time class="ms-auto text-secondary text-nowrap" datetime="${escapeHtml(incident.created_at)}">${escapeHtml(formatDateTime(incident.created_at))}</time></span>
    </button>`;
}

export function needChips(needTypes, selected) {
    return needTypes.map((t) => `<button type="button" class="hrs-chip" data-need="${escapeHtml(t.code)}" aria-pressed="${selected.includes(t.code)}">`
        + `<i class="bi bi-${safeIcon(t.icon)}" style="color:${safeColour(t.colour)}" aria-hidden="true"></i>${escapeHtml(t.label_en)}</button>`).join('');
}

function option(value, label, selected) {
    return `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}

// Events as listed (newest first from the API), then each hazard that has an event, by label.
export function eventHazardOptions(events, selected) {
    const hazards = new Map();
    events.forEach((e) => { if (e.hazard) hazards.set(e.hazard.code, e.hazard); });
    const hazardList = [...hazards.values()].sort((a, b) => a.label_en.localeCompare(b.label_en));
    return option('', 'All events', selected)
        + option('event:none', 'No event', selected)
        + (events.length ? `<optgroup label="Events">${events.map((e) => option(`event:${Number(e.id)}`, e.name, selected)).join('')}</optgroup>` : '')
        + (hazardList.length ? `<optgroup label="Hazards">${hazardList.map((h) => option(`hazard:${h.code}`, `All ${h.label_en.toLowerCase()} events`, selected)).join('')}</optgroup>` : '');
}

export function pagerHtml(page, pages) {
    if (pages <= 1) return '';
    const items = pageRange(page, pages).map((p) => (p === '…'
        ? '<li class="page-item disabled"><span class="page-link">…</span></li>'
        : `<li class="page-item${p === page ? ' active' : ''}"><button type="button" class="page-link" data-page="${p}"${p === page ? ' aria-current="page"' : ''}>${p}</button></li>`));
    return `<nav aria-label="Incident pages"><ul class="pagination pagination-sm mb-0">
        <li class="page-item${page <= 1 ? ' disabled' : ''}"><button type="button" class="page-link" data-page="prev"${page <= 1 ? ' disabled' : ''}>‹ Prev</button></li>
        ${items.join('')}
        <li class="page-item${page >= pages ? ' disabled' : ''}"><button type="button" class="page-link" data-page="next"${page >= pages ? ' disabled' : ''}>Next ›</button></li>
    </ul></nav>`;
}

function field(label, valueHtml) {
    return `<div class="hrs-field"><dt>${escapeHtml(label)}</dt><dd>${valueHtml}</dd></div>`;
}

function timeHtml(iso) {
    return iso ? `<time datetime="${escapeHtml(iso)}">${escapeHtml(formatDateTime(iso))}</time>` : '–';
}

function sourceText(incident) {
    if (incident.source === 'web') {
        return incident.reported_by ? `Web · reported by ${escapeHtml(incident.reported_by.name)}` : 'Web';
    }
    return incident.provider ? `SMS · ${escapeHtml(incident.provider)}` : '–';
}

// Read-only details for the pop-up. The incident is the detail API shape.
export function incidentDetailsHtml(incident, needTypes) {
    const hasPlace = Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude);
    const coordinates = hasPlace
        ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)} · `
          + `<a href="https://www.google.com/maps?q=${incident.latitude},${incident.longitude}" target="_blank" rel="noopener">Open in Google Maps</a>`
        : '<span class="text-secondary">No location</span>';
    const needs = incidentNeeds(incident, needTypes);
    const needList = (needs.length ? needs : [primaryNeed(incident, needTypes)])
        .map((t) => `<span class="d-inline-flex align-items-center gap-1 me-2">${needIcon(t)}${escapeHtml(t.label_en)}</span>`).join('');
    // Reported addresses often already end with the thana or district; don't say it twice.
    const address = incident.address || '';
    const extra = [incident.thana, incident.district].filter((name) => name && !address.toLowerCase().includes(name.toLowerCase()));
    const place = [address, ...extra].filter(Boolean).map(escapeHtml).join(', ');
    const contact = escapeHtml(incident.contact_number);

    return `<p class="hrs-detail-message">${escapeHtml(incident.description)}</p>
    <dl class="hrs-detail-fields">
        ${field('Needs', needList)}
        ${field('Urgency', urgencyBadge(incident) || '<span class="text-secondary">Not marked</span>')}
        ${field('Event', hazardLabel(incident.event))}
        ${field('Place', place || '–')}
        ${field('Coordinates', coordinates)}
        ${field('Contact', `<a href="tel:${contact}">${contact}</a>`)}
        ${field('Status', `${statusBadge(incident.validation_status)} <span class="small text-secondary ms-1">Task: ${escapeHtml(incident.task_status)}</span>`)}
        ${field('Volunteers', (incident.volunteers || []).length
        ? incident.volunteers.map((v) => escapeHtml(v.full_name)).join(', ')
        : '<span class="text-secondary">Not assigned</span>')}
        ${field('Source', sourceText(incident))}
        ${field('Reported', timeHtml(incident.created_at))}
        ${field('Updated', timeHtml(incident.updated_at))}
    </dl>`;
}

const STATUS_ACTIONS = [
    ['validated', 'Validate', 'btn-success', 'check-lg'],
    ['pending', 'Back to pending', 'btn-outline-secondary', 'arrow-counterclockwise'],
    ['rejected', 'Reject', 'btn-outline-danger', 'x-lg'],
];

export function statusActionsHtml(incident) {
    const buttons = STATUS_ACTIONS.filter(([status]) => status !== incident.validation_status)
        .map(([status, label, css, icon]) => `<button type="button" class="btn btn-sm ${css}" data-status="${status}">`
            + `<i class="bi bi-${icon}" aria-hidden="true"></i> ${label}</button>`);
    return `<div class="d-flex flex-wrap align-items-center gap-2"><span class="me-auto">${statusBadge(incident.validation_status)}</span>${buttons.join('')}</div>`;
}

// Events an operator can attach: the ones running now, plus whatever the incident already has.
export function editableEvents(events, currentId, now = new Date()) {
    return events.filter((e) => e.id === currentId
        || (new Date(e.started_at) <= now && (!e.ended_at || new Date(e.ended_at) > now)));
}

function errorSlot(name) {
    return `<div class="invalid-feedback d-block" id="incidentEdit-${name}-error" data-error-for="${name}"></div>`;
}

// Assigned volunteers stay in the list even when the loaded list doesn't include them.
function volunteerChoices(incident, volunteers) {
    const assigned = incident.volunteers || [];
    const listed = new Set(volunteers.map((v) => v.id));
    const chosen = new Set(assigned.map((v) => v.id));
    return [...volunteers, ...assigned.filter((v) => !listed.has(v.id))].map((v) => {
        const id = `incidentEdit-volunteer-${Number(v.id)}`;
        const search = `${v.full_name || ''} ${v.contact_number || ''}`.toLowerCase();
        const inactive = v.is_active === false ? ' (inactive)' : '';
        return `<div class="form-check" data-volunteer-choice="${Number(v.id)}" data-search="${escapeHtml(search)}">
            <input class="form-check-input" type="checkbox" name="volunteers" value="${Number(v.id)}" id="${id}"${chosen.has(v.id) ? ' checked' : ''}>
            <label class="form-check-label" for="${id}">${escapeHtml(v.full_name)}${inactive}
                <span class="small text-secondary">${escapeHtml(v.contact_number || '')}</span></label>
        </div>`;
    }).join('');
}

function volunteersFieldset(incident, volunteers) {
    if (!volunteers) return '';
    return `<fieldset class="mb-3">
            <legend class="form-label small fw-semibold mb-1">Volunteers</legend>
            <input type="search" class="form-control form-control-sm mb-2" data-volunteer-search
                placeholder="Search by name or phone" aria-label="Search volunteers">
            <div class="hrs-volunteer-choices">${volunteerChoices(incident, volunteers)}</div>
            ${errorSlot('volunteers')}
        </fieldset>`;
}

// Shows only the volunteer choices whose name or phone contains the text.
export function filterVolunteerChoices(form, text) {
    const query = String(text || '').trim().toLowerCase();
    form.querySelectorAll('[data-volunteer-choice]').forEach((choice) => {
        choice.hidden = Boolean(query) && !choice.dataset.search.includes(query);
    });
}

// `volunteers` (the operator volunteer list) adds the assignment checkboxes; without it the form leaves them alone.
export function editFormHtml(incident, needTypes, events, volunteers = null) {
    const chosen = new Set(incident.needs || []);
    const needs = needTypes.map((t) => {
        const id = `incidentEdit-need-${escapeHtml(t.code)}`;
        return `<input type="checkbox" class="btn-check" name="needs" value="${escapeHtml(t.code)}" id="${id}"${chosen.has(t.code) ? ' checked' : ''}>`
            + `<label class="hrs-chip" for="${id}"><i class="bi bi-${safeIcon(t.icon)}" style="color:${safeColour(t.colour)}" aria-hidden="true"></i>${escapeHtml(t.label_en)}</label>`;
    }).join('');
    const eventId = incident.event?.id ?? null;
    const eventOptions = option('', 'No event', eventId === null ? '' : String(eventId))
        + events.map((e) => option(String(e.id), e.name, String(eventId))).join('');
    const taskOptions = TASK_STATUSES.map((t) => option(t, t, incident.task_status)).join('');
    const people = Number.isFinite(incident.people_count) ? incident.people_count : '';

    return `<form id="incidentEditForm" class="hrs-edit-form" novalidate>
        <h3 class="h6 mb-2">Edit triage</h3>
        <div class="alert alert-danger py-2 small mb-2" data-error-for="form" role="alert" hidden></div>
        <fieldset class="mb-3" aria-describedby="incidentEdit-needs-error">
            <legend class="form-label small fw-semibold mb-1">Needs</legend>
            <div class="d-flex flex-wrap gap-2">${needs}</div>
            ${errorSlot('needs')}
        </fieldset>
        ${volunteersFieldset(incident, volunteers)}
        <div class="row g-3 align-items-end">
            <div class="col-sm-6">
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" id="incidentEdit-life" name="life_threatening"${incident.life_threatening ? ' checked' : ''}>
                    <label class="form-check-label" for="incidentEdit-life">Life-threatening</label>
                </div>
            </div>
            <div class="col-sm-6">
                <label class="form-label small fw-semibold" for="incidentEdit-people">People affected</label>
                <input class="form-control form-control-sm" type="number" min="0" step="1" inputmode="numeric" id="incidentEdit-people" name="people_count" value="${people}">
                ${errorSlot('people_count')}
            </div>
            <div class="col-sm-6">
                <label class="form-label small fw-semibold" for="incidentEdit-event">Event</label>
                <select class="form-select form-select-sm" id="incidentEdit-event" name="event">${eventOptions}</select>
                ${errorSlot('event')}
            </div>
            <div class="col-sm-6">
                <label class="form-label small fw-semibold" for="incidentEdit-task">Task status</label>
                <select class="form-select form-select-sm" id="incidentEdit-task" name="task_status">${taskOptions}</select>
                ${errorSlot('task_status')}
            </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-3">
            <button type="reset" class="btn btn-sm btn-ghost">Undo changes</button>
            <button type="submit" class="btn btn-sm btn-primary">Save</button>
        </div>
    </form>`;
}

// Reads the edit form into a PATCH body, checking what the server would reject anyway.
export function formToPatch(form) {
    const needs = [...form.querySelectorAll('input[name="needs"]:checked')].map((i) => i.value);
    const peopleText = form.elements.people_count.value.trim();
    const people = peopleText === '' ? null : Number(peopleText);
    const errors = {};
    if (!needs.length) errors.needs = ['Pick at least one need.'];
    if (people !== null && !(Number.isInteger(people) && people >= 0)) errors.people_count = ['Enter a whole number, 0 or more.'];
    const eventValue = form.elements.event.value;
    const body = {
        needs,
        life_threatening: form.elements.life_threatening.checked,
        people_count: people,
        event: eventValue ? Number(eventValue) : null,
        task_status: form.elements.task_status.value,
    };
    if (form.querySelector('input[name="volunteers"]')) {
        body.volunteers = [...form.querySelectorAll('input[name="volunteers"]:checked')].map((i) => Number(i.value));
    }
    return { body, errors };
}

// Shows DRF-style errors ({field: [messages]}, or {detail}) next to their fields; {} clears them.
export function showFieldErrors(form, errors) {
    const fieldNames = new Set();
    form.querySelectorAll('[data-error-for]').forEach((slot) => {
        const name = slot.dataset.errorFor;
        fieldNames.add(name);
        const messages = [].concat(errors[name] || []);
        slot.textContent = messages.join(' ');
        if (name === 'form') return;
        const input = form.elements[name];
        if (input && !(input instanceof RadioNodeList)) {
            input.classList.toggle('is-invalid', messages.length > 0);
            input.setAttribute('aria-describedby', slot.id);
        }
    });
    const other = Object.entries(errors).filter(([name]) => !fieldNames.has(name)).flatMap(([, m]) => [].concat(m));
    const top = form.querySelector('[data-error-for="form"]');
    top.textContent = other.join(' ');
    top.hidden = other.length === 0;
}
