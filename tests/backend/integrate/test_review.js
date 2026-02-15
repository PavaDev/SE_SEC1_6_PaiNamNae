
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const reviewService = require('../../../src/backend/src/services/review.service');

async function main() {
    console.log('--- Checking Reviews ---');
    const reviews = await prisma.review.findMany({
        include: { booking: true }
    });
    console.log(`Total reviews found: ${reviews.length}`);
    reviews.forEach(r => {
        console.log(`Review ID: ${r.id}, Route ID: ${r.booking.routeId}, Rating: ${r.rating}`);
    });

    if (reviews.length > 0) {
        const routeId = reviews[0].booking.routeId;
        console.log(`\nTesting getReviewByRouteId for route ${routeId}...`);
        const result = await reviewService.getReviewByRouteId(routeId);
        console.log('Result:', JSON.stringify(result, null, 2));
    } else {
        console.log('No reviews to test service with.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
