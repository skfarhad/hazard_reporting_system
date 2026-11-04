import { describe, it, expect } from 'vitest';
import {
    readBoundaryFile, districtRowHtml, thanaRowHtml, divisionOptions, placeEditorHtml,
} from './locations-views.js';

const POLYGON = { type: 'Polygon', coordinates: [[[91.3, 23.1], [91.5, 23.1], [91.5, 23.3], [91.3, 23.3], [91.3, 23.1]]] };
const MULTI = { type: 'MultiPolygon', coordinates: [POLYGON.coordinates] };
const feature = (geometry) => ({ type: 'Feature', properties: { name: 'Feni' }, geometry });

function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
}

describe('reading a boundary file', () => {
    it('accepts a Polygon or MultiPolygon, bare, in a Feature, or as the only feature of a collection', () => {
        expect(readBoundaryFile(JSON.stringify(POLYGON))).toEqual({ geometry: POLYGON });
        expect(readBoundaryFile(JSON.stringify(MULTI))).toEqual({ geometry: MULTI });
        expect(readBoundaryFile(JSON.stringify(feature(POLYGON)))).toEqual({ geometry: POLYGON });
        expect(readBoundaryFile(JSON.stringify({ type: 'FeatureCollection', features: [feature(MULTI)] })))
            .toEqual({ geometry: MULTI });
    });

    it('explains what is wrong with anything else', () => {
        const cases = [
            ['not json', /not valid GeoJSON/],
            [JSON.stringify({ type: 'Point', coordinates: [91.4, 23.2] }), /Polygon or MultiPolygon/],
            [JSON.stringify(feature(null)), /Polygon or MultiPolygon/],
            [JSON.stringify({ type: 'FeatureCollection', features: [feature(POLYGON), feature(POLYGON)] }), /one area/],
            [JSON.stringify({ type: 'FeatureCollection', features: [] }), /one area/],
            [JSON.stringify({ type: 'Polygon' }), /coordinates/],
            ['null', /not valid GeoJSON/],
        ];
        cases.forEach(([text, message]) => {
            const result = readBoundaryFile(text);
            expect(result.geometry).toBeUndefined();
            expect(result.error).toMatch(message);
        });
    });
});

describe('place rows', () => {
    const FENI = {
        id: 1, name: 'Feni', division: { id: 2, name: 'Chattogram' }, has_boundary: true,
        thana_count: 6, incident_count: 12, volunteer_count: 4,
    };

    it('a district row shows its division, counts and boundary, and can open its thanas or be edited', () => {
        const row = el(districtRowHtml(FENI, { open: true, selected: true }));
        const text = row.textContent.replace(/\s+/g, ' ');

        ['Feni', 'Chattogram', '6 thanas', '12 incidents', '4 volunteers', 'Boundary set'].forEach((v) => expect(text).toContain(v));
        expect(row.querySelector('[data-action="toggle-thanas"]').getAttribute('aria-expanded')).toBe('true');
        expect(row.querySelector('[data-action="edit-place"]').dataset.kind).toBe('district');
        expect(row.classList.contains('is-selected')).toBe(true);
        expect(el(districtRowHtml({ ...FENI, has_boundary: false, thana_count: 1 })).textContent).toContain('No boundary');
        expect(el(districtRowHtml({ ...FENI, thana_count: 1 })).textContent).toContain('1 thana');
    });

    it('a thana row shows its counts and boundary', () => {
        const row = el(thanaRowHtml({ id: 10, name: 'Parshuram', has_boundary: false, incident_count: 1, volunteer_count: 0 }));

        expect(row.textContent).toContain('Parshuram');
        expect(row.textContent).toContain('1 incident');
        expect(row.textContent).toContain('0 volunteers');
        expect(row.querySelector('[data-action="edit-place"]').dataset.kind).toBe('thana');
    });

    it('escapes place names', () => {
        const html = districtRowHtml({ ...FENI, name: '<b>x</b>', division: { id: 1, name: '<i>y</i>' } })
            + thanaRowHtml({ id: 1, name: '<u>z</u>' }) + divisionOptions([{ id: 1, name: '<s>d</s>' }], '');

        ['<b>x', '<i>y', '<u>z', '<s>d'].forEach((bad) => expect(html).not.toContain(bad));
    });

    it('lists divisions for the add-district form', () => {
        const select = document.createElement('select');
        select.innerHTML = divisionOptions([{ id: 1, name: 'Chattogram' }, { id: 2, name: 'Sylhet' }], '2');

        expect([...select.options].map((o) => o.value)).toEqual(['', '1', '2']);
        expect(select.value).toBe('2');
    });
});

describe('place editor', () => {
    it('edits the name, uploads or clears the boundary, and deletes, naming what it edits', () => {
        const box = el(`<div>${placeEditorHtml({ id: 1, name: 'Feni', boundary: MULTI }, 'district')}</div>`);

        expect(box.querySelector('h2').textContent).toContain('Feni');
        expect(box.querySelector('input[name="name"]').value).toBe('Feni');
        expect(box.querySelector('input[type="file"]').getAttribute('accept')).toContain('.geojson');
        expect(box.querySelector('[data-action="clear-boundary"]').disabled).toBe(false);
        expect(box.querySelector('[data-action="delete-place"]').textContent).toContain('Delete district');
        expect(el(`<div>${placeEditorHtml({ id: 1, name: 'P', boundary: null }, 'thana')}</div>`)
            .querySelector('[data-action="clear-boundary"]').disabled).toBe(true);
    });

    it('escapes the name in the editor', () => {
        expect(placeEditorHtml({ id: 1, name: '"><img src=x>', boundary: null }, 'thana')).not.toContain('"><img');
    });
});
