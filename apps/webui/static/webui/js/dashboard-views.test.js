import { describe, it, expect } from 'vitest';
import {
    incidentTitle, cardDateParts, volunteerCountText, dashIncidentCard, incidentPopupCard, statCardsHtml,
    initials, avatarHtml, volunteerCard, zillaOptions, upazilaOptions,
} from './dashboard-views.js';

function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
}

const INCIDENT = {
    id: 12,
    description: 'Supporting line text lorem ipsum dolor sit amet, five people are on the roof and water is rising fast',
    address: 'Govt. Primary School',
    district: 'Feni',
    thana: 'Parshuram',
    validation_status: 'pending',
    task_status: 'open',
    volunteer_count: 8,
    latitude: 23.21,
    longitude: 91.43,
    created_at: '2026-08-22T11:30:00Z', // 17:30 in Bangladesh
};

describe('incident card text', () => {
    it('titles an incident by district and thana, falling back to what is known', () => {
        expect(incidentTitle(INCIDENT)).toBe('Feni-Parshuram Incident');
        expect(incidentTitle({ ...INCIDENT, thana: null })).toBe('Feni Incident');
        expect(incidentTitle({ ...INCIDENT, district: null, thana: null })).toBe('Govt. Primary School');
        expect(incidentTitle({ id: 7, district: null, thana: null, address: '' })).toBe('Incident #7');
    });

    it('shows the date and time in Bangladesh time, like "22nd August" and "05:30pm"', () => {
        expect(cardDateParts(INCIDENT.created_at)).toEqual({ day: '22nd August', time: '05:30pm' });
        expect(cardDateParts('2026-08-01T00:05:00Z').day).toBe('1st August');
        expect(cardDateParts('2026-08-02T00:05:00Z').day).toBe('2nd August');
        expect(cardDateParts('2026-08-03T00:05:00Z').day).toBe('3rd August');
        expect(cardDateParts('2026-08-11T00:05:00Z').day).toBe('11th August');
        expect(cardDateParts('2026-08-23T00:05:00Z').day).toBe('23rd August');
        expect(cardDateParts('2026-08-31T20:00:00Z')).toEqual({ day: '1st September', time: '02:00am' });
        expect(cardDateParts('nonsense')).toEqual({ day: '', time: '' });
    });

    it('counts volunteers in words', () => {
        expect(volunteerCountText(0)).toBe('No volunteers');
        expect(volunteerCountText(1)).toBe('1 volunteer');
        expect(volunteerCountText(8)).toBe('8 volunteers');
        expect(volunteerCountText(undefined)).toBe('No volunteers');
    });
});

describe('incident card', () => {
    it('shows title, date, time, place, short message, volunteers and a status badge', () => {
        const card = el(dashIncidentCard(INCIDENT));
        const text = card.textContent.replace(/\s+/g, ' ');

        ['Feni-Parshuram Incident', '22nd August', '05:30pm', 'District: Feni', 'Thana: Parshuram', '8 volunteers', 'Pending']
            .forEach((value) => expect(text).toContain(value));
        expect(card.querySelector('.hrs-dash-message').textContent).toBe(INCIDENT.description);
        expect(card.dataset.incidentId).toBe('12');
    });

    it('can be selected with a button and opened in details with another', () => {
        const card = el(dashIncidentCard(INCIDENT, { selected: true }));

        expect(card.classList.contains('is-selected')).toBe(true);
        expect(card.querySelector('[data-action="select-incident"]').getAttribute('aria-pressed')).toBe('true');
        expect(card.querySelector('[data-action="incident-details"]').textContent).toContain('View details');
        expect(el(dashIncidentCard(INCIDENT)).querySelector('[aria-pressed]').getAttribute('aria-pressed')).toBe('false');
    });

    it('a closed task is Resolved whatever its review status; otherwise the review status shows', () => {
        expect(el(dashIncidentCard({ ...INCIDENT, task_status: 'closed', validation_status: 'validated' })).textContent)
            .toContain('Resolved');
        expect(el(dashIncidentCard({ ...INCIDENT, validation_status: 'validated' })).textContent).toContain('Validated');
        expect(el(dashIncidentCard({ ...INCIDENT, validation_status: 'rejected' })).textContent).toContain('Rejected');
    });

    it('leaves out place lines it does not know', () => {
        const text = el(dashIncidentCard({ ...INCIDENT, district: null, thana: null })).textContent;

        expect(text).not.toContain('District:');
        expect(text).not.toContain('Thana:');
    });

    it('the map popup card shows the same summary with a details button', () => {
        const popup = el(incidentPopupCard(INCIDENT));
        const text = popup.textContent.replace(/\s+/g, ' ');

        ['Feni-Parshuram Incident', '22nd August', 'District: Feni', 'Thana: Parshuram', '8 volunteers']
            .forEach((value) => expect(text).toContain(value));
        expect(popup.querySelector('[data-action="incident-details"]').dataset.incidentId).toBe('12');
    });

    it('escapes everything that comes from reports', () => {
        const evil = {
            ...INCIDENT, id: '1"><img>', description: '<script>x</script>', district: '<b>D</b>', thana: '<i>T</i>', address: '<u>a</u>',
        };
        const html = dashIncidentCard(evil) + incidentPopupCard(evil) + dashIncidentCard({ ...evil, district: null, thana: null });

        ['<script>', '<b>D', '<i>T', '<u>a', '"><img>'].forEach((bad) => expect(html).not.toContain(bad));
    });
});

describe('stat cards', () => {
    it('shows each count as a pressable filter, the chosen one pressed', () => {
        const box = el(`<div>${statCardsHtml([
            { key: 'pending', label: 'Pending', count: 32 },
            { key: 'resolved', label: 'Resolved', count: 16 },
            { key: 'all', label: 'Total', count: 48 },
        ], 'pending', 'status')}</div>`);
        const buttons = [...box.querySelectorAll('button')];

        expect(buttons.map((b) => b.textContent.replace(/\s+/g, ' ').trim())).toEqual(['Pending 32', 'Resolved 16', 'Total 48']);
        expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);
        expect(buttons[1].dataset.status).toBe('resolved');
        expect(buttons[1].classList.contains('hrs-stat-card--resolved')).toBe(true);
    });

    it('shows a dash while a count is unknown', () => {
        const box = el(`<div>${statCardsHtml([{ key: 'active', label: 'Active', count: null }], 'all', 'vstatus')}</div>`);

        expect(box.textContent).toContain('–');
        expect(box.querySelector('button').dataset.vstatus).toBe('active');
    });
});

describe('volunteer avatar and card', () => {
    const VOLUNTEER = {
        id: 4,
        full_name: 'Rezwan Islam',
        contact_number: '01712345678',
        is_active: true,
        photo: 'http://localhost:8001/media/volunteers/rezwan.png',
        district: { id: 1, name: 'Feni' },
        thana: { id: 10, name: 'Parshuram' },
        assigned_incident_count: 2,
    };

    it('takes initials from the first two words of the name', () => {
        expect(initials('Rezwan Islam')).toBe('RI');
        expect(initials('  karim  ')).toBe('K');
        expect(initials('Md Abdul Karim')).toBe('MA');
        expect(initials('')).toBe('?');
    });

    it('shows the photo, or initials when there is none or it is not a safe URL, with an active dot', () => {
        const photo = el(avatarHtml({ name: 'Rezwan Islam', photo: VOLUNTEER.photo, active: true }));
        const noPhoto = el(avatarHtml({ name: 'Rezwan Islam', photo: null, active: false }));
        const unsafe = el(avatarHtml({ name: 'Rezwan Islam', photo: 'javascript:alert(1)', active: true }));

        expect(photo.querySelector('img').getAttribute('src')).toBe(VOLUNTEER.photo);
        expect(photo.querySelector('.hrs-avatar-dot--on')).not.toBeNull();
        expect(photo.textContent).toContain('Active');
        expect(noPhoto.querySelector('img')).toBeNull();
        expect(noPhoto.textContent).toContain('RI');
        expect(noPhoto.querySelector('.hrs-avatar-dot--off')).not.toBeNull();
        expect(noPhoto.textContent).toContain('Inactive');
        expect(unsafe.querySelector('img')).toBeNull();
    });

    it('a volunteer card shows name, phone, district and thana, and a call link', () => {
        const card = el(volunteerCard(VOLUNTEER));
        const text = card.textContent.replace(/\s+/g, ' ');

        ['Rezwan Islam', '01712345678', 'District: Feni', 'Thana: Parshuram'].forEach((v) => expect(text).toContain(v));
        expect(card.querySelector('a[href="tel:01712345678"]')).not.toBeNull();
        expect(card.querySelector('[data-action="assign"], [data-action="unassign"]')).toBeNull();
        expect(card.dataset.volunteerId).toBe('4');
    });

    it('with an incident selected the card offers Assign, or Unassign when already assigned, and the distance', () => {
        const free = el(volunteerCard({ ...VOLUNTEER, distance_km: 1.234 }, { selectedIncident: { id: 12 }, assigned: false }));
        const busy = el(volunteerCard(VOLUNTEER, { selectedIncident: { id: 12 }, assigned: true }));

        expect(free.querySelector('[data-action="assign"]').textContent).toContain('Assign');
        expect(free.textContent).toContain('1.2 km');
        expect(busy.querySelector('[data-action="unassign"]').textContent).toContain('Unassign');
        expect(busy.classList.contains('is-assigned')).toBe(true);
    });

    it('escapes volunteer text', () => {
        const html = volunteerCard({
            ...VOLUNTEER, full_name: '<b>x</b>', contact_number: '"><img>', district: { id: 1, name: '<i>d</i>' }, thana: null,
        });

        ['<b>x', '"><img>', '<i>d'].forEach((bad) => expect(html).not.toContain(bad));
    });
});

describe('area dropdowns', () => {
    const PLACES = [
        { id: 1, name: 'Feni', thanas: [{ id: 10, name: 'Parshuram' }, { id: 11, name: 'Sonagazi' }] },
        { id: 2, name: '<b>Sylhet</b>', thanas: [] },
    ];

    it('Zilla lists every district after "All Zilla" and keeps the choice', () => {
        const select = document.createElement('select');
        select.innerHTML = zillaOptions(PLACES, '1');

        expect([...select.options].map((o) => [o.value, o.textContent])).toEqual([['', 'All Zilla'], ['1', 'Feni'], ['2', '<b>Sylhet</b>']]);
        expect(select.value).toBe('1');
    });

    it('Upazilla lists only the chosen district\'s thanas', () => {
        const select = document.createElement('select');
        select.innerHTML = upazilaOptions(PLACES, '1', '11');

        expect([...select.options].map((o) => o.value)).toEqual(['', '10', '11']);
        expect(select.value).toBe('11');
        select.innerHTML = upazilaOptions(PLACES, '', '');
        expect([...select.options].map((o) => o.textContent)).toEqual(['All Upazilla']);
    });
});
