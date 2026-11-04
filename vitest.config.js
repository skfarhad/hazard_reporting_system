import { defineConfig } from 'vitest/config';

// Tests for the web app's ES modules (apps/webui/static/webui/js), in a browser-like DOM.
export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['apps/webui/static/webui/js/**/*.test.js'],
    },
});
