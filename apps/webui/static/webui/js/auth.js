// Login state for the signed-in pages, and the navbar's account menu and notifications bell.
import { getAccessToken, getUser, clearSession, nav } from './utils.js';
import { LOGIN_PAGE } from './constants.js';
import { apiGet, apiPost } from './api.js';
import { initials } from './dashboard-views.js';
import { createBell } from './notifications.js';
import { createLiveSocket, debounceNudges, socketUrl } from './live.js';

const BELL_NUDGE_DELAY_MS = 2000;

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

export function userInitials(user) {
    return initials(user?.full_name || user?.username || '');
}

function setUpBell({ liveBell }) {
    const root = document.getElementById('bell');
    if (!root) return;
    const bell = createBell({
        root,
        button: document.getElementById('bellButton'),
        badge: document.getElementById('bellBadge'),
        menu: document.getElementById('bellMenu'),
        apiGet,
        apiPost,
    });
    root.addEventListener('show.bs.dropdown', () => bell.opened());
    // The live dashboard has its own socket and tells the bell when incidents change.
    window.addEventListener('hrs:incidents-changed', () => bell.refresh());
    bell.refresh().then(() => {
        if (!liveBell || root.hidden || !window.WebSocket) return;
        createLiveSocket({
            url: socketUrl(window.location),
            getToken: getAccessToken,
            WebSocket: window.WebSocket,
            onNudge: debounceNudges((kinds) => { if (kinds.has('incident')) bell.refresh(); }, BELL_NUDGE_DELAY_MS),
            onReconnect: () => bell.refresh(),
        });
    });
}

// `liveBell: false` when the page already has a live socket (the dashboard) and refreshes the bell itself.
export function initNavbar({ liveBell = true } = {}) {
    const user = getUser();
    const name = user?.full_name || user?.username || '';
    const initialsEl = document.getElementById('userInitials');
    if (initialsEl) initialsEl.textContent = userInitials(user);
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = name;
    document.getElementById('avatarButton')?.setAttribute('aria-label', name ? `Account menu for ${name}` : 'Account menu');
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    setUpBell({ liveBell });
}

// Only same-site paths are allowed as the post-login destination.
export function safeNext(search) {
    const next = new URLSearchParams(search).get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}
