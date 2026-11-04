import { defineConfig } from 'vitest/config';

// Tests for the web app's ES modules (apps/webui/static/webui/js), in a browser-like DOM.
export default defineConfig({
    test: {
        environment: 'jsdom',
        // A fixed zone for every machine (CI runs in UTC): times shown in Bangladesh time must be
        // converted on purpose, not happen to match the developer's clock.
        env: { TZ: 'UTC' },
        include: ['apps/webui/static/webui/js/**/*.test.js'],
    },
});
