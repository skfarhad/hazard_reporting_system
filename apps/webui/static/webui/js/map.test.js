import { describe, it, expect, vi } from 'vitest';
import { hasCoordinates, incidentMarkerColor, incidentPopup, drawMarkers, createMap } from './map.js';
import { STATUS_COLORS } from './constants.js';

describe('map helpers', () => {
    it('only plots items with numeric coordinates', () => {
        expect(hasCoordinates({ latitude: 23.8, longitude: 90.4 })).toBe(true);
        expect(hasCoordinates({ latitude: null, longitude: null })).toBe(false);
        expect(hasCoordinates({ latitude: '23.8', longitude: '90.4' })).toBe(false);
    });

    it('colours incidents by validation status, defaulting to pending', () => {
        expect(incidentMarkerColor('validated')).toBe(STATUS_COLORS.validated);
        expect(incidentMarkerColor('unknown')).toBe(STATUS_COLORS.pending);
    });

    it('escapes popup text', () => {
        expect(incidentPopup({ description: '<b>x</b>', address: '', contact_number: '', validation_status: 'pending' }))
            .toContain('&lt;b&gt;x&lt;/b&gt;');
    });
});

describe('drawMarkers', () => {
    function fakeLeaflet() {
        const marker = { bindPopup: vi.fn().mockReturnThis() };
        const layer = { addTo: vi.fn().mockReturnThis() };
        return {
            circleMarker: vi.fn(() => marker),
            layerGroup: vi.fn(() => layer),
            control: { layers: vi.fn(() => ({ addTo: vi.fn() })) },
        };
    }

    it('skips items without coordinates and zooms to the rest', () => {
        const L = fakeLeaflet();
        const map = { fitBounds: vi.fn() };

        drawMarkers(L, map,
            [{ latitude: 23.8, longitude: 90.4, validation_status: 'pending' }, { latitude: null, longitude: null }],
            [{ latitude: 24.9, longitude: 91.9 }]);

        expect(L.circleMarker).toHaveBeenCalledTimes(2);
        expect(map.fitBounds).toHaveBeenCalledWith([[23.8, 90.4], [24.9, 91.9]], expect.any(Object));
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
