import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requireLogin, safeNext, initNavbar, userInitials } from './auth.js';
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

describe('avatar menu', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <button id="avatarButton"><span id="userInitials"></span></button>
            <span id="userName"></span>
            <button id="logoutBtn"></button>`;
    });
    afterEach(() => vi.restoreAllMocks());

    it('takes initials from the full name, else the username', () => {
        expect(userInitials({ full_name: 'Rezwan Islam', username: 'rezwan' })).toBe('RI');
        expect(userInitials({ full_name: '', username: 'operator1' })).toBe('O');
        expect(userInitials(null)).toBe('?');
    });

    it('fills the avatar and the menu with the signed-in user, escaped', () => {
        setSession('tok', { full_name: '<b>Karim</b> Uddin', username: 'karim' });

        initNavbar({ liveBell: false });

        expect(document.getElementById('userInitials').textContent).toBe('<U');
        expect(document.getElementById('userName').textContent).toBe('<b>Karim</b> Uddin');
        expect(document.getElementById('userName').innerHTML).not.toContain('<b>');
        expect(document.getElementById('avatarButton').getAttribute('aria-label')).toBe('Account menu for <b>Karim</b> Uddin');
    });

    it('signs out from the menu', () => {
        setSession('tok', { username: 'karim' });
        const go = vi.spyOn(nav, 'go').mockImplementation(() => {});
        initNavbar({ liveBell: false });

        document.getElementById('logoutBtn').click();

        expect(go).toHaveBeenCalledWith('/app/login/');
        expect(localStorage.getItem('accessToken')).toBeNull();
    });
});
