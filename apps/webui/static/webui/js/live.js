// The dashboard's live connection: signs in over a WebSocket, passes on "something changed" nudges,
// and reconnects with backoff. The page re-fetches through the API, so nudges carry no data.
const NOT_SIGNED_IN = 4401;
const NOT_AN_OPERATOR = 4403;
const MAX_WAIT_MS = 30000;

export function socketUrl(location) {
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/dashboard/`;
}

// 1 s, 2 s, 4 s… up to 30 s.
export function backoffDelay(attempt) {
    return Math.min(1000 * 2 ** attempt, MAX_WAIT_MS);
}

// `onStatus` gets 'connecting' | 'live' | 'reconnecting' | 'offline'; `onReconnect` runs when the socket is
// back after a drop, so the page can catch up on what it missed.
export function createLiveSocket({ url, getToken, WebSocket, onNudge, onStatus, onReconnect }) {
    let socket = null;
    let attempt = 0;
    let timer = null;
    let stopped = false;
    let hadConnection = false;

    function connect() {
        onStatus?.(hadConnection ? 'reconnecting' : 'connecting');
        socket = new WebSocket(url);
        socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', token: getToken() }));
        socket.onmessage = (event) => {
            let message;
            try {
                message = JSON.parse(event.data);
            } catch {
                return;
            }
            if (message?.type === 'ready') {
                attempt = 0;
                onStatus?.('live');
                if (hadConnection) onReconnect?.();
                hadConnection = true;
            } else if (typeof message?.type === 'string' && message.type.endsWith('.changed')) {
                onNudge(message);
            }
        };
        socket.onclose = (event) => {
            if (stopped) return;
            if (event?.code === NOT_SIGNED_IN || event?.code === NOT_AN_OPERATOR) {
                stopped = true;
                onStatus?.('offline');
                return;
            }
            hadConnection = true;
            onStatus?.('reconnecting');
            timer = setTimeout(connect, backoffDelay(attempt));
            attempt += 1;
        };
    }

    connect();
    return {
        close() {
            stopped = true;
            clearTimeout(timer);
            socket?.close();
        },
    };
}

// Bursts of nudges (an incident saved twice, several assignments) become one re-fetch per `wait` ms,
// told which kinds ("incident", "volunteer") changed.
export function debounceNudges(fn, wait) {
    let kinds = new Set();
    let timer = null;
    return (nudge) => {
        kinds.add(String(nudge.type).split('.')[0]);
        if (timer) return;
        timer = setTimeout(() => {
            const changed = kinds;
            kinds = new Set();
            timer = null;
            fn(changed);
        }, wait);
    };
}
