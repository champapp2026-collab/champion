const CACHE_NAME = 'champion-v3';
const ASSETS = [
    './',
    './index.html'
];

// Install - cache the app
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch - network first, fall back to cache
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Don't cache Firebase or external API calls
    if (url.hostname.includes('firestore') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic') ||
        url.hostname.includes('google')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Update cache with fresh version
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
