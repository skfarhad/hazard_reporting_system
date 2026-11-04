import { describe, it, expect } from 'vitest';
import {
    normalisePhone, insideBangladesh, reportFormHtml, readReportForm, thanaOptions, districtOptions, setLocation,
} from './report-form.js';

const NEED_TYPES = [
    { code: 'rescue', label_en: 'Rescue', icon: 'life-preserver', colour: '#DC2626' },
    { code: 'food', label_en: 'Food', icon: 'basket', colour: '#D97706' },
];
const PLACES = [
    { id: 1, name: 'Feni', thanas: [{ id: 10, name: 'Parshuram' }, { id: 11, name: 'Sonagazi' }] },
    { id: 2, name: 'Sylhet', thanas: [{ id: 20, name: 'Companiganj' }] },
];

function form({ phone = '' } = {}) {
    const wrap = document.createElement('div');
    wrap.innerHTML = reportFormHtml(NEED_TYPES, PLACES, { phone });
    document.body.replaceChildren(wrap);
    return wrap.querySelector('form');
}

function fill(f) {
    f.elements.description.value = '  5 people on roof  ';
    f.elements.address.value = 'Govt. Primary School';
    f.elements.contact_number.value = '+880 1712-345678';
    setLocation(f, { lat: 23.21, lng: 91.43 });
    return f;
}

describe('phone and place checks', () => {
    it('normalises Bangladeshi mobile numbers and rejects anything else', () => {
        expect(normalisePhone('01712345678')).toBe('01712345678');
        expect(normalisePhone('+880 1712-345678')).toBe('01712345678');
        expect(normalisePhone('8801912345678')).toBe('01912345678');
        ['', '12345', '0171234567', '01212345678', '02123456789', '017123456789', 'abc01712345678']
            .forEach((bad) => expect(normalisePhone(bad)).toBeNull());
    });

    it('knows whether a point is inside Bangladesh', () => {
        expect(insideBangladesh(23.21, 91.43)).toBe(true);
        expect(insideBangladesh(51.5, -0.12)).toBe(false);
        expect(insideBangladesh(22.0, 94.0)).toBe(false); // Bangladesh's latitude, but in Myanmar
        expect(insideBangladesh(24.0, 86.0)).toBe(false); // and in India
        expect(insideBangladesh(NaN, 90)).toBe(false);
    });
});

describe('report form', () => {
    it('reads the form into a request body with the chosen needs, place and location', () => {
        const f = fill(form());
        f.querySelector('input[name="needs"][value="rescue"]').checked = true;
        f.elements.life_threatening.checked = true;
        f.elements.people_count.value = '5';
        f.elements.district.value = '1';
        f.elements.thana.innerHTML = thanaOptions(PLACES, 1, '');
        f.elements.thana.value = '10';

        expect(readReportForm(f)).toEqual({
            body: {
                description: '5 people on roof',
                address: 'Govt. Primary School',
                contact_number: '01712345678',
                latitude: 23.21,
                longitude: 91.43,
                needs: ['rescue'],
                life_threatening: true,
                people_count: 5,
                district: 1,
                thana: 10,
            },
            errors: {},
        });
    });

    it('leaves needs out when none are picked, so the server reads them from the message', () => {
        const { body } = readReportForm(fill(form()));

        expect(body).not.toHaveProperty('needs');
        expect(body).toMatchObject({ people_count: null, district: null, thana: null, life_threatening: false });
    });

    it('reports missing message, address, location and contact before sending', () => {
        const { errors } = readReportForm(form());

        expect(Object.keys(errors).sort()).toEqual(['address', 'contact_number', 'description', 'latitude']);
    });

    it('rejects a bad contact number and a location outside Bangladesh', () => {
        const f = fill(form());
        f.elements.contact_number.value = '12345';
        setLocation(f, { lat: 51.5, lng: -0.12 });

        expect(Object.keys(readReportForm(f).errors).sort()).toEqual(['contact_number', 'latitude']);
    });

    it('rejects a negative or fractional people count', () => {
        const f = fill(form());
        f.elements.people_count.value = '-1';
        expect(readReportForm(f).errors.people_count).toBeDefined();
        f.elements.people_count.value = '2.5';
        expect(readReportForm(f).errors.people_count).toBeDefined();
    });

    it('lists only the chosen district\'s thanas', () => {
        const box = document.createElement('select');
        box.innerHTML = thanaOptions(PLACES, 1, 11);

        expect([...box.options].map((o) => o.value)).toEqual(['', '10', '11']);
        expect(box.value).toBe('11');
        box.innerHTML = thanaOptions(PLACES, '', '');
        expect([...box.options].map((o) => o.value)).toEqual(['']);
    });

    it('pre-fills the contact number from the profile phone', () => {
        expect(form({ phone: '01812345678' }).elements.contact_number.value).toBe('01812345678');
        expect(form().elements.contact_number.value).toBe('');
    });

    it('escapes need, district and thana names', () => {
        const evil = [{ id: 1, name: '<b>D</b>', thanas: [{ id: 2, name: '<i>T</i>' }] }];
        const html = reportFormHtml([{ code: 'x', label_en: '<script>', icon: '"><img>', colour: 'url(x)' }], evil, { phone: '"><img>' })
            + districtOptions(evil, '') + thanaOptions(evil, 1, '');

        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<b>D');
        expect(html).not.toContain('<i>T');
        expect(html).not.toContain('"><img>');
        expect(html).not.toContain('url(x)');
    });
});
