import { describe, it, expect } from 'vitest';
import {
    needIcons, hazardLabel, urgencyBadge, locationText, incidentTableRow, incidentCard,
    needChips, eventHazardOptions, pagerHtml, incidentDetailsHtml,
    statusActionsHtml, editFormHtml, formToPatch, showFieldErrors, editableEvents,
} from './incident-views.js';

export const NEED_TYPES = [
    { code: 'rescue', label_en: 'Rescue', icon: 'life-preserver', colour: '#DC2626', is_fallback: false },
    { code: 'medical', label_en: 'Medical', icon: 'heart-pulse', colour: '#DB2777', is_fallback: false },
    { code: 'food', label_en: 'Food', icon: 'basket', colour: '#D97706', is_fallback: false },
    { code: 'other', label_en: 'Other', icon: 'question-circle', colour: '#64748B', is_fallback: true },
];

const FLOOD = { code: 'flood', label_en: 'Flood', icon: 'water', colour: '#0284C7' };

export const INCIDENT = {
    id: 12,
    description: '5 people on roof, one injured',
    address: 'Govt. Primary School',
    contact_number: '01712345678',
    validation_status: 'validated',
    task_status: 'open',
    needs: ['medical', 'rescue'],
    life_threatening: true,
    people_count: 5,
    event: { id: 3, name: 'Feni Flood', hazard: FLOOD },
    latitude: 23.21,
    longitude: 91.43,
    created_at: '2026-11-04T11:19:00Z',
};

function el(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
}

function table(rowHtml) {
    const t = document.createElement('table');
    t.innerHTML = `<tbody>${rowHtml}</tbody>`;
    return t.querySelector('tr');
}

describe('incident cells', () => {
    it("shows each need's icon in need-type order with its label for screen readers", () => {
        const icons = el(needIcons(INCIDENT, NEED_TYPES));

        const classes = [...icons.querySelectorAll('i')].map((i) => i.className);
        expect(classes[0]).toContain('bi-life-preserver');
        expect(classes[1]).toContain('bi-heart-pulse');
        expect(icons.textContent).toContain('Rescue');
        expect(icons.textContent).toContain('Medical');
        expect(icons.querySelector('[style*="--hrs-pin-fill:#DC2626"]')).not.toBeNull();
    });

    it('shows the fallback need when the incident has no known need', () => {
        expect(el(needIcons({ needs: [] }, NEED_TYPES)).textContent).toContain('Other');
    });

    it('shows the event with its hazard icon and label, or No event', () => {
        const html = hazardLabel(INCIDENT.event);

        expect(html).toContain('Feni Flood');
        expect(html).toContain('Flood');
        expect(html).toContain('bi-water');
        expect(hazardLabel(null)).toContain('No event');
    });

    it('marks life-threatening incidents and shows the people count', () => {
        expect(urgencyBadge(INCIDENT)).toContain('Life-threatening');
        expect(urgencyBadge(INCIDENT)).toContain('5 people');
        expect(urgencyBadge({ life_threatening: false, people_count: 1 })).toContain('1 person');
        expect(urgencyBadge({ life_threatening: false, people_count: null })).toBe('');
    });

    it('describes the place by thana and district when known, otherwise the address', () => {
        expect(locationText({ address: 'School', thana: 'Parshuram', district: 'Feni' })).toBe('Parshuram, Feni');
        expect(locationText({ address: 'School' })).toBe('School');
    });
});

describe('table row and card', () => {
    it('a table row can be opened by click or keyboard and carries the incident id', () => {
        const row = table(incidentTableRow(INCIDENT, NEED_TYPES));

        expect(row.dataset.incidentId).toBe('12');
        expect(row.getAttribute('tabindex')).toBe('0');
        expect(row.getAttribute('aria-label')).toContain('Open incident 12');
        expect(row.textContent).toContain('5 people on roof');
        expect(row.textContent).toContain('Feni Flood');
        expect(row.textContent).toContain('validated');
    });

    it('a card shows needs, urgency, status, message, place, event and time', () => {
        const card = el(incidentCard(INCIDENT, NEED_TYPES));

        expect(card.dataset.incidentId).toBe('12');
        expect(card.tagName).toBe('BUTTON');
        ['Rescue', 'Life-threatening', '5 people', 'validated', '5 people on roof', 'Govt. Primary School', 'Feni Flood']
            .forEach((text) => expect(card.textContent).toContain(text));
        expect(card.querySelector('time')).not.toBeNull();
    });

    it('all incident text is escaped and unsafe icons or colours are ignored', () => {
        const evil = {
            ...INCIDENT,
            description: '<img src=x onerror=alert(1)>',
            address: '<b>here</b>',
            event: { id: 1, name: '<script>', hazard: { code: 'x', label_en: '<i>', icon: '"><svg>', colour: 'url(x)' } },
        };
        const html = incidentTableRow(evil, NEED_TYPES) + incidentCard(evil, NEED_TYPES);

        expect(html).not.toContain('<img');
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<b>here');
        expect(html).not.toContain('"><svg>');
        expect(html).not.toContain('url(x)');
    });
});

describe('source', () => {
    it('web reports show a Web badge in rows and cards', () => {
        const web = { ...INCIDENT, source: 'web' };

        expect(table(incidentTableRow(web, NEED_TYPES)).querySelector('.hrs-badge-web')).not.toBeNull();
        expect(el(incidentCard(web, NEED_TYPES)).querySelector('.hrs-badge-web')).not.toBeNull();
        expect(table(incidentTableRow({ ...INCIDENT, source: 'provider' }, NEED_TYPES)).querySelector('.hrs-badge-web')).toBeNull();
    });
});

describe('filter bar and pager', () => {
    it('need chips show which needs are selected', () => {
        const wrap = el(`<div>${needChips(NEED_TYPES, ['food'])}</div>`);
        const chips = [...wrap.querySelectorAll('button[data-need]')];

        expect(chips.map((c) => c.dataset.need)).toEqual(['rescue', 'medical', 'food', 'other']);
        expect(chips.find((c) => c.dataset.need === 'food').getAttribute('aria-pressed')).toBe('true');
        expect(chips.find((c) => c.dataset.need === 'rescue').getAttribute('aria-pressed')).toBe('false');
        expect(chips[0].querySelector('.bi-life-preserver')).not.toBeNull();
    });

    it('the event/hazard dropdown groups events and hazards and keeps the current choice', () => {
        const events = [
            { id: 3, name: 'Feni Flood', hazard: FLOOD },
            { id: 4, name: 'Sylhet Flood', hazard: FLOOD },
            { id: 5, name: 'Dhaka Fire', hazard: { code: 'fire', label_en: 'Fire', icon: 'fire', colour: '#DC2626' } },
        ];
        const select = el(`<select>${eventHazardOptions(events, 'hazard:flood')}</select>`);

        expect([...select.options].slice(0, 2).map((o) => o.value)).toEqual(['', 'event:none']);
        const groups = [...select.querySelectorAll('optgroup')];
        expect(groups.map((g) => g.label)).toEqual(['Events', 'Hazards']);
        expect([...groups[0].children].map((o) => o.value)).toEqual(['event:3', 'event:4', 'event:5']);
        expect([...groups[1].children].map((o) => o.value)).toEqual(['hazard:fire', 'hazard:flood']);
        expect(select.value).toBe('hazard:flood');
    });

    it('the pager disables Prev on the first page and Next on the last', () => {
        const first = el(pagerHtml(1, 3));
        const last = el(pagerHtml(3, 3));

        expect(first.querySelector('[data-page="prev"]').disabled).toBe(true);
        expect(first.querySelector('[data-page="next"]').disabled).toBe(false);
        expect(first.querySelector('[aria-current="page"]').textContent.trim()).toBe('1');
        expect(last.querySelector('[data-page="next"]').disabled).toBe(true);
        expect(pagerHtml(1, 1)).toBe('');
    });
});

describe('details', () => {
    const DETAIL = {
        ...INCIDENT,
        district: 'Feni',
        thana: 'Parshuram',
        provider: 'Smoke Test Gateway',
        volunteer: { id: 4, full_name: 'Rahim Uddin' },
        updated_at: '2026-11-04T12:00:00Z',
    };

    it('the details show every field and a Google Maps link only when there are coordinates', () => {
        const box = el(`<div>${incidentDetailsHtml(DETAIL, NEED_TYPES)}</div>`);
        const text = box.textContent;

        ['5 people on roof, one injured', 'Rescue', 'Medical', 'Life-threatening', '5 people', 'Feni Flood', 'Flood',
            'Govt. Primary School', 'Parshuram', 'Feni', '23.21000, 91.43000', '01712345678', 'validated', 'open',
            'Rahim Uddin', 'Smoke Test Gateway'].forEach((value) => expect(text).toContain(value));
        expect(box.querySelector('a[href="tel:01712345678"]')).not.toBeNull();
        expect(box.querySelector('a[href="https://www.google.com/maps?q=23.21,91.43"]').target).toBe('_blank');
        expect(box.querySelectorAll('time')).toHaveLength(2);

        const noPlace = el(`<div>${incidentDetailsHtml({ ...DETAIL, latitude: null, longitude: null, volunteer: null }, NEED_TYPES)}</div>`);
        expect(noPlace.querySelector('a[href*="google.com/maps"]')).toBeNull();
        expect(noPlace.textContent).toContain('No location');
        expect(noPlace.textContent).toContain('Not assigned');
    });

    it('does not repeat a thana or district that the address already names', () => {
        const box = el(`<div>${incidentDetailsHtml({ ...DETAIL, address: 'Govt. Primary School, Parshuram' }, NEED_TYPES)}</div>`);

        expect(box.textContent).toContain('Govt. Primary School, Parshuram, Feni');
        expect(box.textContent).not.toContain('Parshuram, Parshuram');
    });

    it('the details name the reporter of a web report, or the provider', () => {
        const web = el(`<div>${incidentDetailsHtml({ ...DETAIL, source: 'web', provider: null, reported_by: { id: 2, name: '<b>Karim</b>' } }, NEED_TYPES)}</div>`);
        const sms = el(`<div>${incidentDetailsHtml({ ...DETAIL, source: 'provider', reported_by: null }, NEED_TYPES)}</div>`);

        expect(web.textContent).toContain('Web · reported by <b>Karim</b>');
        expect(web.innerHTML).not.toContain('<b>Karim');
        expect(sms.textContent).toContain('SMS · Smoke Test Gateway');
    });

    it('escapes every text field in the details', () => {
        const html = incidentDetailsHtml({ ...DETAIL, description: '<script>x</script>', provider: '<b>p</b>',
            volunteer: { id: 1, full_name: '<i>v</i>' }, contact_number: '"><img>' }, NEED_TYPES);

        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<b>p');
        expect(html).not.toContain('<i>v');
        expect(html).not.toContain('"><img>');
    });
});

describe('quick actions', () => {
    const EVENTS = [
        { id: 3, name: 'Feni Flood', hazard: FLOOD, started_at: '2026-11-01T00:00:00Z', ended_at: null },
        { id: 4, name: 'Old Cyclone', hazard: FLOOD, started_at: '2025-05-01T00:00:00Z', ended_at: '2025-05-10T00:00:00Z' },
        { id: 5, name: 'Old Fire', hazard: FLOOD, started_at: '2025-01-01T00:00:00Z', ended_at: '2025-01-02T00:00:00Z' },
    ];

    function form(incident = INCIDENT) {
        const wrap = document.createElement('div');
        wrap.innerHTML = editFormHtml(incident, NEED_TYPES, editableEvents(EVENTS, incident.event?.id ?? null, new Date('2026-11-04T12:00:00Z')));
        document.body.replaceChildren(wrap);
        return wrap.querySelector('form');
    }

    it('offers the status changes the incident is not already in', () => {
        const box = el(`<div>${statusActionsHtml({ validation_status: 'pending' })}</div>`);
        const actions = [...box.querySelectorAll('button[data-status]')].map((b) => b.dataset.status);

        expect(actions).toEqual(['validated', 'rejected']);
        expect([...el(`<div>${statusActionsHtml({ validation_status: 'validated' })}</div>`).querySelectorAll('button[data-status]')]
            .map((b) => b.dataset.status)).toEqual(['pending', 'rejected']);
    });

    it('offers active events plus the incident\'s current event, never other ended ones', () => {
        const now = new Date('2026-11-04T12:00:00Z');

        expect(editableEvents(EVENTS, null, now).map((e) => e.id)).toEqual([3]);
        expect(editableEvents(EVENTS, 4, now).map((e) => e.id)).toEqual([3, 4]);
    });

    it('the edit form is pre-filled from the incident and turns back into a PATCH body', () => {
        const f = form();

        expect([...f.querySelectorAll('input[name="needs"]:checked')].map((i) => i.value)).toEqual(['rescue', 'medical']);
        expect(f.elements.life_threatening.checked).toBe(true);
        expect(f.elements.people_count.value).toBe('5');
        expect(f.elements.event.value).toBe('3');
        expect(f.elements.task_status.value).toBe('open');

        f.querySelector('input[name="needs"][value="food"]').checked = true;
        f.elements.life_threatening.checked = false;
        f.elements.people_count.value = '';
        f.elements.event.value = '';
        f.elements.task_status.value = 'closed';

        expect(formToPatch(f)).toEqual({
            body: { needs: ['rescue', 'medical', 'food'], life_threatening: false, people_count: null, event: null, task_status: 'closed' },
            errors: {},
        });

        f.elements.event.value = '3';
        f.elements.people_count.value = '0';
        expect(formToPatch(f).body).toMatchObject({ event: 3, people_count: 0 });
    });

    it('a PATCH body always has at least one need, otherwise the form reports it', () => {
        const f = form();
        f.querySelectorAll('input[name="needs"]').forEach((i) => { i.checked = false; });

        expect(formToPatch(f).errors).toEqual({ needs: ['Pick at least one need.'] });
    });

    it('rejects a negative or fractional people count before sending', () => {
        const f = form();
        f.elements.people_count.value = '-2';

        expect(formToPatch(f).errors.people_count).toEqual(['Enter a whole number, 0 or more.']);
    });

    it('server field errors are shown next to the right fields', () => {
        const f = form();

        showFieldErrors(f, { people_count: ['Ensure this value is greater than or equal to 0.'], needs: ['Bad need'] });

        const count = f.elements.people_count;
        expect(count.classList.contains('is-invalid')).toBe(true);
        const message = document.getElementById(count.getAttribute('aria-describedby'));
        expect(message.textContent).toContain('greater than or equal to 0');
        expect(f.querySelector('[data-error-for="needs"]').textContent).toContain('Bad need');

        showFieldErrors(f, {});
        expect(count.classList.contains('is-invalid')).toBe(false);
        expect(f.querySelector('[data-error-for="needs"]').textContent).toBe('');
    });

    it('errors for fields the form does not have are shown at the top of the form', () => {
        const f = form();

        showFieldErrors(f, { detail: 'Not allowed', non_field_errors: ['Conflict'] });

        expect(f.querySelector('[data-error-for="form"]').textContent).toContain('Not allowed');
        expect(f.querySelector('[data-error-for="form"]').textContent).toContain('Conflict');
    });
});
