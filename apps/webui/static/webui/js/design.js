// Design-system reference page: colour swatches read from the live tokens, so they follow the theme.
import { cssVar } from './theme.js';
import { escapeHtml } from './utils.js';
import { incidentPinHtml } from './map.js';
import { legendHtml } from './map-legend.js';

// Same icons and colours as the seeded need types (migration 0009).
const SAMPLE_NEEDS = [
    { code: 'rescue', label_en: 'Rescue', icon: 'life-preserver', colour: '#DC2626' },
    { code: 'medical', label_en: 'Medical', icon: 'heart-pulse', colour: '#DB2777' },
    { code: 'food', label_en: 'Food', icon: 'basket', colour: '#D97706' },
    { code: 'water', label_en: 'Water & sanitation', icon: 'droplet', colour: '#0284C7' },
    { code: 'other', label_en: 'Other', icon: 'question-circle', colour: '#64748B', is_fallback: true },
];
const SAMPLE_PINS = [
    [{ needs: ['rescue'], validation_status: 'validated', life_threatening: true }, 'rescue · validated · life-threatening'],
    [{ needs: ['medical', 'food'], validation_status: 'pending' }, 'medical + food · pending'],
    [{ needs: ['water'], validation_status: 'validated' }, 'water · validated'],
    [{ needs: [], validation_status: 'pending' }, 'other · pending'],
    [{ needs: ['food'], validation_status: 'rejected' }, 'food · rejected'],
];

function renderPins() {
    const pins = document.getElementById('pinSamples');
    if (pins) {
        pins.innerHTML = SAMPLE_PINS.map(([incident, caption]) => `<figure class="m-0 text-center">
            <div class="d-inline-block mt-2">${incidentPinHtml(incident, SAMPLE_NEEDS)}</div>
            <figcaption class="small text-secondary mt-1">${escapeHtml(caption)}</figcaption></figure>`).join('');
    }
    const legend = document.getElementById('legendSample');
    if (legend) legend.innerHTML = legendHtml(SAMPLE_NEEDS);
}

const SWATCHES = [
    ['--hrs-brand', 'Brand'], ['--hrs-brand-strong', 'Brand strong'], ['--hrs-accent', 'Accent (SOS)'],
    ['--hrs-status-pending', 'Status · pending'], ['--hrs-status-validated', 'Status · validated'],
    ['--hrs-status-rejected', 'Status · rejected'], ['--hrs-volunteer', 'Volunteer'],
    ['--hrs-success', 'Success'], ['--hrs-warning', 'Warning'], ['--hrs-danger', 'Danger'], ['--hrs-info', 'Info'],
    ['--hrs-background', 'Background'], ['--hrs-surface', 'Surface'], ['--hrs-surface-muted', 'Surface muted'],
    ['--hrs-border', 'Border'], ['--hrs-text', 'Text'], ['--hrs-text-muted', 'Text muted'], ['--hrs-text-subtle', 'Text subtle'],
];

function renderSwatches() {
    const container = document.getElementById('swatches');
    if (!container) return;
    container.innerHTML = SWATCHES.map(([token, label]) => `
        <div class="col-6 col-md-4 col-lg-2">
          <div class="hrs-card overflow-hidden h-100">
            <div style="height:56px;background:var(${token});border-bottom:1px solid var(--hrs-border)"></div>
            <div class="p-2">
              <div class="small fw-semibold">${escapeHtml(label)}</div>
              <div class="small text-secondary hrs-mono">${escapeHtml(cssVar(token))}</div>
              <div class="small text-secondary hrs-mono">${escapeHtml(token)}</div>
            </div>
          </div>
        </div>`).join('');
}

document.querySelectorAll('[data-chip-group]').forEach((group) => {
    group.addEventListener('click', (event) => {
        const chip = event.target.closest('button.hrs-chip');
        if (!chip) return;
        group.querySelectorAll('button.hrs-chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    });
});

renderSwatches();
renderPins();
document.addEventListener('hrs:themechange', renderSwatches);
