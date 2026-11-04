import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLiveSocket, debounceNudges, socketUrl, backoffDelay } from './live.js';

class FakeSocket {
    static all = [];

    constructor(url) {
        this.url = url;
        this.sent = [];
        this.closed = false;
        FakeSocket.all.push(this);
    }

    send(text) { this.sent.push(JSON.parse(text)); }

    close() { this.closed = true; }

    // Test helpers: what the server does.
    open() { this.onopen?.(); }

    message(data) { this.onmessage?.({ data: JSON.stringify(data) }); }

    drop(code = 1006) { this.onclose?.({ code }); }
}

const latest = () => FakeSocket.all[FakeSocket.all.length - 1];

function start(overrides = {}) {
    const calls = { nudges: [], statuses: [], reconnects: 0 };
    const live = createLiveSocket({
        url: 'ws://host/ws/dashboard/',
        getToken: () => 'jwt-1',
        WebSocket: FakeSocket,
        onNudge: (n) => calls.nudges.push(n),
        onStatus: (s) => calls.statuses.push(s),
        onReconnect: () => { calls.reconnects += 1; },
        ...overrides,
    });
    return { live, calls };
}

beforeEach(() => {
    FakeSocket.all = [];
    vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('live socket', () => {
    it('signs in with the token as its first message, then reports live', () => {
        const { calls } = start();

        latest().open();
        latest().message({ type: 'ready' });

        expect(latest().url).toBe('ws://host/ws/dashboard/');
        expect(latest().sent).toEqual([{ type: 'auth', token: 'jwt-1' }]);
        expect(calls.statuses).toEqual(['connecting', 'live']);
    });

    it('passes change nudges on and ignores anything else', () => {
        const { calls } = start();
        latest().open();
        latest().message({ type: 'ready' });

        latest().message({ type: 'incident.changed', id: 3 });
        latest().message({ type: 'volunteer.changed', id: 4 });
        latest().message({ type: 'something.else' });
        latest().onmessage({ data: 'not json' });

        expect(calls.nudges).toEqual([{ type: 'incident.changed', id: 3 }, { type: 'volunteer.changed', id: 4 }]);
    });

    it('reconnects after a drop, waiting 1, 2, 4… seconds up to 30', () => {
        const { calls } = start();
        const waits = [];
        for (let attempt = 0; attempt < 7; attempt += 1) {
            const before = FakeSocket.all.length;
            latest().drop();
            let waited = 0;
            while (FakeSocket.all.length === before) {
                vi.advanceTimersByTime(500);
                waited += 500;
            }
            waits.push(waited);
        }

        expect(waits).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
        expect(calls.statuses).toContain('reconnecting');
        expect([0, 1, 2, 5, 6, 10].map(backoffDelay)).toEqual([1000, 2000, 4000, 30000, 30000, 30000]);
    });

    it('after reconnecting it signs in again with the current token and asks the page to re-fetch once', () => {
        let token = 'jwt-1';
        const { calls } = start({ getToken: () => token });
        latest().open();
        latest().message({ type: 'ready' });
        latest().drop();
        token = 'jwt-2';
        vi.advanceTimersByTime(1000);

        latest().open();
        latest().message({ type: 'ready' });

        expect(latest().sent).toEqual([{ type: 'auth', token: 'jwt-2' }]);
        expect(calls.reconnects).toBe(1);
    });

    it('a successful sign-in resets the wait back to 1 second', () => {
        start();
        latest().drop();
        vi.advanceTimersByTime(1000);
        latest().drop();
        vi.advanceTimersByTime(2000);
        latest().open();
        latest().message({ type: 'ready' });
        const count = FakeSocket.all.length;

        latest().drop();
        vi.advanceTimersByTime(1000);

        expect(FakeSocket.all.length).toBe(count + 1);
    });

    it('stops for good when the server says the user may not sign in', () => {
        for (const code of [4401, 4403]) {
            FakeSocket.all = [];
            const { calls } = start();
            latest().drop(code);
            vi.advanceTimersByTime(60000);

            expect(FakeSocket.all).toHaveLength(1);
            expect(calls.statuses[calls.statuses.length - 1]).toBe('offline');
        }
    });

    it('close() stops reconnecting', () => {
        const { live } = start();

        live.close();
        latest().drop(1000);
        vi.advanceTimersByTime(60000);

        expect(FakeSocket.all).toHaveLength(1);
        expect(FakeSocket.all[0].closed).toBe(true);
    });

    it('builds the socket URL from the page address', () => {
        expect(socketUrl({ protocol: 'https:', host: 'hrs.example' })).toBe('wss://hrs.example/ws/dashboard/');
        expect(socketUrl({ protocol: 'http:', host: 'localhost:8001' })).toBe('ws://localhost:8001/ws/dashboard/');
    });
});

describe('debounced nudges', () => {
    it('collapses a burst into one call with the kinds that changed, at most once per wait', () => {
        const fn = vi.fn();
        const push = debounceNudges(fn, 2000);

        push({ type: 'incident.changed', id: 1 });
        push({ type: 'incident.changed', id: 2 });
        push({ type: 'volunteer.changed', id: 3 });
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2000);

        expect(fn).toHaveBeenCalledTimes(1);
        expect([...fn.mock.calls[0][0]].sort()).toEqual(['incident', 'volunteer']);

        push({ type: 'volunteer.changed', id: 3 });
        vi.advanceTimersByTime(2000);
        expect(fn).toHaveBeenCalledTimes(2);
        expect([...fn.mock.calls[1][0]]).toEqual(['volunteer']);
    });
});
