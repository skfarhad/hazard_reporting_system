// Login state for the signed-in pages.
import { getAccessToken, getUser, clearSession, nav, escapeHtml } from './utils.js';
import { LOGIN_PAGE } from './constants.js';

// Returns false (and goes to the login page) when nobody is signed in.
export function requireLogin() {
    if (getAccessToken()) return true;
    const next = encodeURIComponent(window.location.pathname);
    nav.go(`${LOGIN_PAGE}?next=${next}`);
    return false;
}

export function logout() {
    clearSession();
    nav.go(LOGIN_PAGE);
}

export function initNavbar() {
    const user = getUser();
    const label = document.getElementById('currentUser');
    if (label && user) label.innerHTML = `<i class="bi bi-person-circle me-1"></i>${escapeHtml(user.full_name || user.username)}`;
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

// Only same-site paths are allowed as the post-login destination.
export function safeNext(search) {
    const next = new URLSearchParams(search).get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}
