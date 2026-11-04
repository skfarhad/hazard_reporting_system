// The navbar bell: new pending reports since the operator last opened it. Operators only: for anyone else
// the API says 403 and the bell (and other operator-only links) stay hidden.
import { escapeHtml } from './utils.js';
import { API } from './constants.js';
import { incidentTitle, cardDateParts } from './dashboard-views.js';

export function bellBadgeText(unread) {
    if (!unread) return '';
    return unread > 9 ? '9+' : String(unread);
}

export function notificationItemHtml(item) {
    const { day, time } = cardDateParts(item.created_at);
    return `<li><a class="dropdown-item hrs-bell-item" href="/app/incidents/#incident-${encodeURIComponent(item.id)}">
        <span class="hrs-dash-title">${escapeHtml(incidentTitle(item))}</span>
        <span class="hrs-dash-message">${escapeHtml(item.description)}</span>
        <span class="hrs-dash-meta">${escapeHtml(day)} • ${escapeHtml(time)}</span>
    </a></li>`;
}

export function notificationsListHtml(results) {
    if (!results.length) return '<li class="dropdown-item-text text-secondary small">No new reports.</li>';
    return results.map(notificationItemHtml).join('');
}

function label(unread) {
    if (!unread) return 'Notifications: no new reports';
    return `Notifications: ${unread} new ${unread === 1 ? 'report' : 'reports'}`;
}

export function createBell({ root, button, badge, menu, apiGet, apiPost }) {
    let latest = { unread: 0, results: [] };

    function show(unread) {
        const text = bellBadgeText(unread);
        badge.textContent = text;
        badge.hidden = !text;
        button.setAttribute('aria-label', label(unread));
    }

    async function refresh() {
        const res = await apiGet(API.notifications, { quiet: true });
        const operator = res.ok;
        root.hidden = !operator;
        document.querySelectorAll('[data-operator-only]').forEach((el) => { el.hidden = !operator; });
        if (!operator) return;
        latest = res.data;
        show(latest.unread);
        menu.innerHTML = notificationsListHtml(latest.results);
    }

    // The dropdown opened: what it lists is now seen.
    async function opened() {
        menu.innerHTML = notificationsListHtml(latest.results);
        if (!latest.unread) return;
        const res = await apiPost(API.notificationsSeen, {}, { quiet: true });
        if (res.ok) {
            latest = { ...latest, unread: 0 };
            show(0);
        }
    }

    return { refresh, opened };
}
