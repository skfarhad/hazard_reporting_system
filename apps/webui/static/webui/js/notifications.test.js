import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bellBadgeText, notificationItemHtml, notificationsListHtml, createBell } from './notifications.js';

const ITEM = {
    id: 12, description: '5 people on roof', district: 'Feni', thana: 'Parshuram', address: 'School', created_at: '2026-08-22T11:30:00Z',
};

describe('bell badge and list', () => {
    it('hides the badge at zero and caps it at 9+', () => {
        expect(bellBadgeText(0)).toBe('');
        expect(bellBadgeText(3)).toBe('3');
        expect(bellBadgeText(9)).toBe('9');
        expect(bellBadgeText(10)).toBe('9+');
    });

    it('each new report links to its details, with its place, message and time', () => {
        const li = document.createElement('ul');
        li.innerHTML = notificationItemHtml(ITEM);
        const link = li.querySelector('a');

        expect(link.getAttribute('href')).toBe('/app/incidents/#incident-12');
        expect(link.textContent).toContain('Feni-Parshuram Incident');
        expect(link.textContent).toContain('5 people on roof');
        expect(link.textContent).toContain('22nd August');
    });

    it('says when there is nothing new, and escapes report text', () => {
        expect(notificationsListHtml([])).toContain('No new reports');
        const html = notificationsListHtml([{ ...ITEM, id: '1"><img>', description: '<script>x</script>', district: '<b>D</b>' }]);
        ['<script>', '<b>D', '"><img>'].forEach((bad) => expect(html).not.toContain(bad));
    });
});

describe('createBell', () => {
    let els;
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="bell" hidden><button id="bellButton"><span id="bellBadge" hidden></span></button><ul id="bellMenu"></ul></div>
            <a id="locationTab" data-operator-only hidden></a>`;
        els = {
            root: document.getElementById('bell'),
            button: document.getElementById('bellButton'),
            badge: document.getElementById('bellBadge'),
            menu: document.getElementById('bellMenu'),
        };
    });

    function api(unread, results = [ITEM]) {
        return {
            apiGet: vi.fn().mockResolvedValue({ ok: true, status: 200, data: { unread, results } }),
            apiPost: vi.fn().mockResolvedValue({ ok: true, status: 200, data: { unread: 0 } }),
        };
    }

    it('shows the bell and operator-only links to operators, with the unread count', async () => {
        const bell = createBell({ ...els, ...api(3) });

        await bell.refresh();

        expect(els.root.hidden).toBe(false);
        expect(document.getElementById('locationTab').hidden).toBe(false);
        expect(els.badge.hidden).toBe(false);
        expect(els.badge.textContent).toBe('3');
        expect(els.button.getAttribute('aria-label')).toBe('Notifications: 3 new reports');
    });

    it('stays hidden for people who are not operators', async () => {
        const bell = createBell({
            ...els, apiGet: vi.fn().mockResolvedValue({ ok: false, status: 403, data: {} }), apiPost: vi.fn(),
        });

        await bell.refresh();

        expect(els.root.hidden).toBe(true);
        expect(document.getElementById('locationTab').hidden).toBe(true);
    });

    it('opening the bell lists the new reports, marks them seen and clears the badge', async () => {
        const calls = api(2);
        const bell = createBell({ ...els, ...calls });
        await bell.refresh();

        await bell.opened();

        expect(els.menu.querySelectorAll('a[href^="/app/incidents/#incident-"]')).toHaveLength(1);
        expect(calls.apiPost).toHaveBeenCalledTimes(1);
        expect(els.badge.hidden).toBe(true);
        expect(els.button.getAttribute('aria-label')).toBe('Notifications: no new reports');
    });

    it('refreshes quietly, without the page spinner', async () => {
        const calls = api(0);
        await createBell({ ...els, ...calls }).refresh();

        expect(calls.apiGet.mock.calls[0][1]).toEqual({ quiet: true });
    });
});
