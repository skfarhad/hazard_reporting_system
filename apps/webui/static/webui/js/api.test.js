import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiGet, apiPost } from './api.js';
import { nav, setSession, getAccessToken } from './utils.js';

function mockFetch(status, body) {
    const fetchMock = vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

describe('api', () => {
    let go;
    beforeEach(() => {
        localStorage.clear();
        go = vi.spyOn(nav, 'go').mockImplementation(() => {});
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('sends the JWT on signed-in requests', async () => {
        setSession('tok123', {});
        const fetchMock = mockFetch(200, [{ id: 1 }]);

        const res = await apiGet('/api/incidents/list/');

        expect(res).toEqual({ ok: true, status: 200, data: [{ id: 1 }] });
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok123');
    });

    it('goes to the login page without calling the API when signed out', async () => {
        const fetchMock = mockFetch(200, []);

        const res = await apiGet('/api/incidents/list/');

        expect(res.ok).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(go).toHaveBeenCalledWith('/app/login/');
    });

    it('ends the session on a 401', async () => {
        setSession('expired', {});
        mockFetch(401, { detail: 'Token is invalid' });

        await apiGet('/api/incidents/list/');

        expect(getAccessToken()).toBeNull();
        expect(go).toHaveBeenCalledWith('/app/login/');
    });

    it('returns a 403 to the page as not allowed without ending the session', async () => {
        setSession('tok', {});
        mockFetch(403, { detail: 'You do not have permission to perform this action.' });

        const res = await apiGet('/api/incidents/list/');

        expect(res.ok).toBe(false);
        expect(res.status).toBe(403);
        expect(getAccessToken()).toBe('tok');
        expect(go).not.toHaveBeenCalled();
    });

    it('returns the API error for unauthenticated posts instead of redirecting', async () => {
        mockFetch(401, { detail: 'Invalid credentials!' });

        const res = await apiPost('/api/user/login/password/', { username: 'a', password: 'b' }, { auth: false });

        expect(res).toEqual({ ok: false, status: 401, data: { detail: 'Invalid credentials!' } });
        expect(go).not.toHaveBeenCalled();
    });

    it('reports a network failure without throwing', async () => {
        setSession('tok', {});
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

        const res = await apiGet('/api/incidents/list/');

        expect(res.ok).toBe(false);
        expect(res.status).toBe(0);
    });
});
