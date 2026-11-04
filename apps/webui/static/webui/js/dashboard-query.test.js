import { describe, it, expect } from 'vitest';
import {
    DEFAULT_DASHBOARD, readDashboardState, dashboardToSearch, incidentApiParams, summaryApiParams,
    volunteerApiParams, volunteerSummaryParams, incidentsShowingText, volunteersShowingText, withArea,
} from './dashboard-query.js';

const params = (query) => Object.fromEntries(new URLSearchParams(query));

describe('dashboard state in the URL', () => {
    it('defaults to today\'s pending incidents and all volunteers', () => {
        expect(readDashboardState('')).toEqual(DEFAULT_DASHBOARD);
        expect(DEFAULT_DASHBOARD).toMatchObject({ period: 'today', status: 'pending', vstatus: 'all', selected: null });
        expect(dashboardToSearch(DEFAULT_DASHBOARD)).toBe('');
    });

    it('round-trips every choice through the query string', () => {
        const state = {
            period: '7d', status: 'resolved', district: '3', thana: '12', q: 'roof', vq: 'karim', vstatus: 'active', selected: 41,
        };

        expect(readDashboardState(dashboardToSearch(state))).toEqual(state);
    });

    it('ignores unknown or broken values', () => {
        const state = readDashboardState('?period=forever&status=lost&vstatus=x&district=feni&thana=-2&selected=abc');

        expect(state).toEqual(DEFAULT_DASHBOARD);
    });

    it('changing the district clears the thana; choosing a thana keeps the district', () => {
        const state = { ...DEFAULT_DASHBOARD, district: '3', thana: '12' };

        expect(withArea(state, { district: '4' })).toMatchObject({ district: '4', thana: '' });
        expect(withArea(state, { thana: '13' })).toMatchObject({ district: '3', thana: '13' });
    });
});

describe('API parameters', () => {
    const state = { ...DEFAULT_DASHBOARD, period: '24h', district: '3', thana: '12', q: 'roof' };

    it('pending lists pending review, resolved lists closed tasks, all lists everything', () => {
        expect(params(incidentApiParams(state))).toEqual({
            period: '24h', district: '3', thana: '12', q: 'roof', status: 'pending', page_size: '500',
        });
        expect(params(incidentApiParams({ ...state, status: 'resolved' }))).toMatchObject({ task_status: 'closed' });
        expect(params(incidentApiParams({ ...state, status: 'resolved' }))).not.toHaveProperty('status');
        const all = params(incidentApiParams({ ...state, status: 'all' }));
        expect(all).not.toHaveProperty('status');
        expect(all).not.toHaveProperty('task_status');
    });

    it('the summary uses the same period, area and search but no status', () => {
        expect(params(summaryApiParams({ ...state, status: 'resolved' }))).toEqual({
            period: '24h', district: '3', thana: '12', q: 'roof',
        });
    });

    it('volunteers use the area, their own search and status, and nearest-first only with a selected incident', () => {
        const vstate = { ...state, vq: 'karim', vstatus: 'inactive' };

        expect(params(volunteerApiParams(vstate, null))).toEqual({ district: '3', thana: '12', q: 'karim', active: 'false' });
        expect(params(volunteerApiParams({ ...vstate, vstatus: 'active' }, { latitude: 23.2, longitude: 91.4 })))
            .toEqual({ district: '3', thana: '12', q: 'karim', active: 'true', near: '23.2,91.4' });
        expect(params(volunteerApiParams({ ...vstate, vstatus: 'all' }, { latitude: null, longitude: null })))
            .not.toHaveProperty('near');
        expect(params(volunteerSummaryParams(vstate))).toEqual({ district: '3', thana: '12', q: 'karim' });
    });

    it('leaves out empty filters', () => {
        expect(params(summaryApiParams(DEFAULT_DASHBOARD))).toEqual({ period: 'today' });
        expect(params(volunteerApiParams(DEFAULT_DASHBOARD, null))).toEqual({});
    });
});

describe('showing text', () => {
    it('says how many incidents of which status are shown', () => {
        expect(incidentsShowingText(32, 'pending')).toBe('Showing 32 Pending Incidents');
        expect(incidentsShowingText(1, 'resolved')).toBe('Showing 1 Resolved Incident');
        expect(incidentsShowingText(48, 'all')).toBe('Showing All 48 Incidents');
        expect(incidentsShowingText(0, 'pending')).toBe('No Pending Incidents');
    });

    it('says which volunteers are shown', () => {
        expect(volunteersShowingText(80, 'all')).toBe('Showing All Volunteers (80)');
        expect(volunteersShowingText(65, 'active')).toBe('Showing 65 Active Volunteers');
        expect(volunteersShowingText(1, 'inactive')).toBe('Showing 1 Inactive Volunteer');
        expect(volunteersShowingText(0, 'all')).toBe('No Volunteers');
    });
});
