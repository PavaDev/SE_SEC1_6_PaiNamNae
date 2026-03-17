const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubscriptions() {
    try {
        const subs = await prisma.pushSubscription.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        console.log('--- Push Subscriptions ---');
        console.log(JSON.stringify(subs, null, 2));
        console.log(`Total subscriptions: ${subs.length}`);
    } catch (error) {
        console.error('Error checking subscriptions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSubscriptions();
