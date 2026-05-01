const CACHE_VERSION = 'arcade-core-v2026-05-01-3';
const CORE_ASSETS = [
    './',
    './index.html',
    './install.html',
    './manifest.webmanifest',
    './style.css',
    './mobile.css',
    './images/app-icon.svg',
    './images/install-qr.png',
    './games/game-modal.js',
    './games/sudoku.js',
    './games/hangman.js',
    './games/mots-meles.js',
    './games/paires.js',
    './games/match-3.js',
    './games/capitales-map.js',
    './games/capitales.js',
    './games/scrabble.js',
    './games/audio.js',
    './games/tetris.js',
    './games/objets-caches.js',
    './games/blind-test.js',
    './games/snake.js',
    './games/neon-pulse.js',
    './games/421.js',
    './games/uno.js',
    './games/suite-logique.js',
    './games/echecs.js',
    './games/vendor/js-chess-engine.js',
    './games/data/French ODS dictionary.json',
    './games/data/capitales.json',
    './games/data/blind-test.json',
    './games/data/blind-test-index.txt',
    './games/data/world-map.min.svg',
    './images/flags/flags-manifest.json',
    './images/flags/LICENSE.flag-icons.txt'
];

async function getFlagAssets() {
    try {
        const response = await fetch('./images/flags/flags-manifest.json', { cache: 'no-cache' });
        if (!response.ok) return [];
        const manifest = await response.json();
        if (!Array.isArray(manifest.flags)) return [];
        return manifest.flags.map((flagPath) => `./${flagPath}`);
    } catch (error) {
        return [];
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_VERSION);
        const flagAssets = await getFlagAssets();
        await cache.addAll([...CORE_ASSETS, ...flagAssets]);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter((key) => key.startsWith('arcade-core-') && key !== CACHE_VERSION)
            .map((key) => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith((async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        try {
            const response = await fetch(event.request);
            if (response && response.ok) {
                const cache = await caches.open(CACHE_VERSION);
                cache.put(event.request, response.clone());
            }
            return response;
        } catch (error) {
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
            throw error;
        }
    })());
});
