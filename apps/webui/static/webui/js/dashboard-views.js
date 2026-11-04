// HTML for the live dashboard: incident and volunteer cards, the map popup card, count cards, avatars and
// area dropdowns. Everything from reports or volunteers is escaped.
import { escapeHtml } from './utils.js';

// Operators work in Bangladesh: show times there, whatever the browser's time zone.
const DHAKA = 'Asia/Dhaka';
const DAY_FORMAT = new Intl.DateTimeFormat('en-GB', { timeZone: DHAKA, day: 'numeric', month: 'long' });
const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', { timeZone: DHAKA, hour: '2-digit', minute: '2-digit', hour12: true });

function ordinal(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;
}

function part(parts, type) {
    return parts.find((p) => p.type === type)?.value || '';
}

export function cardDateParts(iso) {
    const date = new Date(iso);
    if (!iso || Number.isNaN(date.getTime())) return { day: '', time: '' };
    const day = DAY_FORMAT.formatToParts(date);
    const time = TIME_FORMAT.formatToParts(date);
    return {
        day: `${ordinal(Number(part(day, 'day')))} ${part(day, 'month')}`,
        time: `${part(time, 'hour')}:${part(time, 'minute')}${part(time, 'dayPeriod').toLowerCase()}`,
    };
}

export function incidentTitle(incident) {
    const place = [incident.district, incident.thana].filter(Boolean).join('-');
    if (place) return `${place} Incident`;
    return incident.address || `Incident #${incident.id}`;
}

export function volunteerCountText(count) {
    const n = Number(count) || 0;
    if (!n) return 'No volunteers';
    return n === 1 ? '1 volunteer' : `${n} volunteers`;
}

// A closed task is Resolved, whatever its review status.
function statusOf(incident) {
    if (incident.task_status === 'closed') return { key: 'resolved', label: 'Resolved' };
    const key = ['pending', 'validated', 'rejected'].includes(incident.validation_status) ? incident.validation_status : 'pending';
    return { key, label: key[0].toUpperCase() + key.slice(1) };
}

function statusBadge(incident) {
    const { key, label } = statusOf(incident);
    return `<span class="hrs-dash-status hrs-dash-status--${key}">${label}</span>`;
}

function dateLine(incident) {
    const { day, time } = cardDateParts(incident.created_at);
    return `<div class="hrs-dash-meta">${escapeHtml(day)}<span aria-hidden="true"> • </span><span class="visually-hidden">, </span>${escapeHtml(time)}</div>`;
}

function placeLine(district, thana) {
    const bits = [
        district ? `<span><span class="hrs-dash-label">District:</span> ${escapeHtml(district)}</span>` : '',
        thana ? `<span><span class="hrs-dash-label">Thana:</span> ${escapeHtml(thana)}</span>` : '',
    ].filter(Boolean);
    return bits.length ? `<div class="hrs-dash-place">${bits.join('<span aria-hidden="true"> • </span>')}</div>` : '';
}

function volunteerBadge(incident) {
    return `<span class="hrs-vol-badge">${escapeHtml(volunteerCountText(incident.volunteer_count))}</span>`;
}

function detailsButton(incident) {
    return `<button type="button" class="btn btn-link btn-sm hrs-dash-details" data-action="incident-details" `
        + `data-incident-id="${escapeHtml(incident.id)}">View details</button>`;
}

export function dashIncidentCard(incident, { selected = false } = {}) {
    const id = escapeHtml(incident.id);
    return `<li class="hrs-dash-item${selected ? ' is-selected' : ''}" data-incident-id="${id}">
        <button type="button" class="hrs-dash-card" data-action="select-incident" aria-pressed="${selected}">
            <span class="hrs-dash-head">
                <span class="hrs-dash-title">${escapeHtml(incidentTitle(incident))}</span>
                ${statusBadge(incident)}
            </span>
            ${dateLine(incident)}
            ${placeLine(incident.district, incident.thana)}
            <span class="hrs-dash-message">${escapeHtml(incident.description)}</span>
        </button>
        <div class="hrs-dash-foot">${volunteerBadge(incident)}${detailsButton(incident)}</div>
    </li>`;
}

export function incidentPopupCard(incident) {
    return `<div class="hrs-popup-card">
        <div class="hrs-dash-title">${escapeHtml(incidentTitle(incident))}</div>
        ${dateLine(incident)}
        ${placeLine(incident.district, incident.thana)}
        <div class="hrs-dash-message">${escapeHtml(incident.description)}</div>
        <div class="hrs-dash-foot">${volunteerBadge(incident)}${detailsButton(incident)}</div>
    </div>`;
}

// Count cards that also filter: `group` names the data attribute (status or vstatus) the page reads.
export function statCardsHtml(cards, active, group) {
    return cards.map((card) => {
        const pressed = card.key === active;
        const count = Number.isFinite(card.count) ? card.count : '–';
        return `<button type="button" class="hrs-stat-card hrs-stat-card--${escapeHtml(card.key)}" `
            + `data-${group}="${escapeHtml(card.key)}" aria-pressed="${pressed}">`
            + `<span class="hrs-stat-label">${escapeHtml(card.label)}</span> <span class="hrs-stat-count">${count}</span></button>`;
    }).join('');
}

export function initials(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    return words.length ? words.slice(0, 2).map((w) => w[0].toUpperCase()).join('') : '?';
}

// Only http(s) URLs or same-site paths are shown as images.
function safePhoto(url) {
    return /^(https?:\/\/|\/)[^\s"'<>]*$/.test(url || '') ? url : null;
}

export function avatarHtml({ name, photo, active }) {
    const src = safePhoto(photo);
    const face = src
        ? `<img src="${escapeHtml(src)}" alt="" loading="lazy">`
        : `<span class="hrs-avatar-initials" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
    return `<span class="hrs-avatar">${face}`
        + `<span class="hrs-avatar-dot hrs-avatar-dot--${active ? 'on' : 'off'}"></span>`
        + `<span class="visually-hidden">${active ? 'Active' : 'Inactive'}</span></span>`;
}

function distanceText(km) {
    return Number.isFinite(km) ? `<span class="hrs-vol-distance">${km.toFixed(1)} km</span>` : '';
}

export function volunteerCard(volunteer, { selectedIncident = null, assigned = false } = {}) {
    const phone = escapeHtml(volunteer.contact_number);
    const action = selectedIncident
        ? `<button type="button" class="btn btn-sm ${assigned ? 'btn-outline-secondary' : 'btn-primary'}" `
          + `data-action="${assigned ? 'unassign' : 'assign'}">${assigned ? 'Unassign' : 'Assign'}</button>`
        : '';
    return `<li class="hrs-vol-card${assigned ? ' is-assigned' : ''}" data-volunteer-id="${escapeHtml(volunteer.id)}">
        <div class="hrs-vol-body">
            <div class="hrs-dash-title">${escapeHtml(volunteer.full_name)}</div>
            <a class="hrs-dash-meta" href="tel:${phone}">${phone}</a>
            ${placeLine(volunteer.district?.name, volunteer.thana?.name)}
            <div class="hrs-vol-actions">${distanceText(volunteer.distance_km)}${action}</div>
        </div>
        ${avatarHtml({ name: volunteer.full_name, photo: volunteer.photo, active: volunteer.is_active })}
    </li>`;
}

function option(value, label, selected) {
    const v = String(value);
    return `<option value="${escapeHtml(v)}"${v === String(selected ?? '') ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}

export function zillaOptions(places, selected) {
    return option('', 'All Zilla', selected) + places.map((d) => option(d.id, d.name, selected)).join('');
}

export function upazilaOptions(places, districtId, selected) {
    const district = places.find((d) => String(d.id) === String(districtId));
    return option('', 'All Upazilla', selected) + (district ? district.thanas.map((t) => option(t.id, t.name, selected)).join('') : '');
}
