// Calls to the backend API. Signed-in requests send the JWT; a 401 ends the session.
import { getAccessToken, clearSession, nav } from './utils.js';
import { LOGIN_PAGE } from './constants.js';
import { showSpinner, hideSpinner } from './ui.js';

// `quiet` skips the page spinner (background refreshes such as the live dashboard's).
async function request(method, endpoint, { body, auth = true, quiet = false } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
        const token = getAccessToken();
        if (!token) {
            nav.go(LOGIN_PAGE);
            return { ok: false, status: 401, data: null };
        }
        headers.Authorization = `Bearer ${token}`;
    }

    if (!quiet) showSpinner();
    try {
        const res = await fetch(endpoint, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (auth && res.status === 401) {
            clearSession();
            nav.go(LOGIN_PAGE);
            return { ok: false, status: 401, data: null };
        }
        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        return { ok: res.ok, status: res.status, data };
    } catch (error) {
        return { ok: false, status: 0, data: { detail: 'Network error, check your connection.' } };
    } finally {
        if (!quiet) hideSpinner();
    }
}

export const apiGet = (endpoint, options) => request('GET', endpoint, options);
export const apiPost = (endpoint, body, options) => request('POST', endpoint, { ...options, body });
export const apiPatch = (endpoint, body, options) => request('PATCH', endpoint, { ...options, body });
export const apiDelete = (endpoint, options) => request('DELETE', endpoint, options);
