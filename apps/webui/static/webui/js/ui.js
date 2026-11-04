// Spinner and toast messages.
import { escapeHtml } from './utils.js';

let pending = 0;

export function showSpinner() {
    pending += 1;
    document.getElementById('spinner')?.classList.remove('d-none');
}

export function hideSpinner() {
    pending = Math.max(0, pending - 1);
    if (pending === 0) document.getElementById('spinner')?.classList.add('d-none');
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const color = type === 'error' ? 'text-bg-danger' : 'text-bg-dark';
    const toast = document.createElement('div');
    toast.className = `toast align-items-center border-0 show ${color}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(message)}</div>`
        + '<button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button></div>';
    toast.querySelector('.btn-close').addEventListener('click', () => toast.remove());
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}
