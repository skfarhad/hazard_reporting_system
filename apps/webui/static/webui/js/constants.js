// API endpoints and shared constants for the web app.
export const API = {
    login: '/api/user/login/password/',
    signup: '/api/user/signup/',
    incidents: '/api/incidents/list/',
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
