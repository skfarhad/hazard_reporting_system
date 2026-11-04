// HTML builders for the Incidents page (no DOM access); all text is escaped.
import { escapeHtml, formatDateTime } from './utils.js';
import { incidentNeeds, primaryNeed, safeIcon, safeColour } from './map.js';
import { pageRange } from './incident-query.js';
import { statusBadge } from './tables.js';

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
        <td>${statusBadge(incident.validation_status)}</td>
        <td class="text-nowrap small text-secondary"><time datetime="${escapeHtml(incident.created_at)}">${escapeHtml(formatDateTime(incident.created_at))}</time></td>
    </tr>`;
}

export function incidentCard(incident, needTypes) {
    const id = Number(incident.id);
    return `<button type="button" class="hrs-incident-card" data-incident-id="${id}" aria-label="Open incident ${id}">
        <span class="hrs-incident-card-top">${needIcons(incident, needTypes)}${urgencyBadge(incident)}
            <span class="ms-auto">${statusBadge(incident.validation_status)}</span></span>
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
