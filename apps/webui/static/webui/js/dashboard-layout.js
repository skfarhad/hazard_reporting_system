// Live dashboard layout: side panels that collapse to a rail on desktop (remembered per browser),
// and Incidents / Map / Volunteers tabs on phones.
export const PANELS_STORAGE_KEY = 'hrs.dashboard.panels';
const PANEL_NAMES = ['incidents', 'volunteers'];
const MOBILE_TABS = ['incidents', 'map', 'volunteers'];
const OPEN = Object.freeze({ incidents: false, volunteers: false });

// `true` means collapsed. Storage can be blocked or hold anything: fall back to both open.
export function readPanels(storage) {
    try {
        const saved = JSON.parse(storage.getItem(PANELS_STORAGE_KEY) || '{}');
        return Object.fromEntries(PANEL_NAMES.map((name) => [name, saved?.[name] === true]));
    } catch {
        return { ...OPEN };
    }
}

export function savePanels(storage, panels) {
    try {
        storage.setItem(PANELS_STORAGE_KEY, JSON.stringify(panels));
    } catch {
        // Not remembered this time; the layout still works.
    }
}

export function togglePanel(panels, name) {
    return { ...panels, [name]: !panels[name] };
}

export function applyPanels(root, panels) {
    PANEL_NAMES.forEach((name) => {
        const collapsed = Boolean(panels[name]);
        root.querySelector(`[data-panel="${name}"]`)?.classList.toggle('is-collapsed', collapsed);
        root.querySelectorAll(`[data-toggle-panel="${name}"]`).forEach((b) => b.setAttribute('aria-expanded', String(!collapsed)));
        root.classList.toggle(`hrs-dashboard--no-${name}`, collapsed);
    });
}

export function setMobileTab(root, tab) {
    const chosen = MOBILE_TABS.includes(tab) ? tab : 'map';
    root.dataset.mobileTab = chosen;
    root.querySelectorAll('[data-mobile-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mobileTab === chosen)));
    return chosen;
}
