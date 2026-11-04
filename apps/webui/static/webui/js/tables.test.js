import { describe, it, expect } from 'vitest';
import { filterIncidents, filterVolunteers, summarize, incidentRow, volunteerRow, operatorAccessNotice } from './tables.js';

const incidents = [
    { id: 1, description: 'Water in house', address: 'Mirpur', contact_number: '01711111111', validation_status: 'pending' },
    { id: 2, description: 'Stranded on roof', address: 'Sylhet', contact_number: '01722222222', validation_status: 'validated' },
    { id: 3, description: 'False alarm', address: 'Sylhet', contact_number: '01733333333', validation_status: 'rejected' },
];
const volunteers = [
    { full_name: 'Rahim', address: 'Sylhet', assistance_type: 'boat' },
    { full_name: 'Karim', address: 'Dhaka', assistance_type: 'doctor' },
];

describe('filterIncidents', () => {
    it('matches the query against description, address and phone, case-insensitively', () => {
        expect(filterIncidents(incidents, { query: 'sylhet' }).map((i) => i.id)).toEqual([2, 3]);
        expect(filterIncidents(incidents, { query: '0172' }).map((i) => i.id)).toEqual([2]);
    });

    it('combines the query with the status filter', () => {
        expect(filterIncidents(incidents, { query: 'sylhet', status: 'validated' }).map((i) => i.id)).toEqual([2]);
    });

    it('returns everything for an empty filter', () => {
        expect(filterIncidents(incidents)).toHaveLength(3);
    });
});

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
    it('escapes incident text', () => {
        const row = incidentRow({ ...incidents[0], description: '<script>x</script>' });
        expect(row).not.toContain('<script>');
        expect(row).toContain('&lt;script&gt;');
    });

    it('shows a dash for a volunteer without a location', () => {
        expect(volunteerRow({ ...volunteers[0], latitude: null, longitude: null })).toContain('–');
    });
});

describe('operatorAccessNotice', () => {
    it('explains how to get operator access', () => {
        const html = operatorAccessNotice();
        expect(html).toContain("isn't an operator yet");
        expect(html).toContain('administrator');
    });
});
