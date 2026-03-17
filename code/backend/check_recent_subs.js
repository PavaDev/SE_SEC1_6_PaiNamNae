const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentSubs() {
    try {
        const subs = await prisma.pushSubscription.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                user: {
                    select: { username: true }
                }
            }
        });
        console.log('--- Most Recent Push Subscriptions ---');
        console.log(JSON.stringify(subs, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentSubs();
