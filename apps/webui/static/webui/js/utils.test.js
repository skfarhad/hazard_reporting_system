import { describe, it, expect, beforeEach } from 'vitest';
import { escapeHtml, setSession, getAccessToken, getUser, clearSession } from './utils.js';

describe('escapeHtml', () => {
    it('escapes markup so SMS text cannot inject HTML', () => {
        expect(escapeHtml('<img src=x onerror="alert(1)">&\''))
            .toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
    });

    it('turns null and undefined into an empty string', () => {
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });
});

describe('session', () => {
    beforeEach(() => localStorage.clear());

    it('stores and clears the token and user', () => {
        setSession('tok', { username: 'op1' });
        expect(getAccessToken()).toBe('tok');
        expect(getUser()).toEqual({ username: 'op1' });

        clearSession();
        expect(getAccessToken()).toBeNull();
        expect(getUser()).toBeNull();
    });
});
