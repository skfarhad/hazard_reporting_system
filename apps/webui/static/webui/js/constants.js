// API endpoints and shared constants for the web app.
export const API = {
    login: '/api/user/login/password/',
    signup: '/api/user/signup/',
    incidents: '/api/incidents/list/',
    needTypes: '/api/incidents/need-types/',
    volunteers: '/api/volunteers/volunteers/',
};

export const LOGIN_PAGE = '/app/login/';
export const HOME_PAGE = '/app/';

// Map view that fits all of Bangladesh.
export const BANGLADESH_CENTER = [23.685, 90.3563];
export const BANGLADESH_ZOOM = 7;

// Fallbacks only: the live colours are the --hrs-status-* / --hrs-volunteer tokens in hrs.css.
export const STATUS_COLORS = {
    pending: '#F59E0B',
    validated: '#DC2626',
    rejected: '#64748B',
};
export const VOLUNTEER_COLOR = '#16A34A';

// Shown for an incident's need when need types could not be loaded or the fallback type is gone.
export const GENERIC_NEED = { code: '', label_en: 'Unclassified', icon: 'question-circle', colour: '#64748B', is_fallback: true };
