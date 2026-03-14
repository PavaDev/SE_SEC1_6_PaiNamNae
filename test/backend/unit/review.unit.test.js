/**
 * ============================================================
 * UNIT TESTS — Review Feature
 * ============================================================
 * Test Level  : Unit
 * File        : tests/backend/unit/review.unit.test.js
 * Purpose     : Test review validation logic, image count
 *               validation, and one-review-per-trip rule
 *               in isolation with mocked dependencies.
 * ============================================================
 */

// --------------- Mock Prisma before requiring service ---------------
const mockPrismaTransaction = jest.fn();
const mockBookingFindUnique = jest.fn();
const mockReviewCreate = jest.fn();
const mockReviewAggregate = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $transaction: mockPrismaTransaction,
}));

const ApiError = require('../../../src/backend/src/utils/ApiError');
const reviewService = require('../../../src/backend/src/services/review.service');
const { createReviewSchema } = require('../../../src/backend/src/validations/review.validation');

// --------------- Test Data Factories ---------------

/**
 * Creates a mock booking object with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
const createMockBooking = (overrides = {}) => ({
    id: 'clxxxxxxxxxxxxxxxxx0001',
    passengerId: 'user-passenger-001',
    status: 'CONFIRMED',
    route: {
        id: 'route-001',
        driverId: 'user-driver-001',
        status: 'COMPLETED',
    },
    review: null,
    ...overrides,
});

const validReviewData = {
    bookingId: 'clxxxxxxxxxxxxxxxxx0001',
    rating: 5,
    comment: 'Great ride, very safe driver!',
    images: null,
};

const reviewerId = 'user-passenger-001';

// --------------- Helper: setup transaction mock ---------------

/**
 * Configures the $transaction mock so that it invokes the callback
 * with a fake Prisma "tx" object containing mocked model methods.
 */
const setupTransactionMock = (bookingData) => {
    mockPrismaTransaction.mockImplementation(async (callback) => {
        const tx = {
            booking: { findUnique: mockBookingFindUnique },
            review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
            user: { update: mockUserUpdate },
        };

        mockBookingFindUnique.mockResolvedValue(bookingData);

        mockReviewCreate.mockResolvedValue({
            id: 'review-001',
            bookingId: validReviewData.bookingId,
            reviewerId,
            revieweeId: bookingData?.route?.driverId || 'user-driver-001',
            rating: validReviewData.rating,
            comment: validReviewData.comment,
            images: validReviewData.images,
            createdAt: new Date(),
        });

        mockReviewAggregate.mockResolvedValue({
            _avg: { rating: 4.5 },
            _count: { rating: 10 },
        });

        mockUserUpdate.mockResolvedValue({});

        return callback(tx);
    });
};

// ==================== TEST SUITES ====================

describe('Review Feature — Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. Review Service — createReview
    // --------------------------------------------------
    describe('reviewService.createReview', () => {

        /**
         * TEST: Successfully creates a review for a completed trip
         * Scenario: Booking is CONFIRMED, route is COMPLETED,
         *           no existing review — happy path.
         */
        test('should create review successfully for a completed trip', async () => {
            const booking = createMockBooking();
            setupTransactionMock(booking);

            const result = await reviewService.createReview(reviewerId, validReviewData);

            expect(result).toBeDefined();
            expect(result.id).toBe('review-001');
            expect(result.bookingId).toBe(validReviewData.bookingId);
            expect(result.reviewerId).toBe(reviewerId);
            expect(result.revieweeId).toBe('user-driver-001');
            expect(result.rating).toBe(5);
            expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
        });

        /**
         * TEST: Rejects when booking is not found
         * Business Rule: Cannot review a non-existent booking.
         */
        test('should throw 404 when booking is not found', async () => {
            setupTransactionMock(null); // booking not found

            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toThrow('Booking not found');

            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        /**
         * TEST: Rejects when reviewer is not the booking's passenger
         * Business Rule: Only the passenger of a booking can review it.
         */
        test('should throw 403 when reviewer is not the passenger of the booking', async () => {
            const booking = createMockBooking({ passengerId: 'different-user' });
            setupTransactionMock(booking);

            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toThrow('You are not authorized to review this booking');

            // Reset and verify status code
            setupTransactionMock(booking);
            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toMatchObject({ statusCode: 403 });
        });

        /**
         * TEST: Rejects when booking status is not CONFIRMED
         * Business Rule: Only CONFIRMED bookings (that completed the trip)
         *                can be reviewed.
         */
        test('should throw 400 when booking is not CONFIRMED', async () => {
            const booking = createMockBooking({ status: 'PENDING' });
            setupTransactionMock(booking);

            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toThrow('Only confirmed bookings can be reviewed');

            setupTransactionMock(booking);
            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        /**
         * TEST: Rejects when route/trip is not COMPLETED
         * Business Rule: Review button is available only when
         *                trip status = "Completed".
         */
        test('should throw 400 when route is not COMPLETED', async () => {
            const booking = createMockBooking({
                route: { id: 'route-001', driverId: 'user-driver-001', status: 'IN_TRANSIT' },
            });
            setupTransactionMock(booking);

            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toThrow('Cannot review a trip that is not completed');

            setupTransactionMock(booking);
            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        /**
         * TEST: Rejects duplicate review for the same trip
         * Business Rule: A passenger can submit only ONE review per trip.
         */
        test('should throw 400 when review already exists for this booking', async () => {
            const booking = createMockBooking({
                review: { id: 'existing-review', rating: 4 },
            });
            setupTransactionMock(booking);

            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toThrow('You have already reviewed this booking');

            setupTransactionMock(booking);
            await expect(
                reviewService.createReview(reviewerId, validReviewData)
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        /**
         * TEST: Review with image URLs stores images correctly
         * Business Rule: Images are optional, max 2 allowed.
         */
        test('should create review with image URLs when provided', async () => {
            const booking = createMockBooking();
            const dataWithImages = {
                ...validReviewData,
                images: ['https://res.cloudinary.com/img1.jpg', 'https://res.cloudinary.com/img2.jpg'],
            };

            mockPrismaTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };

                mockBookingFindUnique.mockResolvedValue(booking);
                mockReviewCreate.mockResolvedValue({
                    id: 'review-002',
                    ...dataWithImages,
                    reviewerId,
                    revieweeId: 'user-driver-001',
                    createdAt: new Date(),
                });
                mockReviewAggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 10 } });
                mockUserUpdate.mockResolvedValue({});

                return callback(tx);
            });

            const result = await reviewService.createReview(reviewerId, dataWithImages);

            expect(result.images).toEqual(dataWithImages.images);
            expect(result.images).toHaveLength(2);
        });

        /**
         * TEST: Review without images defaults to null
         */
        test('should handle review creation with no images (defaults to null)', async () => {
            const booking = createMockBooking();
            const dataNoImages = { bookingId: validReviewData.bookingId, rating: 4, comment: 'Nice' };
            setupTransactionMock(booking);

            const result = await reviewService.createReview(reviewerId, dataNoImages);

            expect(result).toBeDefined();
            expect(result.images).toBeNull();
        });

        /**
         * TEST: Driver rating stats are updated after review creation
         * Business Rule: The driver's average rating and count must
         *                be recalculated after each new review.
         */
        test('should update driver rating stats after creating review', async () => {
            const booking = createMockBooking();
            setupTransactionMock(booking);

            await reviewService.createReview(reviewerId, validReviewData);

            // Verify aggregate was called for the driver
            expect(mockReviewAggregate).toHaveBeenCalledWith({
                where: { revieweeId: 'user-driver-001' },
                _avg: { rating: true },
                _count: { rating: true },
            });

            // Verify user update was called with new stats
            expect(mockUserUpdate).toHaveBeenCalledWith({
                where: { id: 'user-driver-001' },
                data: {
                    ratingAverage: 4.5,
                    ratingCount: 10,
                },
            });
        });
    });

    // --------------------------------------------------
    // 2. Zod Validation Schema — createReviewSchema
    // --------------------------------------------------
    describe('createReviewSchema (Zod Validation)', () => {

        /**
         * TEST: Valid review data passes validation
         */
        test('should accept valid review data', () => {
            const result = createReviewSchema.safeParse({
                bookingId: 'clxxxxxxxxxxxxxxxxx0001',
                rating: 5,
                comment: 'Excellent driver!',
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Rating below minimum (0) is rejected
         * Business Rule: Rating must be 1–5.
         */
        test('should reject rating below 1', () => {
            const result = createReviewSchema.safeParse({
                bookingId: 'clxxxxxxxxxxxxxxxxx0001',
                rating: 0,
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toContain('Rating must be at least 1');
        });

        /**
         * TEST: Rating above maximum (6) is rejected
         * Business Rule: Rating must be 1–5.
         */
        test('should reject rating above 5', () => {
            const result = createReviewSchema.safeParse({
                bookingId: 'clxxxxxxxxxxxxxxxxx0001',
                rating: 6,
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toContain('Rating must be at most 5');
        });

        /**
         * TEST: Non-integer rating is rejected
         */
        test('should reject non-integer rating', () => {
            const result = createReviewSchema.safeParse({
                bookingId: 'clxxxxxxxxxxxxxxxxx0001',
                rating: 3.5,
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Missing rating field is rejected
         */
        test('should reject missing rating field', () => {
            const result = createReviewSchema.safeParse({
                bookingId: 'clxxxxxxxxxxxxxxxxx0001',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Invalid bookingId format is rejected
         */
        test('should reject invalid bookingId format', () => {
            const result = createReviewSchema.safeParse({
                bookingId: 'not-a-valid-cuid',
                rating: 5,
            });

            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toContain('Invalid booking ID format');
        });

        /**
         * TEST: Missing bookingId is rejected
         */
        test('should reject missing bookingId', () => {
            const result = createReviewSchema.safeParse({
                rating: 5,
                comment: 'Nice trip',
            });

            expect(result.success).toBe(false);
        });

        /**
         * TEST: Comment is optional
         */
        test('should accept review without comment', () => {
            const result = createReviewSchema.safeParse({
                bookingId: 'clxxxxxxxxxxxxxxxxx0001',
                rating: 3,
            });

            expect(result.success).toBe(true);
        });

        /**
         * TEST: Images field is optional
         */
        test('should accept review without images', () => {
            const result = createReviewSchema.safeParse({
                bookingId: 'clxxxxxxxxxxxxxxxxx0001',
                rating: 4,
                comment: 'Good',
            });

            expect(result.success).toBe(true);
        });
    });
});
