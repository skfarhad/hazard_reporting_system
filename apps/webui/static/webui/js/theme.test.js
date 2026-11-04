import { describe, it, expect, beforeEach, vi } from 'vitest';
import { currentTheme, setTheme, toggleTheme, cssVar } from './theme.js';

describe('theme', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.setAttribute('data-bs-theme', 'light');
    });

    it('sets the theme attribute, remembers it and announces the change', () => {
        const listener = vi.fn();
        document.addEventListener('hrs:themechange', listener);

        setTheme('dark');

        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
        expect(localStorage.getItem('hrsTheme')).toBe('dark');
        expect(currentTheme()).toBe('dark');
        expect(listener).toHaveBeenCalledOnce();
        document.removeEventListener('hrs:themechange', listener);
    });

    it('toggles between light and dark', () => {
        toggleTheme();
        expect(currentTheme()).toBe('dark');
        toggleTheme();
        expect(currentTheme()).toBe('light');
    });
});

describe('cssVar', () => {
    it('reads a design token from the root element', () => {
        document.documentElement.style.setProperty('--hrs-test-token', ' #123456 ');
        expect(cssVar('--hrs-test-token', '#000')).toBe('#123456');
    });

    it('falls back when the token is not defined', () => {
        expect(cssVar('--hrs-missing', '#abcdef')).toBe('#abcdef');
    });
});
