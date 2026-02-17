/**
 * ============================================================
 * FUNCTIONAL TESTS — Review Feature
 * ============================================================
 * Test Level  : Functional
 * File        : tests/backend/functional/review.functional.test.js
 * Purpose     : Test review API behavior end-to-end via HTTP.
 *               Validates request/response structure, status codes,
 *               and error messages for both positive and negative
 *               scenarios using Supertest against the Express app.
 * ============================================================
 */

// --------------- Mock External Dependencies ---------------

// Mock Prisma
const mockBookingFindUnique = jest.fn();
const mockReviewCreate = jest.fn();
const mockReviewAggregate = jest.fn();
const mockReviewFindMany = jest.fn();
const mockReviewFindUnique = jest.fn();
const mockUserUpdate = jest.fn();
const mockTransaction = jest.fn();
const mockQueryRaw = jest.fn().mockResolvedValue([1]);

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $transaction: mockTransaction,
    $queryRaw: mockQueryRaw,
    review: {
        findMany: mockReviewFindMany,
        findUnique: mockReviewFindUnique,
    },
}));

// Mock Cloudinary
jest.mock('../../../src/backend/src/utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/painamnae/reviews/mock-image.jpg',
        public_id: 'painamnae/reviews/mock-image',
    }),
    deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

// Mock JWT verification
jest.mock('../../../src/backend/src/utils/jwt', () => ({
    verifyToken: jest.fn((token) => {
        if (token === 'valid-passenger-token') {
            return { sub: 'passenger-001', role: 'PASSENGER' };
        }
        if (token === 'valid-driver-token') {
            return { sub: 'driver-001', role: 'DRIVER' };
        }
        throw new Error('Invalid token');
    }),
    generateToken: jest.fn(),
}));

// Mock ensureAdmin bootstrap
jest.mock('../../../src/backend/src/bootstrap/ensureAdmin', () => jest.fn().mockResolvedValue());

const request = require('supertest');
const path = require('path');

// --------------- Build Express App (without starting the server) ---------------

let app;

beforeAll(() => {
    // Require server components to build the app without listening
    const express = require('express');
    const cors = require('cors');
    const routes = require('../../../src/backend/src/routes');
    const { errorHandler } = require('../../../src/backend/src/middlewares/errorHandler');
    const ApiError = require('../../../src/backend/src/utils/ApiError');

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', routes);

    // 404 handler
    app.use((req, res, next) => {
        next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
    });

    app.use(errorHandler);
});

// --------------- Test Data ---------------

const completedBooking = {
    id: 'clbooking00000000000001',
    passengerId: 'passenger-001',
    status: 'CONFIRMED',
    route: {
        id: 'route-001',
        driverId: 'driver-001',
        status: 'COMPLETED',
    },
    review: null,
};

const setupSuccessfulTransaction = (booking = completedBooking) => {
    mockTransaction.mockImplementation(async (callback) => {
        const tx = {
            booking: { findUnique: mockBookingFindUnique },
            review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
            user: { update: mockUserUpdate },
        };
        mockBookingFindUnique.mockResolvedValue(booking);
        mockReviewCreate.mockResolvedValue({
            id: 'review-func-001',
            bookingId: booking.id,
            reviewerId: 'passenger-001',
            revieweeId: booking.route.driverId,
            rating: 5,
            comment: 'Wonderful ride!',
            images: null,
            createdAt: new Date().toISOString(),
        });
        mockReviewAggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { rating: 1 } });
        mockUserUpdate.mockResolvedValue({});
        return callback(tx);
    });
};

// ==================== TEST SUITES ====================

describe('Review Feature — Functional Tests (API)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // 1. POST /api/reviews — Positive Scenarios
    // --------------------------------------------------
    describe('POST /api/reviews — Success Cases', () => {

        /**
         * TEST: Successfully create a review with valid data
         * Expected: 201 Created with { success: true, data: review }
         */
        test('should return 201 when creating a review with valid data', async () => {
            setupSuccessfulTransaction();

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '5')
                .field('comment', 'Wonderful ride!');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(res.body.data.id).toBe('review-func-001');
            expect(res.body.data.rating).toBe(5);
        });

        /**
         * TEST: Create a review with 2 image uploads
         * Expected: 201 Created with images uploaded to Cloudinary
         */
        test('should return 201 when creating a review with 2 images', async () => {
            // Setup transaction that returns review with images
            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(completedBooking);
                mockReviewCreate.mockResolvedValue({
                    id: 'review-func-002',
                    bookingId: completedBooking.id,
                    reviewerId: 'passenger-001',
                    revieweeId: 'driver-001',
                    rating: 4,
                    comment: 'Nice trip with photos',
                    images: [
                        'https://res.cloudinary.com/demo/painamnae/reviews/mock-image.jpg',
                        'https://res.cloudinary.com/demo/painamnae/reviews/mock-image.jpg',
                    ],
                    createdAt: new Date().toISOString(),
                });
                mockReviewAggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 2 } });
                mockUserUpdate.mockResolvedValue({});
                return callback(tx);
            });

            // Create a small 1x1 PNG buffer for testing
            const fakeImageBuffer = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                'base64'
            );

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '4')
                .field('comment', 'Nice trip with photos')
                .attach('images', fakeImageBuffer, 'photo1.png')
                .attach('images', fakeImageBuffer, 'photo2.png');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.images).toHaveLength(2);
        });

        /**
         * TEST: Create a review without optional comment
         */
        test('should return 201 when creating a review without comment', async () => {
            setupSuccessfulTransaction();

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '3');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        });
    });

    // --------------------------------------------------
    // 2. POST /api/reviews — Authentication Errors
    // --------------------------------------------------
    describe('POST /api/reviews — Authentication', () => {

        /**
         * TEST: Reject request without auth token
         * Expected: 401 Unauthorized
         */
        test('should return 401 when no auth token is provided', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .field('bookingId', completedBooking.id)
                .field('rating', '5');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Reject request with invalid auth token
         * Expected: 401 Unauthorized
         */
        test('should return 401 when an invalid token is provided', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer invalid-token-xyz')
                .field('bookingId', completedBooking.id)
                .field('rating', '5');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 3. POST /api/reviews — Validation Errors
    // --------------------------------------------------
    describe('POST /api/reviews — Validation Errors', () => {

        /**
         * TEST: Reject invalid bookingId format
         * Expected: 400 Bad Request with validation error message
         */
        test('should return 400 when bookingId is not a valid CUID', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', 'not-a-cuid')
                .field('rating', '5');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid booking ID format');
        });

        /**
         * TEST: Reject rating below minimum (0)
         * Expected: 400 Bad Request
         */
        test('should return 400 when rating is 0', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '0');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Reject rating above maximum (6)
         * Expected: 400 Bad Request
         */
        test('should return 400 when rating is 6', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '6');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        /**
         * TEST: Reject missing required rating field
         * Expected: 400 Bad Request
         */
        test('should return 400 when rating is missing', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 4. POST /api/reviews — Business Logic Errors
    // --------------------------------------------------
    describe('POST /api/reviews — Business Logic Errors', () => {

        /**
         * TEST: Reject review for a non-completed trip
         * Expected: 400 Bad Request
         */
        test('should return 400 when route is not COMPLETED', async () => {
            const inTransitBooking = {
                ...completedBooking,
                route: { ...completedBooking.route, status: 'IN_TRANSIT' },
            };

            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(inTransitBooking);
                return callback(tx);
            });

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '5')
                .field('comment', 'Too early');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Cannot review a trip that is not completed');
        });

        /**
         * TEST: Reject duplicate review for the same booking
         * Expected: 400 Bad Request
         */
        test('should return 400 when review already exists for this booking', async () => {
            const reviewedBooking = {
                ...completedBooking,
                review: { id: 'existing-review', rating: 4 },
            };

            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(reviewedBooking);
                return callback(tx);
            });

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '5')
                .field('comment', 'Trying again');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('You have already reviewed this booking');
        });

        /**
         * TEST: Reject review when booking is not found
         * Expected: 404 Not Found
         */
        test('should return 404 when booking does not exist', async () => {
            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(null);
                return callback(tx);
            });

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-passenger-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '5');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Booking not found');
        });

        /**
         * TEST: Reject review from a non-passenger user
         * Expected: 403 Forbidden
         */
        test('should return 403 when reviewer is not the passenger of the booking', async () => {
            // The driver-token resolves to sub: 'driver-001',
            // but the booking's passengerId is 'passenger-001'
            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(completedBooking);
                return callback(tx);
            });

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', 'Bearer valid-driver-token')
                .field('bookingId', completedBooking.id)
                .field('rating', '5');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // 5. GET /api/reviews/* — Read Endpoints
    // --------------------------------------------------
    describe('GET /api/reviews — Read Endpoints', () => {

        /**
         * TEST: Get reviews given by a user
         * Expected: 200 with array of reviews
         */
        test('GET /api/reviews/given/:userId should return 200 with reviews array', async () => {
            mockReviewFindMany.mockResolvedValue([
                { id: 'rev-1', rating: 5, comment: 'Great' },
                { id: 'rev-2', rating: 4, comment: 'Good' },
            ]);

            const res = await request(app)
                .get('/api/reviews/given/passenger-001')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data).toHaveLength(2);
        });

        /**
         * TEST: Get reviews received by a user
         * Expected: 200 with array of reviews
         */
        test('GET /api/reviews/received/:userId should return 200 with reviews array', async () => {
            mockReviewFindMany.mockResolvedValue([
                { id: 'rev-3', rating: 5, comment: 'Excellent' },
            ]);

            const res = await request(app)
                .get('/api/reviews/received/driver-001')
                .set('Authorization', 'Bearer valid-passenger-token');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
});
