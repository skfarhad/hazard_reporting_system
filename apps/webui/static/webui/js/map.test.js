import { describe, it, expect, vi } from 'vitest';
import {
    hasCoordinates, incidentPopup, drawMarkers, createMap, primaryNeed,
    safeIcon, safeColour, incidentPinHtml, incidentIcon,
} from './map.js';

describe('map helpers', () => {
    it('only plots items with numeric coordinates', () => {
        expect(hasCoordinates({ latitude: 23.8, longitude: 90.4 })).toBe(true);
        expect(hasCoordinates({ latitude: null, longitude: null })).toBe(false);
        expect(hasCoordinates({ latitude: '23.8', longitude: '90.4' })).toBe(false);
    });

    it('lists the need labels, life-threatening and people count in the popup', () => {
        const html = incidentPopup({
            description: 'roof', address: '', contact_number: '', validation_status: 'pending',
            needs: ['rescue', 'medical'], life_threatening: true, people_count: 5,
        }, NEED_TYPES);

        expect(html).toContain('Rescue, Medical');
        expect(html).toContain('Life-threatening');
        expect(html).toContain('5 people');
    });

    it('escapes popup text', () => {
        expect(incidentPopup({ description: '<b>x</b>', address: '', contact_number: '', validation_status: 'pending' }))
            .toContain('&lt;b&gt;x&lt;/b&gt;');
    });
});

export const NEED_TYPES = [
    { code: 'rescue', label_en: 'Rescue', icon: 'life-preserver', colour: '#DC2626', is_fallback: false },
    { code: 'medical', label_en: 'Medical', icon: 'heart-pulse', colour: '#DB2777', is_fallback: false },
    { code: 'food', label_en: 'Food', icon: 'basket', colour: '#D97706', is_fallback: false },
    { code: 'other', label_en: 'Other', icon: 'question-circle', colour: '#64748B', is_fallback: true },
];

describe('main need', () => {
    it('uses the highest-priority need in need-type order, whatever order the incident lists them', () => {
        expect(primaryNeed({ needs: ['food', 'rescue'] }, NEED_TYPES).code).toBe('rescue');
    });

    it('falls back to the fallback need type when the incident has no known need', () => {
        expect(primaryNeed({ needs: ['unknown'] }, NEED_TYPES).code).toBe('other');
        expect(primaryNeed({}, NEED_TYPES).code).toBe('other');
    });

    it('uses a generic question-mark need when need types could not be loaded', () => {
        const need = primaryNeed({ needs: ['rescue'] }, []);
        expect(need.icon).toBe('question-circle');
        expect(need.label_en).toBe('Unclassified');
    });
});

describe('safe icon and colour', () => {
    it('keeps plain Bootstrap icon names and #RRGGBB colours', () => {
        expect(safeIcon('life-preserver')).toBe('life-preserver');
        expect(safeColour('#DB2777')).toBe('#DB2777');
    });

    it('replaces anything else from the database with the generic icon and colour', () => {
        expect(safeIcon('"><script>')).toBe('question-circle');
        expect(safeIcon(undefined)).toBe('question-circle');
        expect(safeColour('red;background:url(x)')).toBe('#64748B');
        expect(safeColour('#abc')).toBe('#64748B');
    });

    it('rejects values that only start or end like a safe icon or colour', () => {
        expect(safeIcon('heart"><script>')).toBe('question-circle');
        expect(safeColour('#DB2777;background:url(x)')).toBe('#64748B');
        expect(safeColour('x;#DB2777')).toBe('#64748B');
    });
});

describe('pin markup', () => {
    it("fills the pin with the main need's colour and shows its icon", () => {
        const html = incidentPinHtml({ needs: ['medical'], validation_status: 'validated' }, NEED_TYPES);

        expect(html).toContain('--hrs-pin-fill:#DB2777');
        expect(html).toContain('bi-heart-pulse');
        expect(html).toContain('<svg');
    });

    it('marks the pin with its validation status, treating an unknown status as pending', () => {
        expect(incidentPinHtml({ needs: [], validation_status: 'rejected' }, NEED_TYPES)).toContain('hrs-pin--rejected');
        expect(incidentPinHtml({ needs: [], validation_status: 'weird' }, NEED_TYPES)).toContain('hrs-pin--pending');
    });

    it('shows how many further needs the incident has', () => {
        expect(incidentPinHtml({ needs: ['rescue', 'medical', 'food'] }, NEED_TYPES)).toContain('>+2<');
        expect(incidentPinHtml({ needs: ['rescue'] }, NEED_TYPES)).not.toContain('hrs-pin-count');
    });

    it('flags life-threatening incidents with an alert badge', () => {
        const urgent = incidentPinHtml({ needs: ['rescue'], life_threatening: true }, NEED_TYPES);
        const calm = incidentPinHtml({ needs: ['rescue'], life_threatening: false }, NEED_TYPES);

        expect(urgent).toContain('hrs-pin--urgent');
        expect(urgent).toContain('hrs-pin-alert');
        expect(calm).not.toContain('hrs-pin-alert');
    });

    it("names every need, life-threatening and the status in the pin's aria-label", () => {
        const html = incidentPinHtml(
            { needs: ['medical', 'rescue'], life_threatening: true, validation_status: 'pending' }, NEED_TYPES);

        expect(html).toContain('role="img"');
        expect(html).toContain('aria-label="Rescue, Medical, life-threatening, pending"');
    });

    it('never puts an unsafe icon name or colour from the database into the markup, and escapes labels', () => {
        const evil = [{ code: 'x', label_en: '<b>X</b>', icon: '"><script>', colour: 'red;background:url(x)', is_fallback: true }];
        const html = incidentPinHtml({ needs: ['x'] }, evil);

        expect(html).not.toContain('<script>');
        expect(html).not.toContain('url(x)');
        expect(html).toContain('&lt;b&gt;X&lt;/b&gt;');
    });
});

describe('incidentIcon', () => {
    it("anchors the pin's tip on the incident's point", () => {
        const L = { divIcon: vi.fn((opts) => opts) };
        const icon = incidentIcon(L, { needs: ['rescue'] }, NEED_TYPES);

        expect(icon.html).toContain('bi-life-preserver');
        expect(icon.className).toBe('hrs-pin-wrap');
        expect(icon.iconAnchor).toEqual([icon.iconSize[0] / 2, icon.iconSize[1]]);
    });
});

describe('drawMarkers', () => {
    function fakeLeaflet() {
        const makeMarker = () => ({ bindPopup: vi.fn().mockReturnThis(), on: vi.fn().mockReturnThis() });
        const layer = { addTo: vi.fn().mockReturnThis() };
        return {
            circleMarker: vi.fn(makeMarker),
            marker: vi.fn(makeMarker),
            divIcon: vi.fn((opts) => opts),
            layerGroup: vi.fn(() => layer),
            control: { layers: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })) },
        };
    }

    it('skips items without coordinates and zooms to the rest', () => {
        const L = fakeLeaflet();
        const map = { fitBounds: vi.fn() };

        drawMarkers(L, map,
            [{ latitude: 23.8, longitude: 90.4, validation_status: 'pending' }, { latitude: null, longitude: null }],
            [{ latitude: 24.9, longitude: 91.9 }]);

        expect(L.marker).toHaveBeenCalledTimes(1);
        expect(L.circleMarker).toHaveBeenCalledTimes(1);
        expect(map.fitBounds).toHaveBeenCalledWith([[23.8, 90.4], [24.9, 91.9]], expect.any(Object));
    });

    it('draws incidents as pins and volunteers as circles', () => {
        const L = fakeLeaflet();

        drawMarkers(L, { fitBounds: vi.fn() },
            [{ latitude: 23.8, longitude: 90.4, needs: ['medical'], validation_status: 'pending' }],
            [{ latitude: 24.9, longitude: 91.9 }], NEED_TYPES);

        expect(L.marker.mock.calls[0][1].icon.html).toContain('bi-heart-pulse');
        expect(L.circleMarker.mock.calls[0][0]).toEqual([24.9, 91.9]);
    });

    it('draws life-threatening incidents above the others', () => {
        const L = fakeLeaflet();

        drawMarkers(L, { fitBounds: vi.fn() }, [
            { latitude: 23.8, longitude: 90.4, life_threatening: true },
            { latitude: 23.9, longitude: 90.5, life_threatening: false },
        ], [], NEED_TYPES);

        const [urgent, calm] = L.marker.mock.calls.map(([, options]) => options.zIndexOffset);
        expect(urgent).toBeGreaterThan(calm);
    });

    it('returns what it drew so the page can remove it before drawing again', () => {
        const L = fakeLeaflet();

        const drawn = drawMarkers(L, { fitBounds: vi.fn() }, [], []);

        expect(drawn.layers).toHaveLength(3);
        drawn.layers.forEach((layer) => expect(layer).toBeDefined());
    });

    it('returns each incident and volunteer marker by id, so the page can open or pan to one', () => {
        const L = fakeLeaflet();

        const drawn = drawMarkers(L, { fitBounds: vi.fn() },
            [{ id: 7, latitude: 23.8, longitude: 90.4 }, { id: 8, latitude: null, longitude: null }],
            [{ id: 3, latitude: 24.9, longitude: 91.9, is_active: true }]);

        expect([...drawn.incidentMarkers.keys()]).toEqual([7]);
        expect(drawn.incidentMarkers.get(7)).toBe(L.marker.mock.results[0].value);
        expect([...drawn.volunteerMarkers.keys()]).toEqual([3]);
    });

    it('uses the page\'s popup and click handler for incidents when given', () => {
        const L = fakeLeaflet();
        const onIncidentClick = vi.fn();
        const incident = { id: 7, latitude: 23.8, longitude: 90.4 };

        drawMarkers(L, { fitBounds: vi.fn() }, [incident], [], NEED_TYPES, {
            incidentPopup: (i) => `card ${i.id}`, onIncidentClick,
        });
        const marker = L.marker.mock.results[0].value;
        const [event, handler] = marker.on.mock.calls[0];
        handler();

        expect(marker.bindPopup.mock.calls[0][0]).toBe('card 7');
        expect(event).toBe('click');
        expect(onIncidentClick).toHaveBeenCalledWith(incident);
    });

    it('passes the page\'s popup options on, e.g. padding that keeps popups clear of buttons over the map', () => {
        const L = fakeLeaflet();
        const popupOptions = { autoPanPaddingBottomRight: [20, 90] };

        drawMarkers(L, { fitBounds: vi.fn() }, [{ id: 1, latitude: 23.8, longitude: 90.4 }], [], [], { popupOptions });

        expect(L.marker.mock.results[0].value.bindPopup.mock.calls[0][1]).toBe(popupOptions);
    });

    it('can keep the current view instead of zooming to the markers', () => {
        const map = { fitBounds: vi.fn() };

        drawMarkers(fakeLeaflet(), map, [{ id: 1, latitude: 23.8, longitude: 90.4 }], [], [], { fit: false });

        expect(map.fitBounds).not.toHaveBeenCalled();
    });

    it('draws inactive volunteers grey and active ones in the volunteer colour', () => {
        const L = fakeLeaflet();

        drawMarkers(L, { fitBounds: vi.fn() }, [], [
            { id: 1, latitude: 24.9, longitude: 91.9, is_active: true },
            { id: 2, latitude: 24.8, longitude: 91.8, is_active: false },
        ]);

        const [active, inactive] = L.circleMarker.mock.calls.map(([, options]) => options.color);
        expect(active).toBe('#16A34A');
        expect(inactive).toBe('#94A3B8');
    });

    it('keeps the default view when nothing has coordinates', () => {
        const L = fakeLeaflet();
        const map = { fitBounds: vi.fn() };

        drawMarkers(L, map, [], []);

        expect(map.fitBounds).not.toHaveBeenCalled();
    });
});

describe('createMap', () => {
    it('requests OSM tiles from the single host and sends the site origin as referrer', () => {
        // OSM blocks tile requests without a Referer, and Django's default
        // Referrer-Policy (same-origin) strips it from cross-site requests.
        const tiles = { addTo: vi.fn() };
        const L = {
            map: vi.fn(() => ({ setView: vi.fn().mockReturnThis() })),
            tileLayer: vi.fn(() => tiles),
        };

        createMap(L, document.createElement('div'));

        const [url, options] = L.tileLayer.mock.calls[0];
        expect(url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
        expect(options.referrerPolicy).toBe('strict-origin-when-cross-origin');
    });
});
