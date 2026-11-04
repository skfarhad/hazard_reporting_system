import { describe, it, expect } from 'vitest';
import { filterVolunteers, volunteerRow, reportPanelHtml, operatorsOnlyHtml } from './tables.js';

const volunteers = [
    {
        id: 1, full_name: 'Rahim', contact_number: '01711111111', address: 'Sylhet', skills: ['rescue'], is_active: true,
        district: { id: 2, name: 'Sylhet' }, thana: { id: 20, name: 'Companiganj' }, photo: null, assigned_incident_count: 2,
    },
    {
        id: 2, full_name: 'Karim', contact_number: '01822222222', address: 'Dhaka', skills: ['medical'], is_active: false,
        district: null, thana: null, photo: null, assigned_incident_count: 0,
    },
];

describe('filterVolunteers', () => {
    it('matches name, phone, address, area and skills', () => {
        const names = (query) => filterVolunteers(volunteers, { query }).map((v) => v.full_name);

        expect(names('rescue')).toEqual(['Rahim']);
        expect(names('01822')).toEqual(['Karim']);
        expect(names('companiganj')).toEqual(['Rahim']);
        expect(names('')).toEqual(['Rahim', 'Karim']);
    });
});

describe('rows', () => {
    it('a volunteer row shows avatar, name, phone, area, skills, assignments and status', () => {
        const row = document.createElement('tbody');
        row.innerHTML = volunteerRow(volunteers[0]);
        const text = row.textContent.replace(/\s+/g, ' ');

        ['Rahim', '01711111111', 'Companiganj, Sylhet', 'rescue', '2', 'Active'].forEach((v) => expect(text).toContain(v));
        expect(row.querySelector('a[href="tel:01711111111"]')).not.toBeNull();
        expect(row.querySelector('.hrs-avatar')).not.toBeNull();
    });

    it('an inactive volunteer without an area shows Inactive and a dash', () => {
        const row = document.createElement('tbody');
        row.innerHTML = volunteerRow(volunteers[1]);

        expect(row.textContent).toContain('Inactive');
        expect(row.textContent).toContain('–');
    });

    it('escapes volunteer text', () => {
        const html = volunteerRow({ ...volunteers[0], full_name: '<b>x</b>', skills: ['<i>s</i>'], address: '<u>a</u>' });

        ['<b>x', '<i>s', '<u>a'].forEach((bad) => expect(html).not.toContain(bad));
    });
});

describe('reportPanelHtml', () => {
    it('the report panel invites non-operators to report and explains operator access', () => {
        const box = document.createElement('div');
        box.innerHTML = reportPanelHtml();

        expect(box.textContent).toContain('Report it');
        expect(box.textContent).toContain('Staff review every report');
        expect(box.textContent).toContain('Ask an administrator');
        expect(box.querySelector('button[data-action="report"]')).not.toBeNull();
    });
});

describe('operatorsOnlyHtml', () => {
    it('tells non-operators the page is for operators and where to report instead', () => {
        const box = document.createElement('div');
        box.innerHTML = operatorsOnlyHtml('<b>volunteers</b>');

        expect(box.textContent).toContain('Only operators can see <b>volunteers</b>');
        expect(box.querySelector('a[href="/app/"]')).not.toBeNull();
    });
});
