/**
 * Web Push plugin — registers service worker, requests permission,
 * subscribes to push, and registers the subscription with the backend.
 */
export default defineNuxtPlugin(async () => {
    if (!process.client) return;

    // Wait for service worker support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[WebPush] Not supported in this browser');
        return;
    }

    try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[WebPush] Service Worker registered:', registration.scope);

        // Wait until SW is active
        await navigator.serviceWorker.ready;

        // Only subscribe if user is logged in (token cookie present)
        const token = useCookie('token');
        if (!token.value) return;

        const config = useRuntimeConfig();
        const vapidPublicKey = config.public.vapidPublicKey;
        if (!vapidPublicKey) {
            console.warn('[WebPush] No VAPID public key configured');
            return;
        }

        // Check existing subscription
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            // Only request if permission not yet denied
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('[WebPush] Permission not granted:', permission);
                return;
            }

            // Subscribe
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
        }

        // Send subscription to backend
        await $fetch('/push/subscribe', {
            baseURL: config.public.apiBase,
            method: 'POST',
            headers: { Authorization: `Bearer ${token.value}` },
            body: subscription.toJSON(),
        }).catch(err => console.warn('[WebPush] Subscribe failed:', err.message));

    } catch (err) {
        console.error('[WebPush] Setup error:', err);
    }
});

/**
 * Converts a base64 VAPID public key string to a Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
