const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');
require('dotenv').config();

const prisma = new PrismaClient();

webpush.setVapidDetails(
    process.env.WEB_PUSH_EMAIL,
    process.env.WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY
);

async function testPush(username) {
    try {
        const user = await prisma.user.findFirst({ where: { username } });
        if (!user) {
            console.error('User not found');
            return;
        }

        const subs = await prisma.pushSubscription.findMany({ where: { userId: user.id } });
        if (subs.length === 0) {
            console.error('No subscriptions found for user');
            return;
        }

        console.log(`Found ${subs.length} subscriptions for ${username}`);

        const payload = JSON.stringify({
            title: '🔔 Test Notification',
            body: 'This is a test notification from the backend script.',
            url: '/',
            tag: 'test-push'
        });

        for (const sub of subs) {
            console.log(`Sending to endpoint: ${sub.endpoint.substring(0, 50)}...`);
            try {
                const res = await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    payload
                );
                console.log(`Success! Status: ${res.statusCode}`);
            } catch (err) {
                console.error(`Failed: ${err.statusCode} - ${err.message}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const target = process.argv[2] || 'passenger1';
testPush(target);
