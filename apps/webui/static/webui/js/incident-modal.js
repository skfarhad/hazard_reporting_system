// The incident details pop-up shared by the Incidents page and the live dashboard: details, map preview,
// prev/next, validate/reject, and the triage form (needs, urgency, people, event, task, volunteers).
import { apiGet, apiPatch } from './api.js';
import { API } from './constants.js';
import { showToast } from './ui.js';
import {
    incidentDetailsHtml, statusActionsHtml, editFormHtml, formToPatch, showFieldErrors, editableEvents,
    filterVolunteerChoices,
} from './incident-views.js';
import { createIncidentDetail } from './incident-detail.js';
import { incidentIcon } from './map.js';

const STATUS_TOASTS = { validated: 'Incident validated.', rejected: 'Incident rejected.', pending: 'Incident is pending again.' };

// `lists()` gives { needTypes, events, volunteers } (volunteers may be null: the form then leaves assignments
// alone); `page()`/`goToPage()` drive Prev/Next; `onSaved(incident)` lets the page refresh its list.
export function setUpIncidentModal({ lists, page, goToPage, onSaved, onClosed }) {
    const actions = document.getElementById('incidentDetailActions');
    const edit = document.getElementById('incidentDetailEdit');
    let detail = null;

    function renderQuickActions(incident) {
        const { needTypes, events, volunteers } = lists();
        actions.innerHTML = statusActionsHtml(incident);
        edit.innerHTML = editFormHtml(incident, needTypes, editableEvents(events, incident.event?.id ?? null), volunteers);
    }

    function clearQuickActions() {
        actions.innerHTML = '';
        edit.innerHTML = '';
    }

    // Sends one PATCH; on success the pop-up and the page show the saved incident.
    async function save(id, body, form) {
        const res = await apiPatch(API.incident(id), body);
        if (!res.ok) {
            if (form) showFieldErrors(form, res.data || {});
            else showToast(res.data?.detail || 'Could not update this incident.', 'error');
            return false;
        }
        if (detail.current()?.id === id) detail.show(res.data);
        await onSaved?.(res.data);
        detail.refreshNav();
        return true;
    }

    actions.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-status]');
        const incident = detail.current();
        if (!button || !incident?.id) return;
        button.disabled = true;
        const { status } = button.dataset;
        if (await save(incident.id, { validation_status: status })) showToast(STATUS_TOASTS[status], 'success');
        button.disabled = false;
    });
    edit.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.target;
        const incident = detail.current();
        const { body, errors } = formToPatch(form);
        showFieldErrors(form, errors);
        if (Object.keys(errors).length || !incident?.id) return;
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        if (await save(incident.id, body, form)) showToast('Changes saved.', 'success');
        button.disabled = false;
    });
    edit.addEventListener('reset', (event) => {
        showFieldErrors(event.target, {});
        // The reset clears the search box after this event; show every volunteer again.
        setTimeout(() => filterVolunteerChoices(event.target, ''));
    });
    edit.addEventListener('input', (event) => {
        if (event.target.matches('[data-volunteer-search]')) filterVolunteerChoices(event.target.form, event.target.value);
    });

    detail = createIncidentDetail({
        L: window.L,
        Modal: window.bootstrap.Modal,
        element: document.getElementById('incidentModal'),
        needTypes: lists().needTypes,
        fetchIncident: (id) => apiGet(API.incident(id)),
        page,
        goToPage,
        render: { details: incidentDetailsHtml, icon: incidentIcon, afterShow: renderQuickActions, clear: clearQuickActions },
        onClosed,
    });
    return detail;
}
