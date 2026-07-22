const STATIC_CACHE_NAME = 'kmb-static-v2';
const DATA_CACHE_NAME = 'kmb-data-v2';
const IMAGE_CACHE_NAME = 'kmb-images-v2';

const STATIC_ASSETS = [
  '/',
  '/admin',
  '/admin/pending',
  '/admin/prepared',
  '/admin/completed',
  '/admin/photos',
  '/admin/history',
  '/admin/new',
  '/login',
  '/logo.png',
  '/favicon.ico',
  '/manifest.json'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching static app shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Static precache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DATA_CACHE_NAME &&
            cacheName !== IMAGE_CACHE_NAME
          ) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests (e.g. POST, DELETE)
  if (req.method !== 'GET') return;

  // 1. IMAGE CACHING (Cloudinary, static assets, remote images)
  const isImage = 
    req.destination === 'image' ||
    url.hostname.includes('cloudinary.com') ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico)$/i);

  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        // Try matching request directly or ignoring search params
        const cachedResponse = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
        if (cachedResponse) {
          // Return cached image immediately for instant offline/online rendering
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(req);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.log('[Service Worker] Offline fetch failed for image:', req.url);
          // Try matching ignoring search query
          const fallback = await cache.match(url.pathname, { ignoreSearch: true });
          return cachedResponse || fallback || Response.error();
        }
      })
    );
    return;
  }

  // 2. API REQUESTS (/api/clients...)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        try {
          const networkResponse = await fetch(req);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.log('[Service Worker] Network offline, serving cached API data for:', req.url);
          const cachedResponse = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(JSON.stringify({ error: 'Offline Mode: Data not cached yet' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })
    );
    return;
  }

  // 3. PAGE NAVIGATION & OTHER GET REQUESTS
  event.respondWith(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      const cachedMatch = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));

      try {
        const networkResponse = await fetch(req);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(req, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.log('[Service Worker] Offline, serving cached page for:', req.url);
        if (cachedMatch) {
          return cachedMatch;
        }
        const pathMatch = await cache.match(url.pathname, { ignoreSearch: true });
        if (pathMatch) {
          return pathMatch;
        }
        // Fallback to cached admin dashboard or photos catalog if available
        return (await cache.match('/admin/photos')) || (await cache.match('/admin')) || Response.error();
      }
    })
  );
});

// Custom Message Listener to Pre-cache all Clients Data & Images
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_RESOURCES') {
    const urls = event.data.urls || [];
    console.log(`[Service Worker] Background pre-caching ${urls.length} resources for offline access...`);

    caches.open(IMAGE_CACHE_NAME).then((cache) => {
      urls.forEach((url) => {
        if (!url || typeof url !== 'string') return;
        if (url.startsWith('data:image/')) return; // Skip embedded base64 strings

        // Fetch with no-cors so cross-origin Cloudinary photos are cached as opaque responses
        fetch(url, { mode: 'no-cors' })
          .then((response) => {
            if (response) {
              cache.put(url, response);
            }
          })
          .catch((err) => {
            // Ignore pre-fetch failures
          });
      });
    });
  }
});
