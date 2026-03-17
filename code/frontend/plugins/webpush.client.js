/**
 * Web Push plugin — registers service worker, requests permission,
 * subscribes to push, and registers the subscription with the backend.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
    if (!process.client) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[WebPush] Not supported in this browser');
        return;
    }

    const config = useRuntimeConfig();
    const vapidPublicKey = config.public.vapidPublicKey;

    const cookieOpts = {
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    };

    const subscribeToPush = async () => {
        try {
            const token = useCookie('token', cookieOpts);
            if (!token.value) return;

            if (!vapidPublicKey) {
                console.warn('[WebPush] No VAPID public key configured');
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log('[WebPush] Permission not granted:', permission);
                    return;
                }

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
    };

    const unsubscribeFromPush = async () => {
        try {
            const token = useCookie('token', cookieOpts);
            if (!token.value) return;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const endpoint = subscription.endpoint;
                
                // 1. Try to unsubscribe from the browser side
                await subscription.unsubscribe().catch(e => console.warn('[WebPush] browser unsubscribe failed:', e));

                // 2. Call backend with a simple timeout/catch
                await $fetch('/push/unsubscribe', {
                    baseURL: config.public.apiBase,
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token.value}` },
                    body: { endpoint },
                    timeout: 5000 // Ensure it doesn't hang forever
                }).catch(err => console.warn('[WebPush] Backend unsubscribe failed:', err.message));
            }
        } catch (err) {
            console.error('[WebPush] Unsubscribe error:', err);
        }
    };

    nuxtApp.provide('subscribeToPush', subscribeToPush);
    nuxtApp.provide('unsubscribeFromPush', unsubscribeFromPush);

    // Auto-subscribe if already granted (won't show prompt)
    if (Notification.permission === 'granted') {
        subscribeToPush();
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
