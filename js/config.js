// Base configuration. `speed` can be dynamically overridden below
const DEFAULT_CELL_SIZE = 20;
const DEFAULT_SPEED = 150; // developer default (main)

let runtimeSpeed = DEFAULT_SPEED;

try {
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';

    // If served from GitHub Pages, use a slower default so it's kid-friendly
    // Note: lower `speed` value => faster game (it's the loop delay in ms).
    if (host && host.includes('github.io')) {
        runtimeSpeed = 400; // slower for kids on gh-pages (increased delay)
    }
} catch (e) {
    // ignore runtime detection errors and keep DEFAULT_SPEED
}

export const CONFIG = {
    cellSize: DEFAULT_CELL_SIZE,
    speed: runtimeSpeed
};