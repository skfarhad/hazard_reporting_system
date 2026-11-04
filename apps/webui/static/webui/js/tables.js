// Filtering, summaries and table rows for incidents and volunteers (no DOM access).
import { escapeHtml, formatDateTime } from './utils.js';

const STATUSES = ['pending', 'validated', 'rejected'];

function matches(query, values) {
    const q = query.trim().toLowerCase();
    return !q || values.some((v) => String(v ?? '').toLowerCase().includes(q));
}

export function filterIncidents(incidents, { query = '', status = '' } = {}) {
    return incidents.filter((i) => (!status || i.validation_status === status)
        && matches(query, [i.description, i.address, i.contact_number]));
}

export function filterVolunteers(volunteers, { query = '' } = {}) {
    return volunteers.filter((v) => matches(query, [v.full_name, v.address, v.assistance_type]));
}

export function summarize(incidents, volunteers) {
    const count = (status) => incidents.filter((i) => i.validation_status === status).length;
    return {
        total: incidents.length,
        pending: count('pending'),
        validated: count('validated'),
        volunteers: volunteers.length,
    };
}

export function statusBadge(status) {
    const css = STATUSES.includes(status) ? `hrs-badge-${status}` : '';
    const dot = STATUSES.includes(status) ? `<span class="hrs-dot hrs-dot-${status}"></span>` : '';
    return `<span class="hrs-badge ${css}">${dot}${escapeHtml(status)}</span>`;
}

export function incidentRow(i) {
    return `<tr>
        <td class="text-nowrap small">${escapeHtml(formatDateTime(i.created_at))}</td>
        <td>${escapeHtml(i.description)}</td>
        <td>${escapeHtml(i.address)}</td>
        <td class="text-nowrap"><a href="tel:${escapeHtml(i.contact_number)}">${escapeHtml(i.contact_number)}</a></td>
        <td>${statusBadge(i.validation_status)}</td>
        <td class="small">${escapeHtml(i.task_status)}</td>
    </tr>`;
}

export function volunteerRow(v) {
    const hasLocation = v.latitude != null && v.longitude != null;
    const location = hasLocation ? `${Number(v.latitude).toFixed(4)}, ${Number(v.longitude).toFixed(4)}` : '–';
    return `<tr>
        <td>${escapeHtml(v.full_name)}</td>
        <td>${escapeHtml(v.assistance_type)}</td>
        <td>${escapeHtml(v.address)}</td>
        <td class="small text-secondary">${escapeHtml(location)}</td>
    </tr>`;
}
