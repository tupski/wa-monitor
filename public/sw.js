/**
 * Service Worker for WA Monitor Pro
 * Provides offline capabilities and caching
 */

const CACHE_NAME = 'wa-monitor-pro-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/css/style.css',
    '/js/main.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync event
self.addEventListener('sync', (event) => {
    console.log('Background sync event:', event.tag);

    if (event.tag === 'background-sync-messages') {
        event.waitUntil(syncMessages());
    }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);

    if (event.data && event.data.type === 'SYNC_MESSAGES') {
        // Trigger background sync
        self.registration.sync.register('background-sync-messages');
    }
});

// Background sync function
async function syncMessages() {
    try {
        console.log('Starting background message sync...');

        // Try to fetch latest messages from server
        const response = await fetch('/api/sync-messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: Date.now()
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Background sync successful:', data);

            // Send message to all clients about sync completion
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_COMPLETE',
                    data: data
                });
            });
        } else {
            console.error('Background sync failed:', response.status);
        }
    } catch (error) {
        console.error('Background sync error:', error);
    }
}

// Push event for notifications
self.addEventListener('push', (event) => {
    console.log('Push event received:', event);

    let notificationData = {
        title: 'WhatsApp Message',
        body: 'You have a new message',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'whatsapp-message'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (e) {
            console.error('Error parsing push data:', e);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: false,
            actions: [
                {
                    action: 'open',
                    title: 'Open Chat'
                },
                {
                    action: 'close',
                    title: 'Dismiss'
                }
            ]
        })
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll().then((clientList) => {
                // Try to focus existing window
                for (const client of clientList) {
                    if (client.url.includes('/dashboard.html') && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Open new window if no existing window found
                if (clients.openWindow) {
                    return clients.openWindow('/dashboard.html');
                }
            })
        );
    }
});
