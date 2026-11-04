import { describe, it, expect } from 'vitest';
import {
    DEFAULT_FILTERS, readFilters, filtersToSearch, filtersToApiParams, withFilter, withScope, scopeValue,
    pageRange, showingText, totalPages,
} from './incident-query.js';

describe('page URL <-> filters', () => {
    it('reads needs, status, event or hazard, life-threatening, search and page from the page URL', () => {
        expect(readFilters('?needs=rescue,medical&status=pending&event=3&life_threatening=true&q=roof&page=2')).toEqual({
            needs: ['rescue', 'medical'], status: 'pending', event: '3', hazard: '',
            lifeThreatening: true, q: 'roof', page: 2,
        });
        expect(readFilters('?hazard=flood').hazard).toBe('flood');
        expect(readFilters('?event=none').event).toBe('none');
    });

    it('ignores unknown keys and treats a missing or invalid page as page 1', () => {
        expect(readFilters('?foo=bar')).toEqual(DEFAULT_FILTERS);
        expect(readFilters('?page=0').page).toBe(1);
        expect(readFilters('?page=abc').page).toBe(1);
        expect(readFilters('?status=weird').status).toBe('');
    });

    it('writes only non-default filters back to the page URL', () => {
        expect(filtersToSearch(DEFAULT_FILTERS)).toBe('');
        expect(filtersToSearch({ ...DEFAULT_FILTERS, needs: ['rescue', 'food'], page: 3 }))
            .toBe('?needs=rescue%2Cfood&page=3');
        expect(readFilters(filtersToSearch({ ...DEFAULT_FILTERS, q: 'a b', lifeThreatening: true })))
            .toEqual({ ...DEFAULT_FILTERS, q: 'a b', lifeThreatening: true });
    });
});

describe('API params', () => {
    it('turns filters into API params with page and page size', () => {
        const params = new URLSearchParams(filtersToApiParams({
            ...DEFAULT_FILTERS, needs: ['rescue', 'medical'], status: 'validated', lifeThreatening: true, q: ' roof ', page: 2,
        }));

        expect(Object.fromEntries(params)).toEqual({
            needs: 'rescue,medical', status: 'validated', life_threatening: 'true', q: 'roof', page: '2', page_size: '25',
        });
    });

    it('maps the event/hazard choice to the event or hazard API param, including no event', () => {
        const event = withScope(DEFAULT_FILTERS, 'event:3');
        const none = withScope(DEFAULT_FILTERS, 'event:none');
        const hazard = withScope(event, 'hazard:flood');

        expect(new URLSearchParams(filtersToApiParams(event)).get('event')).toBe('3');
        expect(new URLSearchParams(filtersToApiParams(none)).get('event')).toBe('none');
        expect(hazard.event).toBe('');
        expect(new URLSearchParams(filtersToApiParams(hazard)).get('hazard')).toBe('flood');
        expect(scopeValue(hazard)).toBe('hazard:flood');
        expect(scopeValue(withScope(hazard, ''))).toBe('');
    });
});

describe('changing filters', () => {
    it('changing any filter goes back to page 1, changing the page keeps the filters', () => {
        const onPage3 = { ...DEFAULT_FILTERS, status: 'pending', page: 3 };

        expect(withFilter(onPage3, { needs: ['food'] })).toEqual({ ...onPage3, needs: ['food'], page: 1 });
        expect(withScope(onPage3, 'event:2').page).toBe(1);
        expect(withFilter(onPage3, { page: 4 })).toEqual({ ...onPage3, page: 4 });
    });
});

describe('pager', () => {
    it('counts pages from the total', () => {
        expect(totalPages(0)).toBe(1);
        expect(totalPages(25)).toBe(1);
        expect(totalPages(26)).toBe(2);
    });

    it('lists page numbers with ellipses around the current page', () => {
        expect(pageRange(1, 1)).toEqual([1]);
        expect(pageRange(2, 5)).toEqual([1, 2, 3, 4, 5]);
        expect(pageRange(6, 12)).toEqual([1, '…', 5, 6, 7, '…', 12]);
        expect(pageRange(1, 12)).toEqual([1, 2, '…', 12]);
        expect(pageRange(12, 12)).toEqual([1, '…', 11, 12]);
    });

    it('describes which incidents are showing out of the total', () => {
        expect(showingText(2, 148)).toBe('Showing 26–50 of 148');
        expect(showingText(6, 148)).toBe('Showing 126–148 of 148');
        expect(showingText(1, 1)).toBe('Showing 1 of 1');
        expect(showingText(1, 0)).toBe('No incidents match');
    });
});
