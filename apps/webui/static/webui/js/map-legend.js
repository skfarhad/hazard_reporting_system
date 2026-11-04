// Collapsible map legend: needs, statuses and volunteers.
import { escapeHtml } from './utils.js';
import { LEGEND_STORAGE_KEY } from './constants.js';
import { safeIcon, safeColour } from './map.js';

const STATUS_ROWS = [
    ['pending', 'Pending'],
    ['validated', 'Validated'],
    ['rejected', 'Rejected (faded)'],
];

function section(title, items) {
    return `<div class="hrs-map-legend-section"><div class="hrs-map-legend-title">${title}</div>`
        + `<ul class="hrs-map-legend-list">${items.join('')}</ul></div>`;
}

export function legendHtml(needTypes) {
    const needs = needTypes.map((t) => `<li><span class="hrs-legend-swatch" style="--hrs-pin-fill:${safeColour(t.colour)}">`
        + `<i class="bi bi-${safeIcon(t.icon)}" aria-hidden="true"></i></span>${escapeHtml(t.label_en)}</li>`);
    const statuses = STATUS_ROWS.map(([status, label]) => `<li><span class="hrs-legend-outline hrs-pin--${status}" aria-hidden="true"></span>${label}</li>`);
    const markers = [
        '<li><span class="hrs-legend-alert" aria-hidden="true">!</span>Life-threatening</li>',
        '<li><span class="hrs-legend-count" aria-hidden="true">+1</span>More needs</li>',
        '<li><span class="hrs-dot hrs-dot-volunteer" aria-hidden="true"></span>Volunteer</li>',
    ];
    return (needs.length ? section('Needs', needs) : '')
        + section('Pin outline', statuses)
        + section('Also', markers);
}

export function legendInitiallyOpen(stored, isWide) {
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return isWide;
}

function readStored(storage) {
    try {
        return storage.getItem(LEGEND_STORAGE_KEY);
    } catch {
        return null;
    }
}

function saveStored(storage, open) {
    try {
        storage.setItem(LEGEND_STORAGE_KEY, String(open));
    } catch {
        // Private mode or blocked storage: the legend still works, it just won't remember.
    }
}

// Adds the legend as a Leaflet control in the bottom-right corner and returns its element.
export function addLegend(L, map, needTypes, { storage, isWide }) {
    const control = L.control({ position: 'bottomright' });
    control.onAdd = () => {
        const container = document.createElement('div');
        container.className = 'hrs-map-legend';
        container.innerHTML = '<button type="button" class="hrs-map-legend-toggle" aria-controls="hrsMapLegendBody">'
            + '<i class="bi bi-list-ul" aria-hidden="true"></i><span>Legend</span>'
            + '<i class="bi bi-chevron-down hrs-map-legend-chevron" aria-hidden="true"></i></button>'
            + `<div class="hrs-map-legend-body" id="hrsMapLegendBody">${legendHtml(needTypes)}</div>`;

        const button = container.querySelector('button');
        const body = container.querySelector('.hrs-map-legend-body');
        const setOpen = (open) => {
            button.setAttribute('aria-expanded', String(open));
            body.hidden = !open;
            container.classList.toggle('is-collapsed', !open);
        };
        setOpen(legendInitiallyOpen(readStored(storage), isWide));
        button.addEventListener('click', () => {
            const open = body.hidden;
            setOpen(open);
            saveStored(storage, open);
        });

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
    };
    control.addTo(map);
    return control.getContainer();
}
