/**
 * ============================================================
 * INTEGRATION TESTS — Review Feature
 * ============================================================
 * Test Level  : Integration
 * File        : tests/backend/integrate/review.integration.test.js
 * Purpose     : Test integration between review service, database
 *               (Prisma), and image storage. Verifies data
 *               persistence, relationships, and transaction
 *               integrity using mocked Prisma transactions
 *               that simulate real database behavior.
 * ============================================================
 */

// --------------- Mock Prisma ---------------
const mockBookingFindUnique = jest.fn();
const mockReviewCreate = jest.fn();
const mockReviewAggregate = jest.fn();
const mockReviewFindMany = jest.fn();
const mockReviewFindUnique = jest.fn();
const mockUserUpdate = jest.fn();
const mockTransaction = jest.fn();

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $transaction: mockTransaction,
    review: {
        findMany: mockReviewFindMany,
        findUnique: mockReviewFindUnique,
    },
}));

const reviewService = require('../../../src/backend/src/services/review.service');

// --------------- Test Data ---------------

const mockDriver = {
    id: 'driver-001',
    firstName: 'John',
    lastName: 'Driver',
    username: 'johndriver',
    ratingAverage: 0,
    ratingCount: 0,
};

const mockPassenger = {
    id: 'passenger-001',
    firstName: 'Jane',
    lastName: 'Passenger',
    username: 'janepassenger',
};

const mockRoute = {
    id: 'route-001',
    driverId: mockDriver.id,
    status: 'COMPLETED',
    startLocation: { lat: 13.7563, lng: 100.5018 },
    endLocation: { lat: 13.8, lng: 100.55 },
    departureTime: new Date('2026-02-15T08:00:00Z'),
};

const mockBooking = {
    id: 'clbooking00000000000001',
    routeId: mockRoute.id,
    passengerId: mockPassenger.id,
    status: 'CONFIRMED',
    route: mockRoute,
    review: null,
};

// ==================== TEST SUITES ====================

describe('Review Feature — Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. Service ↔ Database: Create Review Transaction
    // --------------------------------------------------
    describe('Create Review — Service ↔ Database Transaction', () => {

        /**
         * TEST: Full transaction flow creates review and updates driver rating
         * Integration: reviewService.createReview → Prisma $transaction
         *              → booking.findUnique → review.create
         *              → review.aggregate → user.update
         */
        test('should create review and update driver rating stats in a single transaction', async () => {
            const createdReview = {
                id: 'review-001',
                bookingId: mockBooking.id,
                reviewerId: mockPassenger.id,
                revieweeId: mockDriver.id,
                rating: 5,
                comment: 'Safe and friendly driver!',
                images: null,
                createdAt: new Date(),
            };

            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };

                mockBookingFindUnique.mockResolvedValue(mockBooking);
                mockReviewCreate.mockResolvedValue(createdReview);
                mockReviewAggregate.mockResolvedValue({
                    _avg: { rating: 5.0 },
                    _count: { rating: 1 },
                });
                mockUserUpdate.mockResolvedValue({
                    ...mockDriver,
                    ratingAverage: 5.0,
                    ratingCount: 1,
                });

                return callback(tx);
            });

            const result = await reviewService.createReview(mockPassenger.id, {
                bookingId: mockBooking.id,
                rating: 5,
                comment: 'Safe and friendly driver!',
            });

            // Verify review was created with correct relationships
            expect(result.id).toBe('review-001');
            expect(result.bookingId).toBe(mockBooking.id);
            expect(result.reviewerId).toBe(mockPassenger.id);
            expect(result.revieweeId).toBe(mockDriver.id);

            // Verify the entire transaction was wrapped
            expect(mockTransaction).toHaveBeenCalledTimes(1);

            // Verify booking lookup included route and review relations
            expect(mockBookingFindUnique).toHaveBeenCalledWith({
                where: { id: mockBooking.id },
                include: { route: true, review: true },
            });

            // Verify review.create was called with correct data
            expect(mockReviewCreate).toHaveBeenCalledWith({
                data: {
                    bookingId: mockBooking.id,
                    reviewerId: mockPassenger.id,
                    revieweeId: mockDriver.id,
                    rating: 5,
                    comment: 'Safe and friendly driver!',
                    images: null,
                },
            });

            // Verify driver rating aggregation was computed
            expect(mockReviewAggregate).toHaveBeenCalledWith({
                where: { revieweeId: mockDriver.id },
                _avg: { rating: true },
                _count: { rating: true },
            });

            // Verify driver's rating stats were updated
            expect(mockUserUpdate).toHaveBeenCalledWith({
                where: { id: mockDriver.id },
                data: { ratingAverage: 5.0, ratingCount: 1 },
            });
        });

        /**
         * TEST: Review is correctly linked to booking, passenger, and driver
         * Integration: Verifies the foreign key relationships are set correctly.
         */
        test('should establish correct relationships between review, booking, passenger, and driver', async () => {
            const createdReview = {
                id: 'review-002',
                bookingId: mockBooking.id,
                reviewerId: mockPassenger.id,
                revieweeId: mockDriver.id,
                rating: 4,
                comment: 'Good trip',
                images: null,
                createdAt: new Date(),
            };

            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(mockBooking);
                mockReviewCreate.mockResolvedValue(createdReview);
                mockReviewAggregate.mockResolvedValue({ _avg: { rating: 4.0 }, _count: { rating: 1 } });
                mockUserUpdate.mockResolvedValue({});
                return callback(tx);
            });

            const result = await reviewService.createReview(mockPassenger.id, {
                bookingId: mockBooking.id,
                rating: 4,
                comment: 'Good trip',
            });

            // Reviewer = passenger, Reviewee = driver of the route
            expect(result.reviewerId).toBe(mockPassenger.id);
            expect(result.revieweeId).toBe(mockDriver.id);
            expect(result.bookingId).toBe(mockBooking.id);
        });

        /**
         * TEST: Unique constraint on bookingId prevents duplicate reviews
         * Integration: The @unique constraint on bookingId in Prisma schema
         *              ensures only one review per booking exists.
         *              Here the service-level check catches it first.
         */
        test('should reject duplicate review for the same booking (one-review-per-trip)', async () => {
            const bookingWithReview = {
                ...mockBooking,
                review: {
                    id: 'existing-review-001',
                    rating: 5,
                    comment: 'Already reviewed',
                },
            };

            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(bookingWithReview);
                return callback(tx);
            });

            await expect(
                reviewService.createReview(mockPassenger.id, {
                    bookingId: mockBooking.id,
                    rating: 3,
                    comment: 'Second attempt',
                })
            ).rejects.toThrow('You have already reviewed this booking');

            // review.create should NOT have been called
            expect(mockReviewCreate).not.toHaveBeenCalled();
        });

        /**
         * TEST: Image URLs stored correctly in the JSON field
         * Integration: Images are stored as a JSON array in the
         *              review's `images` column.
         */
        test('should store image URL array correctly in JSON field', async () => {
            const imageUrls = [
                'https://res.cloudinary.com/demo/painamnae/reviews/img1.jpg',
                'https://res.cloudinary.com/demo/painamnae/reviews/img2.jpg',
            ];

            const createdReview = {
                id: 'review-003',
                bookingId: mockBooking.id,
                reviewerId: mockPassenger.id,
                revieweeId: mockDriver.id,
                rating: 5,
                comment: 'Amazing ride!',
                images: imageUrls,
                createdAt: new Date(),
            };

            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(mockBooking);
                mockReviewCreate.mockResolvedValue(createdReview);
                mockReviewAggregate.mockResolvedValue({ _avg: { rating: 5.0 }, _count: { rating: 1 } });
                mockUserUpdate.mockResolvedValue({});
                return callback(tx);
            });

            const result = await reviewService.createReview(mockPassenger.id, {
                bookingId: mockBooking.id,
                rating: 5,
                comment: 'Amazing ride!',
                images: imageUrls,
            });

            // Verify images are stored as an array
            expect(result.images).toEqual(imageUrls);
            expect(result.images).toHaveLength(2);
            expect(Array.isArray(result.images)).toBe(true);

            // Verify create was called with the image URLs
            expect(mockReviewCreate).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    images: imageUrls,
                }),
            });
        });
    });

    // --------------------------------------------------
    // 2. Service ↔ Database: Query Reviews
    // --------------------------------------------------
    describe('Query Reviews — Service ↔ Database', () => {

        /**
         * TEST: getGivenReviews retrieves reviews given by a user with relations
         * Integration: Verifies correct Prisma query with include for
         *              reviewee and booking.route.
         */
        test('should retrieve reviews given by a user with related data', async () => {
            const mockReviews = [
                {
                    id: 'review-010',
                    rating: 5,
                    comment: 'Great!',
                    reviewee: { id: mockDriver.id, firstName: 'John', lastName: 'Driver', username: 'johndriver', profilePicture: null },
                    booking: { route: { startLocation: {}, endLocation: {}, departureTime: new Date() } },
                },
            ];

            mockReviewFindMany.mockResolvedValue(mockReviews);

            const result = await reviewService.getGivenReviews(mockPassenger.id);

            expect(result).toHaveLength(1);
            expect(result[0].reviewee.id).toBe(mockDriver.id);
            expect(mockReviewFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { reviewerId: mockPassenger.id },
                    orderBy: { createdAt: 'desc' },
                })
            );
        });

        /**
         * TEST: getReceivedReviews retrieves reviews received by a driver
         */
        test('should retrieve reviews received by a driver with related data', async () => {
            const mockReviews = [
                {
                    id: 'review-020',
                    rating: 4,
                    comment: 'Good ride',
                    reviewer: { id: mockPassenger.id, firstName: 'Jane', lastName: 'Passenger', username: 'janepassenger', profilePicture: null },
                    booking: { route: { startLocation: {}, endLocation: {}, departureTime: new Date() } },
                },
            ];

            mockReviewFindMany.mockResolvedValue(mockReviews);

            const result = await reviewService.getReceivedReviews(mockDriver.id);

            expect(result).toHaveLength(1);
            expect(result[0].reviewer.id).toBe(mockPassenger.id);
            expect(mockReviewFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { revieweeId: mockDriver.id },
                    orderBy: { createdAt: 'desc' },
                })
            );
        });

        /**
         * TEST: getReviewByBookingId retrieves a single review by booking ID
         */
        test('should retrieve a review by booking ID', async () => {
            const mockReview = {
                id: 'review-030',
                bookingId: mockBooking.id,
                rating: 5,
                reviewer: { id: mockPassenger.id, firstName: 'Jane', lastName: 'Passenger', username: 'janepassenger', profilePicture: null },
            };

            mockReviewFindUnique.mockResolvedValue(mockReview);

            const result = await reviewService.getReviewByBookingId(mockBooking.id);

            expect(result).toBeDefined();
            expect(result.bookingId).toBe(mockBooking.id);
            expect(mockReviewFindUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { bookingId: mockBooking.id },
                })
            );
        });
    });
});
