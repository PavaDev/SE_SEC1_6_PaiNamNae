/**
 * ============================================================
 * UAT TESTS — Report Feature (User Acceptance Testing)
 * ============================================================
 * Test Level  : UAT
 * File        : tests/backend/uat/report.uat.test.js
 * Purpose     : Test business flows from a passenger's perspective.
 *               Each test represents a real user scenario and
 *               validates the system outcome against acceptance
 *               criteria for reporting driver behavior and
 *               receiving case updates.
 * ============================================================
 */

// --------------- Mock External Dependencies ---------------

const mockReportCreate = jest.fn();
const mockReportFindUnique = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportUpdate = jest.fn();
const mockReportDelete = jest.fn();
const mockReportCount = jest.fn();
const mockQueryRaw = jest.fn().mockResolvedValue([1]);

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $queryRaw: mockQueryRaw,
    report: {
        create: mockReportCreate,
        findUnique: mockReportFindUnique,
        findFirst: mockReportFindFirst,
        findMany: mockReportFindMany,
        update: mockReportUpdate,
        delete: mockReportDelete,
        count: mockReportCount,
    },
}));

jest.mock('../../../src/backend/src/utils/cloudinary', () => ({
    uploadToCloudinary: jest.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/painamnae/reports/uploaded-evidence.jpg',
        public_id: 'painamnae/reports/uploaded-evidence',
    }),
    deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
}));

jest.mock('../../../src/backend/src/utils/jwt', () => ({
    verifyToken: jest.fn((token) => {
        if (token === 'passenger-token') {
            return { sub: 'passenger-001', role: 'PASSENGER' };
        }
        if (token === 'admin-token') {
            return { sub: 'admin-001', role: 'ADMIN' };
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
const ADMIN_AUTH = 'Bearer admin-token';

/**
 * Creates a full mock report as returned by the API.
 */
const createMockApiReport = (overrides = {}) => ({
    id: 'report-uat-001',
    reporterId: 'passenger-001',
    type: 'DRIVER',
    category: 'SAFETY_ISSUE',
    description: 'The driver was using phone while driving on the expressway',
    images: null,
    status: 'PENDING',
    adminNotes: null,
    routeId: 'route-001',
    bookingId: 'booking-001',
    targetUserId: 'driver-001',
    resolvedAt: null,
    resolvedById: null,
    createdAt: new Date().toISOString(),
    reporter: {
        id: 'passenger-001',
        firstName: 'Jane',
        lastName: 'Passenger',
        email: 'jane@example.com',
        profilePicture: null,
    },
    targetUser: {
        id: 'driver-001',
        firstName: 'John',
        lastName: 'Driver',
        email: 'john@example.com',
        profilePicture: null,
    },
    route: {
        id: 'route-001',
        startLocation: { name: 'CentralWorld', lat: 13.7466, lng: 100.5391 },
        endLocation: { name: 'Siam Paragon', lat: 13.7462, lng: 100.5349 },
        departureTime: new Date().toISOString(),
    },
    booking: {
        id: 'booking-001',
        status: 'CONFIRMED',
        numberOfSeats: 1,
    },
    resolvedBy: null,
    ...overrides,
});

// ==================== UAT SCENARIOS ====================

describe('Report Feature — UAT (Passenger Acceptance Tests)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // Scenario 1: Passenger completes a trip and submits
    //             a report about driver behavior
    // --------------------------------------------------
    describe('Scenario 1: Submit driver behavior report after completed trip', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has completed a trip
         * - When they submit a report about the driver's behavior
         * - Then the report is created with status PENDING
         * - And the report is linked to the correct booking and driver
         * - And the response contains the report data
         */
        test('AC: Passenger can submit a behavior report for a completed trip', async () => {
            // Arrange: No existing report for this booking
            const newReport = createMockApiReport();
            mockReportCreate.mockResolvedValue(newReport);

            // Act: Passenger submits the report
            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', PASSENGER_AUTH)
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'The driver was using phone while driving on the expressway')
                .field('bookingId', 'booking-001')
                .field('routeId', 'route-001')
                .field('targetUserId', 'driver-001');

            // Assert: Report is created and returned
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.type).toBe('DRIVER');
            expect(res.body.data.category).toBe('SAFETY_ISSUE');
            expect(res.body.data.status).toBe('PENDING');
            expect(res.body.data.reporterId).toBe('passenger-001');
            expect(res.body.data.targetUserId).toBe('driver-001');
            expect(res.body.data.bookingId).toBe('booking-001');
        });
    });

    // --------------------------------------------------
    // Scenario 2: Passenger submits a report with 2
    //             evidence photos
    // --------------------------------------------------
    describe('Scenario 2: Submit report with evidence photo attachments', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has completed a trip
         * - When they submit a report with 2 evidence images
         * - Then the report is created with uploaded image URLs
         * - And the photos are stored correctly in Cloudinary
         */
        test('AC: Passenger can submit a report with 2 evidence images', async () => {
            const { uploadToCloudinary } = require('../../../src/backend/src/utils/cloudinary');
            uploadToCloudinary
                .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/evidence1.jpg', public_id: 'evidence1' })
                .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/demo/evidence2.jpg', public_id: 'evidence2' });

            const reportWithImages = createMockApiReport({
                id: 'report-uat-002',
                images: [
                    'https://res.cloudinary.com/demo/evidence1.jpg',
                    'https://res.cloudinary.com/demo/evidence2.jpg',
                ],
            });
            mockReportCreate.mockResolvedValue(reportWithImages);

            const fakeImage = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                'base64'
            );

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', PASSENGER_AUTH)
                .field('type', 'DRIVER')
                .field('category', 'VEHICLE_ISSUE')
                .field('description', 'The car had broken side mirror and damaged seats')
                .field('bookingId', 'booking-001')
                .attach('images', fakeImage, 'mirror-damage.png')
                .attach('images', fakeImage, 'seat-damage.png');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.images).toHaveLength(2);
            expect(res.body.data.images[0]).toContain('cloudinary.com');
        });
    });

    // --------------------------------------------------
    // Scenario 3: Passenger checks their submitted report
    //             status (Submitted → In Review → Resolved)
    // --------------------------------------------------
    describe('Scenario 3: Passenger checks report status updates', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has submitted a report
         * - When they check their report status
         * - Then the system shows the current status (PENDING/APPROVED/RESOLVED)
         * - And only their own reports are visible
         */
        test('AC: Passenger can view their submitted reports and status', async () => {
            // Arrange: Passenger has submitted reports with different statuses
            mockReportFindMany.mockResolvedValue([
                createMockApiReport({ id: 'report-1', status: 'PENDING' }),
                createMockApiReport({ id: 'report-2', status: 'RESOLVED', resolvedAt: new Date().toISOString() }),
            ]);

            // Act: Passenger checks their reports
            const res = await request(app)
                .get('/api/reports/me')
                .set('Authorization', PASSENGER_AUTH);

            // Assert: Returns only their reports with current statuses
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0].status).toBe('PENDING');
            expect(res.body.data[1].status).toBe('RESOLVED');
        });

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger checking a specific report
         * - When they query by booking ID
         * - Then the system returns the report status for that booking
         */
        test('AC: Passenger can check report status for a specific booking', async () => {
            const submittedReport = createMockApiReport({ status: 'PENDING' });
            mockReportFindFirst.mockResolvedValue(submittedReport);

            const res = await request(app)
                .get('/api/reports/booking/booking-001')
                .set('Authorization', PASSENGER_AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.hasReport).toBe(true);
            expect(res.body.data.status).toBe('PENDING');
        });
    });

    // --------------------------------------------------
    // Scenario 4: Passenger tries to upload 3 images
    //             — system rejects (max 2 allowed)
    // --------------------------------------------------
    describe('Scenario 4: Excess evidence image uploads rejected', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger submitting a report
         * - When they attach more than 2 evidence images
         * - Then the system rejects the upload
         *
         * NOTE: Multer's maxCount: 2 handles this at the middleware
         *       level, producing an error before the controller runs.
         */
        test('AC: System rejects report with more than 2 evidence images', async () => {
            const fakeImage = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                'base64'
            );

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', PASSENGER_AUTH)
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'Too many evidence photos attached to this report')
                .attach('images', fakeImage, 'photo1.png')
                .attach('images', fakeImage, 'photo2.png')
                .attach('images', fakeImage, 'photo3.png');

            // Multer should reject with LIMIT_UNEXPECTED_FILE
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // Scenario 5: Unauthorized user tries to submit a report
    // --------------------------------------------------
    describe('Scenario 5: Unauthorized access rejected', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a user who is not logged in
         * - When they try to submit a report
         * - Then the system rejects with 401 Unauthorized
         */
        test('AC: System rejects report from unauthenticated user', async () => {
            const res = await request(app)
                .post('/api/reports')
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'I am not logged in but trying to report');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // Scenario 6: Admin updates report status and
    //             passenger sees the updated status
    // --------------------------------------------------
    describe('Scenario 6: Admin resolves report — passenger sees update', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin reviewing a submitted report
         * - When the admin updates the status to RESOLVED
         * - Then the report status is updated in the database
         * - And the passenger can see the updated status
         */
        test('AC: Admin resolves a report and passenger can see the resolution', async () => {
            // Step 1: Admin updates report status to RESOLVED
            const pendingReport = createMockApiReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const resolvedReport = createMockApiReport({
                status: 'RESOLVED',
                adminNotes: 'Investigated the complaint. Driver has been warned.',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
                resolvedBy: { id: 'admin-001', firstName: 'Admin', lastName: 'User' },
            });
            mockReportUpdate.mockResolvedValue(resolvedReport);

            const adminRes = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', ADMIN_AUTH)
                .send({
                    status: 'RESOLVED',
                    adminNotes: 'Investigated the complaint. Driver has been warned.',
                });

            expect(adminRes.status).toBe(200);
            expect(adminRes.body.success).toBe(true);
            expect(adminRes.body.data.status).toBe('RESOLVED');
            expect(adminRes.body.data.adminNotes).toContain('Driver has been warned');

            // Step 2: Passenger checks their report and sees the updated status
            mockReportFindMany.mockResolvedValue([resolvedReport]);

            const passengerRes = await request(app)
                .get('/api/reports/me')
                .set('Authorization', PASSENGER_AUTH);

            expect(passengerRes.status).toBe(200);
            expect(passengerRes.body.data).toHaveLength(1);
            expect(passengerRes.body.data[0].status).toBe('RESOLVED');
            expect(passengerRes.body.data[0].resolvedBy).toBeDefined();
        });
    });

    // --------------------------------------------------
    // Scenario 7: Passenger checks report for a booking
    //             that has no report yet
    // --------------------------------------------------
    describe('Scenario 7: No report exists for a booking', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger looking at a completed trip
         * - When they check if a report was already submitted
         * - Then the system returns hasReport: false
         * - And the report button should be available
         */
        test('AC: System correctly indicates no report exists for a booking', async () => {
            mockReportFindFirst.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/reports/booking/booking-no-report')
                .set('Authorization', PASSENGER_AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.hasReport).toBe(false);
            expect(res.body.data).toBeNull();
        });
    });
});
