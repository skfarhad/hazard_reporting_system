// Live dashboard state (period, status card, area, searches, selected incident), kept in the page URL,
// and the API query strings it turns into.
import { DASHBOARD_MAP_PAGE_SIZE } from './constants.js';

export const PERIODS = [
    { value: 'today', label: "Today's incidents" },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: 'event', label: 'Active event' },
];
export const INCIDENT_STATUS_CARDS = ['pending', 'resolved', 'all'];
export const VOLUNTEER_STATUS_CARDS = ['active', 'inactive', 'all'];

export const DEFAULT_DASHBOARD = Object.freeze({
    period: 'today', status: 'pending', district: '', thana: '', q: '', vq: '', vstatus: 'all', selected: null,
});

const ID = /^[1-9]\d*$/;

function oneOf(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}

function idText(value) {
    return ID.test(value || '') ? value : '';
}

export function readDashboardState(search) {
    const p = new URLSearchParams(search);
    const selected = p.get('selected');
    return {
        period: oneOf(p.get('period'), PERIODS.map((x) => x.value), DEFAULT_DASHBOARD.period),
        status: oneOf(p.get('status'), INCIDENT_STATUS_CARDS, DEFAULT_DASHBOARD.status),
        district: idText(p.get('district')),
        thana: idText(p.get('thana')),
        q: p.get('q') || '',
        vq: p.get('vq') || '',
        vstatus: oneOf(p.get('vstatus'), VOLUNTEER_STATUS_CARDS, DEFAULT_DASHBOARD.vstatus),
        selected: ID.test(selected || '') ? Number(selected) : null,
    };
}

// Only what differs from the defaults goes in the URL.
export function dashboardToSearch(state) {
    const p = new URLSearchParams();
    Object.keys(DEFAULT_DASHBOARD).forEach((key) => {
        const value = state[key];
        if (value !== DEFAULT_DASHBOARD[key] && value !== '' && value !== null && value !== undefined) p.set(key, String(value));
    });
    const text = p.toString();
    return text ? `?${text}` : '';
}

// A new district clears the thana (it belongs to the old district).
export function withArea(state, change) {
    if ('district' in change && change.district !== state.district) return { ...state, district: change.district, thana: '' };
    return { ...state, ...change };
}

function query(entries) {
    const p = new URLSearchParams();
    entries.forEach(([key, value]) => { if (value !== '' && value !== null && value !== undefined) p.set(key, String(value)); });
    return p.toString();
}

function areaEntries(state) {
    return [['district', state.district], ['thana', state.thana]];
}

export function summaryApiParams(state) {
    return query([['period', state.period], ...areaEntries(state), ['q', state.q.trim()]]);
}

// Pending = waiting for staff review; Resolved = task closed; All = everything in the period.
export function incidentApiParams(state) {
    const status = { pending: [['status', 'pending']], resolved: [['task_status', 'closed']] }[state.status] || [];
    return query([
        ['period', state.period], ...areaEntries(state), ['q', state.q.trim()], ...status, ['page_size', DASHBOARD_MAP_PAGE_SIZE],
    ]);
}

export function volunteerSummaryParams(state) {
    return query([...areaEntries(state), ['q', state.vq.trim()]]);
}

// With an incident selected (and placed), volunteers come nearest first.
export function volunteerApiParams(state, selectedIncident) {
    const active = { active: 'true', inactive: 'false' }[state.vstatus];
    const placed = Number.isFinite(selectedIncident?.latitude) && Number.isFinite(selectedIncident?.longitude);
    return query([
        ...areaEntries(state), ['q', state.vq.trim()], ['active', active],
        ['near', placed ? `${selectedIncident.latitude},${selectedIncident.longitude}` : ''],
    ]);
}

const STATUS_WORDS = { pending: 'Pending', resolved: 'Resolved', active: 'Active', inactive: 'Inactive' };

function plural(count, word) {
    return count === 1 ? word : `${word}s`;
}

export function incidentsShowingText(count, status) {
    const word = STATUS_WORDS[status];
    if (!count) return word ? `No ${word} Incidents` : 'No Incidents';
    return word ? `Showing ${count} ${word} ${plural(count, 'Incident')}` : `Showing All ${count} ${plural(count, 'Incident')}`;
}

export function volunteersShowingText(count, status) {
    const word = STATUS_WORDS[status];
    if (!count) return word ? `No ${word} Volunteers` : 'No Volunteers';
    return word ? `Showing ${count} ${word} ${plural(count, 'Volunteer')}` : `Showing All Volunteers (${count})`;
}
