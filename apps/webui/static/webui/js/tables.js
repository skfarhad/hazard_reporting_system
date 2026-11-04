// Status badges, volunteer rows and the report panel (no DOM access). Incident rows live in incident-views.js.
import { escapeHtml } from './utils.js';
import { avatarHtml } from './dashboard-views.js';

const STATUSES = ['pending', 'validated', 'rejected'];

function matches(query, values) {
    const q = query.trim().toLowerCase();
    return !q || values.some((v) => String(v ?? '').toLowerCase().includes(q));
}

export function filterVolunteers(volunteers, { query = '' } = {}) {
    return volunteers.filter((v) => matches(query, [
        v.full_name, v.contact_number, v.address, v.district?.name, v.thana?.name, ...(v.skills || []),
    ]));
}

export function statusBadge(status) {
    const css = STATUSES.includes(status) ? `hrs-badge-${status}` : '';
    const dot = STATUSES.includes(status) ? `<span class="hrs-dot hrs-dot-${status}"></span>` : '';
    return `<span class="hrs-badge ${css}">${dot}${escapeHtml(status)}</span>`;
}

export function volunteerRow(v) {
    const area = [v.thana?.name, v.district?.name].filter(Boolean).join(', ') || '–';
    const phone = escapeHtml(v.contact_number);
    const status = v.is_active
        ? '<span class="hrs-badge hrs-badge-volunteer">Active</span>'
        : '<span class="hrs-badge">Inactive</span>';
    return `<tr>
        <td><span class="d-flex align-items-center gap-2">${avatarHtml({ name: v.full_name, photo: v.photo, active: v.is_active })}
            <span>${escapeHtml(v.full_name)}</span></span></td>
        <td><a href="tel:${phone}">${phone}</a></td>
        <td>${escapeHtml(area)}<div class="small text-secondary">${escapeHtml(v.address)}</div></td>
        <td>${(v.skills || []).map(escapeHtml).join(', ') || '–'}</td>
        <td>${Number(v.assigned_incident_count) || 0}</td>
        <td>${status}</td>
    </tr>`;
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

// Shown to non-operators on operator-only pages (Volunteers, Location).
export function operatorsOnlyHtml(what) {
    return `<div class="hrs-report-panel">
        <i class="bi bi-shield-lock" aria-hidden="true"></i>
        <h2 class="h5 mb-1">Only operators can see ${escapeHtml(what)}</h2>
        <p class="mb-0">To report an emergency, go to the <a href="/app/">Dashboard</a>.</p>
    </div>`;
}
