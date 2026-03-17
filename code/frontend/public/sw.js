// Service Worker for Web Push Notifications
// PaiNamNae App

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    console.log('[SW] Push event received');
    
    let data = { title: 'PaiNamNae', body: '', url: '/', icon: '/favicon.ico' };
    
    if (event.data) {
        try {
            data = event.data.json();
            console.log('[SW] Push data (JSON):', data);
        } catch (e) {
            data.body = event.data.text();
            console.log('[SW] Push data (Text):', data.body);
        }
    } else {
        console.log('[SW] Push event has no data');
    }

    const options = {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        data: { url: data.url || '/' },
        // Use a unique tag if none provided, or none at all to avoid accidental overwriting
        tag: data.tag || undefined, 
        renotify: !!data.tag,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        timestamp: Date.now()
    };

    console.log('[SW] Showing notification:', data.title, options);

    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('[SW] Notification shown successfully'))
            .catch(err => console.error('[SW] Notification show failed:', err))
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
