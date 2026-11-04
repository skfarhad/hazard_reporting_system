import { describe, it, expect } from 'vitest';
import {
    PANELS_STORAGE_KEY, readPanels, savePanels, togglePanel, applyPanels, setMobileTab,
} from './dashboard-layout.js';

function memoryStorage(initial = {}) {
    const data = { ...initial };
    return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };

function page() {
    document.body.innerHTML = `
        <div class="hrs-dashboard">
            <aside data-panel="incidents"><button data-toggle-panel="incidents"></button></aside>
            <aside data-panel="volunteers"><button data-toggle-panel="volunteers"></button></aside>
            <nav><button data-mobile-tab="incidents"></button><button data-mobile-tab="map"></button>
                 <button data-mobile-tab="volunteers"></button></nav>
        </div>`;
    return document.querySelector('.hrs-dashboard');
}

describe('collapsed side panels', () => {
    it('both panels are open unless the operator collapsed them before', () => {
        expect(readPanels(memoryStorage())).toEqual({ incidents: false, volunteers: false });
        expect(readPanels(memoryStorage({ [PANELS_STORAGE_KEY]: '{"volunteers":true}' })))
            .toEqual({ incidents: false, volunteers: true });
    });

    it('remembers the choice and survives blocked or broken storage', () => {
        const storage = memoryStorage();
        savePanels(storage, togglePanel({ incidents: false, volunteers: false }, 'incidents'));

        expect(readPanels(storage)).toEqual({ incidents: true, volunteers: false });
        expect(readPanels(broken)).toEqual({ incidents: false, volunteers: false });
        expect(() => savePanels(broken, { incidents: true, volunteers: true })).not.toThrow();
        expect(readPanels(memoryStorage({ [PANELS_STORAGE_KEY]: 'not json' }))).toEqual({ incidents: false, volunteers: false });
    });

    it('marks collapsed panels and tells screen readers whether each toggle is expanded', () => {
        const root = page();

        applyPanels(root, { incidents: true, volunteers: false });

        expect(root.querySelector('[data-panel="incidents"]').classList.contains('is-collapsed')).toBe(true);
        expect(root.querySelector('[data-panel="volunteers"]').classList.contains('is-collapsed')).toBe(false);
        expect(root.querySelector('[data-toggle-panel="incidents"]').getAttribute('aria-expanded')).toBe('false');
        expect(root.querySelector('[data-toggle-panel="volunteers"]').getAttribute('aria-expanded')).toBe('true');
        expect(root.classList.contains('hrs-dashboard--no-incidents')).toBe(true);
    });
});

describe('phone tabs', () => {
    it('shows one of incidents, map or volunteers and marks its tab selected', () => {
        const root = page();

        setMobileTab(root, 'volunteers');

        expect(root.dataset.mobileTab).toBe('volunteers');
        expect([...root.querySelectorAll('[data-mobile-tab]')].map((b) => b.getAttribute('aria-selected')))
            .toEqual(['false', 'false', 'true']);
        setMobileTab(root, 'nonsense');
        expect(root.dataset.mobileTab).toBe('map');
    });
});
