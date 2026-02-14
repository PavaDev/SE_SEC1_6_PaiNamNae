const { PrismaClient } = require('@prisma/client');
const reviewService = require('../../../src/backend/src/services/review.service');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Review Service Test...');

    // 1. Create Test Users
    const reviewer = await prisma.user.create({
        data: {
            username: 'reviewer_' + Date.now(),
            email: 'reviewer_' + Date.now() + '@test.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'Reviewer',
            role: 'PASSENGER'
        }
    });
    console.log('Created Reviewer:', reviewer.id);

    const driver = await prisma.user.create({
        data: {
            username: 'driver_' + Date.now(),
            email: 'driver_' + Date.now() + '@test.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'Driver',
            role: 'DRIVER'
        }
    });
    console.log('Created Driver:', driver.id);

    // 2. Create Vehicle
    const vehicle = await prisma.vehicle.create({
        data: {
            userId: driver.id,
            vehicleModel: 'Toyota Camry',
            licensePlate: 'TEST-' + Date.now().toString().slice(-4),
            vehicleType: 'Sedan',
            color: 'Black',
            seatCapacity: 4
        }
    });
    console.log('Created Vehicle:', vehicle.id);

    // 3. Create Route (COMPLETED)
    const route = await prisma.route.create({
        data: {
            driverId: driver.id,
            vehicleId: vehicle.id,
            startLocation: { name: 'Start' },
            endLocation: { name: 'End' },
            departureTime: new Date(),
            availableSeats: 3,
            pricePerSeat: 100,
            status: 'COMPLETED'
        }
    });
    console.log('Created Route:', route.id);

    // 4. Create Booking (CONFIRMED)
    const booking = await prisma.booking.create({
        data: {
            routeId: route.id,
            passengerId: reviewer.id,
            numberOfSeats: 1,
            pickupLocation: { name: 'Pick' },
            dropoffLocation: { name: 'Drop' },
            status: 'CONFIRMED'
        }
    });
    console.log('Created Booking:', booking.id);

    try {
        // 5. Test Create Review
        console.log('Testing createReview...');
        const reviewData = {
            bookingId: booking.id,
            rating: 5,
            comment: 'Great trip!'
            // images: null // Test optional field
        };

        const review = await reviewService.createReview(reviewer.id, reviewData);
        console.log('Review Created:', review);

        if (review.rating !== 5 || review.comment !== 'Great trip!') {
            throw new Error('Review data mismatch');
        }

        // 6. Test Get Given Reviews
        console.log('Testing getGivenReviews...');
        const givenReviews = await reviewService.getGivenReviews(reviewer.id);
        console.log('Given Reviews:', givenReviews.length);
        if (givenReviews.length === 0) throw new Error('No given reviews found');

        // 7. Test Get Received Reviews
        console.log('Testing getReceivedReviews...');
        const receivedReviews = await reviewService.getReceivedReviews(driver.id);
        console.log('Received Reviews:', receivedReviews.length);
        if (receivedReviews.length === 0) throw new Error('No received reviews found');

        // 8. Test Get Review By Booking Id
        console.log('Testing getReviewByBookingId...');
        const bookingReview = await reviewService.getReviewByBookingId(booking.id);
        console.log('Booking Review found:', !!bookingReview);
        if (!bookingReview) throw new Error('Review by booking ID not found');

        // 9. Test Get Review By Route Id
        console.log('Testing getReviewByRouteId...');
        const routeReview = await reviewService.getReviewByRouteId(route.id, reviewer.id);
        console.log('Route Review found:', !!routeReview);
        if (!routeReview) throw new Error('Review by route ID not found');

        console.log('✅ ALL TESTS PASSED');

    } catch (error) {
        console.error('❌ TEST FAILED:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        await prisma.review.deleteMany({ where: { bookingId: booking.id } });
        await prisma.booking.delete({ where: { id: booking.id } });
        await prisma.route.delete({ where: { id: route.id } });
        await prisma.vehicle.delete({ where: { id: vehicle.id } });
        await prisma.user.delete({ where: { id: reviewer.id } });
        await prisma.user.delete({ where: { id: driver.id } });
        console.log('Cleanup complete');
        await prisma.$disconnect();
    }
}

main();
