const webpush = require('web-push');
const prisma = require('../utils/prisma');
const ApiError = require('../utils/ApiError');

// Configure VAPID
webpush.setVapidDetails(
    `mailto:${process.env.WEB_PUSH_EMAIL || 'admin@painamnae.app'}`,
    process.env.WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY
);

/**
 * Save a push subscription for a user.
 * Upsert by endpoint (one device per endpoint).
 */
const saveSubscription = async (userId, subscription) => {
    const { endpoint, keys } = subscription;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new ApiError(400, 'Invalid push subscription');
    }

    return prisma.pushSubscription.upsert({
        where: { endpoint },
        update: {
            userId,
            p256dh: keys.p256dh,
            auth: keys.auth,
        },
        create: {
            userId,
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
        }
    });
};

/**
 * Delete a push subscription by endpoint.
 */
const deleteSubscription = async (userId, endpoint) => {
    await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint }
    });
};

/**
 * Send a web push notification to a specific user (all their devices).
 * @param {string} userId
 * @param {{ title: string, body: string, url?: string, icon?: string }} payload
 */
const sendPushToUser = async (userId, payload) => {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (!subs.length) return;

    const notifPayload = JSON.stringify({
        title: payload.title || 'PaiNamNae',
        body: payload.body || '',
        url: payload.url || '/',
        icon: payload.icon || '/icon-192.png',
        badge: '/icon-72.png',
    });

    const results = await Promise.allSettled(
        subs.map(sub =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                notifPayload
            ).catch(async (err) => {
                // 410 Gone = subscription expired, clean it up
                if (err.statusCode === 410) {
                    await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
                }
                throw err;
            })
        )
    );

    return results;
};

module.exports = { saveSubscription, deleteSubscription, sendPushToUser };
