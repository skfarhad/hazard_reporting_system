// Sign-in and registration against the user API.
import { apiPost } from './api.js';
import { API, HOME_PAGE } from './constants.js';
import { setSession, getAccessToken, nav } from './utils.js';
import { safeNext } from './auth.js';

const destination = () => safeNext(window.location.search) || HOME_PAGE;

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

function bind(form, endpoint) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const error = form.querySelector('[data-error]');
        error.textContent = '';
        const res = await apiPost(endpoint, formData(form), { auth: false });
        if (res.ok && res.data?.jwt_token) {
            setSession(res.data.jwt_token, res.data.user_details);
            nav.go(destination());
        } else {
            error.textContent = res.data?.detail || 'Something went wrong, please try again.';
        }
    });
}

if (getAccessToken()) {
    nav.go(destination());
} else {
    bind(document.getElementById('loginForm'), API.login);
    bind(document.getElementById('registerForm'), API.signup);
}
