import { describe, it, expect, vi } from 'vitest';
import { legendHtml, legendInitiallyOpen, addLegend } from './map-legend.js';
import { LEGEND_STORAGE_KEY } from './constants.js';

const NEED_TYPES = [
    { code: 'rescue', label_en: 'Rescue', icon: 'life-preserver', colour: '#DC2626', is_fallback: false },
    { code: 'food', label_en: 'Food', icon: 'basket', colour: '#D97706', is_fallback: false },
];

function fakeLeaflet() {
    return {
        control: vi.fn((options) => ({
            options,
            addTo(map) { this.container = this.onAdd(map); return this; },
            getContainer() { return this.container; },
        })),
        DomEvent: { disableClickPropagation: vi.fn(), disableScrollPropagation: vi.fn() },
    };
}

function memoryStorage(initial = {}) {
    const data = { ...initial };
    return {
        data,
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => { data[key] = String(value); },
    };
}

describe('legend content', () => {
    it('lists every need type with its icon and label', () => {
        const html = legendHtml(NEED_TYPES);

        expect(html).toContain('bi-life-preserver');
        expect(html).toContain('Rescue');
        expect(html).toContain('bi-basket');
        expect(html).toContain('--hrs-pin-fill:#D97706');
    });

    it('leaves out the needs section when need types could not be loaded', () => {
        expect(legendHtml([])).not.toContain('Needs');
    });

    it('explains pin outlines for each status, rejected as faded, life-threatening and volunteers', () => {
        const html = legendHtml(NEED_TYPES);

        ['Pending', 'Validated', 'Rejected (faded)', 'Life-threatening', 'Volunteer'].forEach((label) => {
            expect(html).toContain(label);
        });
        expect(html).toContain('hrs-pin--rejected');
    });

    it('escapes labels and ignores unsafe icons and colours', () => {
        const html = legendHtml([{ code: 'x', label_en: '<b>X</b>', icon: '"><script>', colour: 'url(x)' }]);

        expect(html).toContain('&lt;b&gt;X&lt;/b&gt;');
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('url(x)');
    });
});

describe('legend initial state', () => {
    it('starts open on wide screens and collapsed on narrow ones', () => {
        expect(legendInitiallyOpen(null, true)).toBe(true);
        expect(legendInitiallyOpen(null, false)).toBe(false);
    });

    it('a remembered choice wins over the screen width', () => {
        expect(legendInitiallyOpen('false', true)).toBe(false);
        expect(legendInitiallyOpen('true', false)).toBe(true);
    });
});

describe('addLegend', () => {
    it('toggling collapses and expands the body, updates aria-expanded and saves the choice', () => {
        const L = fakeLeaflet();
        const storage = memoryStorage();

        const legend = addLegend(L, {}, NEED_TYPES, { storage, isWide: true });
        const button = legend.querySelector('button');
        const body = legend.querySelector('.hrs-map-legend-body');

        expect(L.control).toHaveBeenCalledWith({ position: 'bottomright' });
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(button.getAttribute('aria-controls')).toBe(body.id);
        expect(body.hidden).toBe(false);

        button.click();
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(body.hidden).toBe(true);
        expect(storage.data[LEGEND_STORAGE_KEY]).toBe('false');

        button.click();
        expect(body.hidden).toBe(false);
        expect(storage.data[LEGEND_STORAGE_KEY]).toBe('true');
    });

    it('starts collapsed when that was the remembered choice', () => {
        const legend = addLegend(fakeLeaflet(), {}, NEED_TYPES,
            { storage: memoryStorage({ [LEGEND_STORAGE_KEY]: 'false' }), isWide: true });

        expect(legend.querySelector('.hrs-map-legend-body').hidden).toBe(true);
    });

    it('does not pass clicks or scrolling on the legend through to the map', () => {
        const L = fakeLeaflet();

        const legend = addLegend(L, {}, NEED_TYPES, { storage: memoryStorage(), isWide: true });

        expect(L.DomEvent.disableClickPropagation).toHaveBeenCalledWith(legend);
        expect(L.DomEvent.disableScrollPropagation).toHaveBeenCalledWith(legend);
    });

    it('keeps working when the browser refuses storage', () => {
        const storage = {
            getItem: () => { throw new Error('blocked'); },
            setItem: () => { throw new Error('blocked'); },
        };

        const legend = addLegend(fakeLeaflet(), {}, NEED_TYPES, { storage, isWide: false });
        const button = legend.querySelector('button');

        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(() => button.click()).not.toThrow();
        expect(button.getAttribute('aria-expanded')).toBe('true');
    });
});
