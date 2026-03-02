/**
 * ============================================================
 * UAT TESTS — Review Feature (User Acceptance Testing)
 * ============================================================
 * Test Level  : UAT
 * File        : tests/backend/uat/review.uat.test.js
 * Purpose     : Test business flows from a passenger's perspective.
 *               Each test represents a real user scenario and
 *               validates the system outcome against acceptance
 *               criteria defined by stakeholders.
 * ============================================================
 */

// --------------- Mock External Dependencies ---------------

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

jest.mock('../../../src/backend/src/utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/painamnae/reviews/uploaded.jpg',
        public_id: 'painamnae/reviews/uploaded',
    }),
    deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

jest.mock('../../../src/backend/src/utils/jwt', () => ({
    verifyToken: jest.fn((token) => {
        if (token === 'passenger-token') {
            return { sub: 'passenger-001', role: 'PASSENGER' };
        }
        throw new Error('Invalid token');
    }),
    generateToken: jest.fn(),
}));

jest.mock('../../../src/backend/src/bootstrap/ensureAdmin', () => jest.fn().mockResolvedValue());

const request = require('supertest');

// --------------- Build Test App ---------------

let app;

beforeAll(() => {
    const express = require('express');
    const cors = require('cors');
    const routes = require('../../../src/backend/src/routes');
    const { errorHandler } = require('../../../src/backend/src/middlewares/errorHandler');
    const ApiError = require('../../../src/backend/src/utils/ApiError');

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', routes);
    app.use((req, res, next) => {
        next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
    });
    app.use(errorHandler);
});

// --------------- Shared Test Data ---------------

const PASSENGER_AUTH = 'Bearer passenger-token';

const completedTripBooking = {
    id: 'clbooking00000000000001',
    passengerId: 'passenger-001',
    status: 'CONFIRMED',
    route: {
        id: 'route-001',
        driverId: 'driver-001',
        status: 'COMPLETED',
        startLocation: { name: 'CentralWorld', lat: 13.7466, lng: 100.5391 },
        endLocation: { name: 'Siam Paragon', lat: 13.7462, lng: 100.5349 },
    },
    review: null,
};

// ==================== UAT SCENARIOS ====================

describe('Review Feature — UAT (Passenger Acceptance Tests)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // Scenario 1: Passenger completes a trip and submits
    //             a text-only review successfully
    // --------------------------------------------------
    describe('Scenario 1: Submit text-only review after completed trip', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has completed a trip
         * - When they submit a review with rating and comment
         * - Then the review is created successfully
         * - And the driver's average rating is updated
         * - And the response contains the review data
         */
        test('AC: Passenger can submit a text review for a completed trip', async () => {
            // Arrange: Trip is completed, no existing review
            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(completedTripBooking);
                mockReviewCreate.mockResolvedValue({
                    id: 'review-uat-001',
                    bookingId: completedTripBooking.id,
                    reviewerId: 'passenger-001',
                    revieweeId: 'driver-001',
                    rating: 5,
                    comment: 'The driver was very polite and drove safely. Highly recommended!',
                    images: null,
                    createdAt: new Date().toISOString(),
                });
                mockReviewAggregate.mockResolvedValue({ _avg: { rating: 5.0 }, _count: { rating: 1 } });
                mockUserUpdate.mockResolvedValue({});
                return callback(tx);
            });

            // Act: Passenger submits the review
            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', PASSENGER_AUTH)
                .field('bookingId', completedTripBooking.id)
                .field('rating', '5')
                .field('comment', 'The driver was very polite and drove safely. Highly recommended!');

            // Assert: Review is created and returned
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.rating).toBe(5);
            expect(res.body.data.comment).toBe('The driver was very polite and drove safely. Highly recommended!');
            expect(res.body.data.reviewerId).toBe('passenger-001');
            expect(res.body.data.revieweeId).toBe('driver-001');

            // Assert: Driver rating was updated
            expect(mockUserUpdate).toHaveBeenCalledWith({
                where: { id: 'driver-001' },
                data: { ratingAverage: 5.0, ratingCount: 1 },
            });
        });
    });

    // --------------------------------------------------
    // Scenario 2: Passenger submits a review with 2 photos
    // --------------------------------------------------
    describe('Scenario 2: Submit review with photo attachments', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has completed a trip
         * - When they submit a review with rating, comment, and 2 photos
         * - Then the review is created with uploaded image URLs
         * - And the photos are stored correctly
         */
        test('AC: Passenger can submit a review with 2 images', async () => {
            const { uploadToCloudinary } = require('../../../src/backend/src/utils/cloudinary');
            uploadToCloudinary
                .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/img1.jpg', public_id: 'img1' })
                .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/img2.jpg', public_id: 'img2' });

            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(completedTripBooking);
                mockReviewCreate.mockResolvedValue({
                    id: 'review-uat-002',
                    bookingId: completedTripBooking.id,
                    reviewerId: 'passenger-001',
                    revieweeId: 'driver-001',
                    rating: 4,
                    comment: 'Clean car, here are some photos',
                    images: ['https://res.cloudinary.com/demo/img1.jpg', 'https://res.cloudinary.com/demo/img2.jpg'],
                    createdAt: new Date().toISOString(),
                });
                mockReviewAggregate.mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 2 } });
                mockUserUpdate.mockResolvedValue({});
                return callback(tx);
            });

            const fakeImage = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                'base64'
            );

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', PASSENGER_AUTH)
                .field('bookingId', completedTripBooking.id)
                .field('rating', '4')
                .field('comment', 'Clean car, here are some photos')
                .attach('images', fakeImage, 'car-interior.png')
                .attach('images', fakeImage, 'car-exterior.png');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.images).toHaveLength(2);
            expect(res.body.data.images[0]).toContain('cloudinary.com');
        });
    });

    // --------------------------------------------------
    // Scenario 3: Passenger tries to review BEFORE trip
    //             is completed — system must reject
    // --------------------------------------------------
    describe('Scenario 3: Review rejected before trip completion', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger whose trip is still IN_TRANSIT
         * - When they try to submit a review
         * - Then the system rejects with a clear error message
         * - And no review is created
         */
        test('AC: System rejects review submission before trip completion', async () => {
            const inTransitBooking = {
                ...completedTripBooking,
                route: { ...completedTripBooking.route, status: 'IN_TRANSIT' },
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
                .set('Authorization', PASSENGER_AUTH)
                .field('bookingId', completedTripBooking.id)
                .field('rating', '5')
                .field('comment', 'Trying to review early');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Cannot review a trip that is not completed');

            // No review should have been created
            expect(mockReviewCreate).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------
    // Scenario 4: Passenger tries to submit a second
    //             review for the same trip — system rejects
    // --------------------------------------------------
    describe('Scenario 4: Duplicate review rejected', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has already reviewed a trip
         * - When they try to submit another review for the same trip
         * - Then the system rejects with "already reviewed" error
         * - And the original review remains unchanged
         */
        test('AC: System prevents submitting a second review for the same trip', async () => {
            const alreadyReviewedBooking = {
                ...completedTripBooking,
                review: {
                    id: 'existing-review-001',
                    rating: 5,
                    comment: 'Original review',
                },
            };

            mockTransaction.mockImplementation(async (callback) => {
                const tx = {
                    booking: { findUnique: mockBookingFindUnique },
                    review: { create: mockReviewCreate, aggregate: mockReviewAggregate },
                    user: { update: mockUserUpdate },
                };
                mockBookingFindUnique.mockResolvedValue(alreadyReviewedBooking);
                return callback(tx);
            });

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', PASSENGER_AUTH)
                .field('bookingId', completedTripBooking.id)
                .field('rating', '3')
                .field('comment', 'I want to change my review');

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('You have already reviewed this booking');

            // No new review should be created
            expect(mockReviewCreate).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------
    // Scenario 5: Passenger tries to upload 3 images
    //             — system rejects (max 2 allowed)
    // --------------------------------------------------
    describe('Scenario 5: Excess image uploads rejected', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger submitting a review
         * - When they attach more than 2 images
         * - Then the system rejects the upload
         *
         * NOTE: Multer's maxCount: 2 handles this at the middleware
         *       level, producing an error before the controller runs.
         */
        test('AC: System rejects review with more than 2 images', async () => {
            const fakeImage = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                'base64'
            );

            const res = await request(app)
                .post('/api/reviews')
                .set('Authorization', PASSENGER_AUTH)
                .field('bookingId', completedTripBooking.id)
                .field('rating', '5')
                .field('comment', 'Too many photos')
                .attach('images', fakeImage, 'photo1.png')
                .attach('images', fakeImage, 'photo2.png')
                .attach('images', fakeImage, 'photo3.png');

            // Multer should reject with an error (LIMIT_UNEXPECTED_FILE)
            // The response should indicate failure
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // Scenario 6: Unauthorized user tries to submit a review
    // --------------------------------------------------
    describe('Scenario 6: Unauthorized access rejected', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a user who is not logged in
         * - When they try to submit a review
         * - Then the system rejects with 401 Unauthorized
         */
        test('AC: System rejects review from unauthenticated user', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .field('bookingId', completedTripBooking.id)
                .field('rating', '5')
                .field('comment', 'I am not logged in');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // Scenario 7: Passenger views their submitted reviews
    // --------------------------------------------------
    describe('Scenario 7: Passenger views their review history', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has submitted reviews
         * - When they request their given reviews
         * - Then the system returns all their reviews with driver info
         */
        test('AC: Passenger can view all reviews they have given', async () => {
            mockReviewFindMany.mockResolvedValue([
                {
                    id: 'review-history-001',
                    rating: 5,
                    comment: 'Great driver!',
                    reviewee: { id: 'driver-001', firstName: 'John', lastName: 'D', username: 'johnd', profilePicture: null },
                    booking: { route: { startLocation: {}, endLocation: {}, departureTime: new Date() } },
                },
                {
                    id: 'review-history-002',
                    rating: 4,
                    comment: 'Good experience',
                    reviewee: { id: 'driver-002', firstName: 'Jane', lastName: 'D', username: 'janed', profilePicture: null },
                    booking: { route: { startLocation: {}, endLocation: {}, departureTime: new Date() } },
                },
            ]);

            const res = await request(app)
                .get('/api/reviews/given/passenger-001')
                .set('Authorization', PASSENGER_AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0].rating).toBe(5);
            expect(res.body.data[1].rating).toBe(4);
        });
    });
});
