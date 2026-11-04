import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requireLogin, safeNext } from './auth.js';
import { nav, setSession } from './utils.js';

describe('requireLogin', () => {
    let go;
    beforeEach(() => {
        localStorage.clear();
        go = vi.spyOn(nav, 'go').mockImplementation(() => {});
    });
    afterEach(() => vi.restoreAllMocks());

    it('sends signed-out visitors to the login page with a return path', () => {
        window.history.pushState({}, '', '/app/incidents/');

        expect(requireLogin()).toBe(false);
        expect(go).toHaveBeenCalledWith('/app/login/?next=%2Fapp%2Fincidents%2F');
    });

    it('lets signed-in users through', () => {
        setSession('tok', {});

        expect(requireLogin()).toBe(true);
        expect(go).not.toHaveBeenCalled();
    });
});

describe('safeNext', () => {
    it('accepts same-site paths only', () => {
        expect(safeNext('?next=/app/volunteers/')).toBe('/app/volunteers/');
        expect(safeNext('?next=//evil.example/')).toBeNull();
        expect(safeNext('?next=https://evil.example/')).toBeNull();
        expect(safeNext('')).toBeNull();
    });
});
