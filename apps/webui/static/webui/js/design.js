// Design-system reference page: colour swatches read from the live tokens, so they follow the theme.
import { cssVar } from './theme.js';
import { escapeHtml } from './utils.js';

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
document.addEventListener('hrs:themechange', renderSwatches);
