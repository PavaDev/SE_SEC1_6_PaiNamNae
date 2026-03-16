// Service Worker for Web Push Notifications
// PaiNamNae App

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    let data = { title: 'PaiNamNae', body: '', url: '/', icon: '/icon-192.png' };
    try {
        data = event.data?.json() || data;
    } catch (e) {
        data.body = event.data?.text() || '';
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-72.png',
        data: { url: data.url || '/' },
        requireInteraction: false,
        silent: false,
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
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
