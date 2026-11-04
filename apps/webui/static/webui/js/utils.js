// Session storage, navigation and formatting helpers.
const TOKEN_KEY = 'accessToken';
const USER_KEY = 'userInfo';

function storage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function getAccessToken() {
    return storage()?.getItem(TOKEN_KEY) || null;
}

export function getUser() {
    try {
        return JSON.parse(storage()?.getItem(USER_KEY) || 'null');
    } catch {
        return null;
    }
}

export function setSession(token, user) {
    storage()?.setItem(TOKEN_KEY, token);
    storage()?.setItem(USER_KEY, JSON.stringify(user || {}));
}

export function clearSession() {
    storage()?.removeItem(TOKEN_KEY);
    storage()?.removeItem(USER_KEY);
}

// Wrapped in an object so tests can spy on navigation.
export const nav = {
    go(url) {
        window.location.assign(url);
    },
};

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function formatDateTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
}
