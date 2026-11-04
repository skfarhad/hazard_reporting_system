// "Report an incident" pop-up: loads the lookups once, places the pin, sends the report.
import { apiGet, apiPost } from './api.js';
import { API, BANGLADESH_CENTER, BANGLADESH_ZOOM } from './constants.js';
import { getUser } from './utils.js';
import { showToast } from './ui.js';
import { showFieldErrors } from './incident-views.js';
import { reportFormHtml, readReportForm, thanaOptions, setLocation, insideBangladesh } from './report-form.js';

const PIN_ZOOM = 15;
const GPS_TIMEOUT_MS = 15000;

function locationError(error) {
    if (error?.code === 1) return 'Location permission was denied. Tap the map instead.';
    if (error?.code === 3) return 'Finding your location took too long. Tap the map instead.';
    return 'Your location is not available. Tap the map instead.';
}

// `onCreated(id)` runs after a successful report (operators refresh their view there).
export function createReportModal({ L, Modal, element, onCreated }) {
    const modal = Modal.getOrCreateInstance(element);
    const body = element.querySelector('#reportModalBody');
    const submit = element.querySelector('#reportSubmit');
    let lookups = null;
    let form = null;
    let map = null;
    let marker = null;

    async function loadLookups() {
        if (lookups) return lookups;
        const [needTypes, places] = await Promise.all([apiGet(API.needTypes), apiGet(API.places)]);
        lookups = { needTypes: needTypes.ok ? needTypes.data : [], places: places.ok ? places.data : [] };
        return lookups;
    }

    function place(latLng, { pan = false } = {}) {
        setLocation(form, latLng);
        showFieldErrors(form, {});
        if (!map) return;
        if (marker) marker.setLatLng(latLng);
        else {
            marker = L.marker(latLng, { draggable: true, autoPan: true, title: 'Incident location' }).addTo(map);
            marker.on('dragend', () => setLocation(form, marker.getLatLng()));
        }
        if (pan) map.setView(latLng, PIN_ZOOM);
    }

    function setUpMap() {
        const box = form.querySelector('[data-report-map]');
        if (map) { map.remove(); map = null; marker = null; }
        if (!L || !box) return;
        map = L.map(box, { scrollWheelZoom: false }).setView(BANGLADESH_CENTER, BANGLADESH_ZOOM);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        map.on('click', (event) => place(event.latlng));
    }

    function locate(button) {
        const text = form.querySelector('[data-location-text]');
        if (!navigator.geolocation) { text.textContent = locationError(); return; }
        button.disabled = true;
        text.textContent = 'Finding your location…';
        navigator.geolocation.getCurrentPosition((position) => {
            button.disabled = false;
            const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };
            if (!insideBangladesh(latLng.lat, latLng.lng)) {
                text.textContent = 'You seem to be outside Bangladesh. Tap the map to place the incident.';
                return;
            }
            place(latLng, { pan: true });
        }, (error) => {
            button.disabled = false;
            text.textContent = locationError(error);
        }, { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 60000 });
    }

    function focusFirstError() {
        form.querySelector('.is-invalid, [data-error-for]:not(:empty)')?.closest('.mb-3, .col-sm-6, .col-12, .mb-2, fieldset')
            ?.querySelector('input:not([type=hidden]), textarea, select, button')?.focus();
    }

    async function send(event) {
        event.preventDefault();
        const { body: report, errors } = readReportForm(form);
        showFieldErrors(form, errors);
        if (Object.keys(errors).length) { focusFirstError(); return; }
        submit.disabled = true;
        const res = await apiPost(API.reportIncident, report);
        submit.disabled = false;
        if (res.status === 429) {
            showFieldErrors(form, { detail: 'You have sent many reports in the last hour. Please wait a while, or call your local emergency number.' });
            return;
        }
        if (!res.ok) {
            showFieldErrors(form, res.data || { detail: 'Could not send the report. Check your connection and try again.' });
            focusFirstError();
            return;
        }
        modal.hide();
        showToast(`Report #${res.data.id} sent for staff review.`, 'success');
        onCreated?.(res.data.id);
    }

    async function open() {
        body.innerHTML = '<div class="text-secondary">Loading…</div>';
        submit.disabled = true;
        modal.show();
        const { needTypes, places } = await loadLookups();
        body.innerHTML = reportFormHtml(needTypes, places, { phone: getUser()?.phone || '' });
        form = body.querySelector('form');
        form.addEventListener('submit', send);
        form.elements.district.addEventListener('change', () => {
            form.elements.thana.innerHTML = thanaOptions(places, form.elements.district.value, '');
        });
        form.querySelector('[data-action="locate"]').addEventListener('click', (e) => locate(e.currentTarget));
        submit.disabled = false;
        // Leaflet measures its box, so the map is built once the pop-up is visible.
        if (element.classList.contains('show')) setUpMap();
        form.elements.description.focus();
    }

    element.addEventListener('shown.bs.modal', () => { if (form && !map) setUpMap(); map?.invalidateSize(); });
    element.addEventListener('hidden.bs.modal', () => {
        if (map) { map.remove(); map = null; marker = null; }
        body.innerHTML = '';
        form = null;
    });

    // Any [data-action="report"] button on the page opens the form.
    document.addEventListener('click', (event) => {
        if (event.target.closest('[data-action="report"]')) open();
    });

    return { open };
}
