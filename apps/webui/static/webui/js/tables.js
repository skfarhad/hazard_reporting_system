// Summaries, status badges and volunteer rows (no DOM access). Incident rows live in incident-views.js.
import { escapeHtml } from './utils.js';

const STATUSES = ['pending', 'validated', 'rejected'];

function matches(query, values) {
    const q = query.trim().toLowerCase();
    return !q || values.some((v) => String(v ?? '').toLowerCase().includes(q));
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

// Shown instead of data when the API answers 403: the account exists but isn't an operator.
export function operatorAccessNotice() {
    return `<div class="hrs-empty"><i class="bi bi-shield-lock"></i>
        <strong class="d-block mb-1">Your account isn't an operator yet.</strong>
        Ask an administrator to give you operator access.</div>`;
}

// Shown to non-operators instead of incident data: anyone with an account can report.
export function reportPanelHtml() {
    return `<div class="hrs-report-panel">
        <i class="bi bi-megaphone" aria-hidden="true"></i>
        <h2 class="h5 mb-1">Need help or saw an emergency?</h2>
        <p class="mb-3">Report it. Staff review every report before help is sent.</p>
        <button type="button" class="btn btn-primary" data-action="report"><i class="bi bi-plus-lg" aria-hidden="true"></i> Report incident</button>
        <p class="small text-secondary mt-3 mb-0">Operator? Ask an administrator to give you operator access to see incidents.</p>
    </div>`;
}
