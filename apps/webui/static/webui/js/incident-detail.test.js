import { describe, it, expect } from 'vitest';
import { adjacentIncident, incidentIdFromHash, incidentHash } from './incident-detail.js';

describe('prev / next', () => {
    const ids = [7, 5, 3];

    it('next and previous move within the page and ask for the adjacent page at the edges', () => {
        expect(adjacentIncident({ ids, id: 5, dir: 1, page: 2, pages: 3 })).toEqual({ id: 3 });
        expect(adjacentIncident({ ids, id: 5, dir: -1, page: 2, pages: 3 })).toEqual({ id: 7 });
        expect(adjacentIncident({ ids, id: 3, dir: 1, page: 2, pages: 3 })).toEqual({ page: 3, position: 'first' });
        expect(adjacentIncident({ ids, id: 7, dir: -1, page: 2, pages: 3 })).toEqual({ page: 1, position: 'last' });
    });

    it('there is no previous before the first incident or next after the last', () => {
        expect(adjacentIncident({ ids, id: 7, dir: -1, page: 1, pages: 3 })).toBeNull();
        expect(adjacentIncident({ ids, id: 3, dir: 1, page: 3, pages: 3 })).toBeNull();
    });

    it('an incident opened from a link that is not on this page has no neighbours', () => {
        expect(adjacentIncident({ ids, id: 99, dir: 1, page: 1, pages: 3 })).toBeNull();
    });
});

describe('deep link', () => {
    it('reads and writes the incident deep link in the URL hash', () => {
        expect(incidentHash(12)).toBe('#incident-12');
        expect(incidentIdFromHash('#incident-12')).toBe(12);
        expect(incidentIdFromHash('#incident-abc')).toBeNull();
        expect(incidentIdFromHash('')).toBeNull();
        expect(incidentIdFromHash('#something')).toBeNull();
        expect(incidentIdFromHash('#incident-12x')).toBeNull();
        expect(incidentIdFromHash('#not-incident-12')).toBeNull();
    });
});
