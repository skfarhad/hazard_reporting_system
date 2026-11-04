// Incidents page state: filters <-> page URL <-> API params, and pager helpers.
import { INCIDENT_PAGE_SIZE, INCIDENT_STATUSES } from './constants.js';

export const DEFAULT_FILTERS = Object.freeze({
    needs: [], status: '', event: '', hazard: '', lifeThreatening: false, q: '', page: 1,
});

export function readFilters(search) {
    const params = new URLSearchParams(search);
    const page = Number.parseInt(params.get('page'), 10);
    const status = params.get('status') || '';
    return {
        needs: (params.get('needs') || '').split(',').map((c) => c.trim()).filter(Boolean),
        status: INCIDENT_STATUSES.includes(status) ? status : '',
        event: params.get('event') || '',
        hazard: params.get('hazard') || '',
        lifeThreatening: params.get('life_threatening') === 'true',
        q: params.get('q') || '',
        page: Number.isInteger(page) && page >= 1 ? page : 1,
    };
}

// Shared by the page URL and the API: only non-default values are written.
function toParams(filters) {
    const params = new URLSearchParams();
    if (filters.needs.length) params.set('needs', filters.needs.join(','));
    if (filters.status) params.set('status', filters.status);
    if (filters.event) params.set('event', filters.event);
    if (filters.hazard) params.set('hazard', filters.hazard);
    if (filters.lifeThreatening) params.set('life_threatening', 'true');
    if (filters.q.trim()) params.set('q', filters.q.trim());
    return params;
}

export function filtersToSearch(filters) {
    const params = toParams(filters);
    if (filters.page > 1) params.set('page', String(filters.page));
    const text = params.toString();
    return text ? `?${text}` : '';
}

export function filtersToApiParams(filters) {
    const params = toParams(filters);
    params.set('page', String(filters.page));
    params.set('page_size', String(INCIDENT_PAGE_SIZE));
    return params.toString();
}

// Any change other than the page itself starts again from page 1.
export function withFilter(filters, change) {
    const onlyPage = Object.keys(change).every((key) => key === 'page');
    return { ...filters, ...change, page: onlyPage ? change.page : 1 };
}

// The Event / hazard dropdown has one value: '', 'event:<id>', 'event:none' or 'hazard:<code>'.
export function scopeValue(filters) {
    if (filters.event) return `event:${filters.event}`;
    if (filters.hazard) return `hazard:${filters.hazard}`;
    return '';
}

export function withScope(filters, value) {
    const [kind, id = ''] = String(value || '').split(':');
    return withFilter(filters, { event: kind === 'event' ? id : '', hazard: kind === 'hazard' ? id : '' });
}

export function totalPages(count, pageSize = INCIDENT_PAGE_SIZE) {
    return Math.max(1, Math.ceil(count / pageSize));
}

// First, last and the pages around the current one; a single skipped page is shown instead of '…'.
export function pageRange(page, pages) {
    const wanted = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
    const sorted = [...wanted].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((p, index) => {
        const previous = sorted[index - 1];
        if (previous !== undefined && p - previous === 2) result.push(previous + 1);
        else if (previous !== undefined && p - previous > 2) result.push('…');
        result.push(p);
    });
    return result;
}

export function showingText(page, count, pageSize = INCIDENT_PAGE_SIZE) {
    if (!count) return 'No incidents match';
    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, count);
    return first === last ? `Showing ${first} of ${count}` : `Showing ${first}–${last} of ${count}`;
}
