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

export const STATUS_COLORS = {
    pending: '#f59f00',
    validated: '#d63939',
    rejected: '#868e96',
};
export const VOLUNTEER_COLOR = '#2fb344';
