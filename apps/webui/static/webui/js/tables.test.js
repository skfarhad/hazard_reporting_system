import { describe, it, expect } from 'vitest';
import { filterVolunteers, summarize, volunteerRow, reportPanelHtml } from './tables.js';

const incidents = [
    { id: 1, description: 'Water in house', address: 'Mirpur', contact_number: '01711111111', validation_status: 'pending' },
    { id: 2, description: 'Stranded on roof', address: 'Sylhet', contact_number: '01722222222', validation_status: 'validated' },
    { id: 3, description: 'False alarm', address: 'Sylhet', contact_number: '01733333333', validation_status: 'rejected' },
];
const volunteers = [
    { full_name: 'Rahim', address: 'Sylhet', assistance_type: 'boat' },
    { full_name: 'Karim', address: 'Dhaka', assistance_type: 'doctor' },
];

describe('filterVolunteers', () => {
    it('matches name, address and assistance type', () => {
        expect(filterVolunteers(volunteers, { query: 'boat' }).map((v) => v.full_name)).toEqual(['Rahim']);
    });
});

describe('summarize', () => {
    it('counts incidents by status and volunteers', () => {
        expect(summarize(incidents, volunteers)).toEqual({ total: 3, pending: 1, validated: 1, volunteers: 2 });
    });
});

describe('rows', () => {
    it('shows a dash for a volunteer without a location', () => {
        expect(volunteerRow({ ...volunteers[0], latitude: null, longitude: null })).toContain('–');
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
