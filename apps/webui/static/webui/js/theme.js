// Light/dark theme and design-token access. The theme is set before paint by hrs_head.html;
// this module handles the toggle button and lets scripts read tokens (e.g. map marker colours).
const STORAGE_KEY = 'hrsTheme';

export function currentTheme() {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // Private mode or blocked storage: the theme still applies for this page.
    }
    document.dispatchEvent(new CustomEvent('hrs:themechange', { detail: { theme } }));
}

export function toggleTheme() {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

// Reads a CSS custom property (design token) from <html>.
export function cssVar(name, fallback = '') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
}

function syncToggleIcon(button) {
    const dark = currentTheme() === 'dark';
    button.innerHTML = `<i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}"></i>`;
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    button.title = button.getAttribute('aria-label');
}

export function initThemeToggle() {
    const button = document.getElementById('themeToggle');
    if (!button) return;
    syncToggleIcon(button);
    button.addEventListener('click', toggleTheme);
    document.addEventListener('hrs:themechange', () => syncToggleIcon(button));
}

initThemeToggle();
