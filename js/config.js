// Base configuration. `speed` can be dynamically overridden below
const DEFAULT_CELL_SIZE = 20;
const DEFAULT_SPEED = 150; // developer default (main)

let runtimeSpeed = DEFAULT_SPEED;

try {
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';

    // If served from GitHub Pages, use a slower default so it's kid-friendly
    // Note: lower `speed` value => faster game (it's the loop delay in ms).
    if (host && host.includes('github.io')) {
        runtimeSpeed = 220; // slower for kids on gh-pages
    }

    // URL override: ?speed=100 (useful for testing from any host)
    if (typeof window !== 'undefined' && window.location && window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('speed');
        if (s) {
            const parsed = parseInt(s, 10);
            if (!Number.isNaN(parsed)) runtimeSpeed = parsed;
        }
    }

    // Local override (dev): set localStorage.setItem('snake_speed', '120')
    if (typeof localStorage !== 'undefined') {
        const ls = localStorage.getItem('snake_speed');
        if (ls) {
            const parsed = parseInt(ls, 10);
            if (!Number.isNaN(parsed)) runtimeSpeed = parsed;
        }
    }
} catch (e) {
    // ignore runtime detection errors and keep DEFAULT_SPEED
}

export const CONFIG = {
    cellSize: DEFAULT_CELL_SIZE,
    speed: runtimeSpeed
};