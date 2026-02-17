/**
 * ============================================================
 * UAT TESTS — Report Feature (User Acceptance Testing)
 * ============================================================
 * Test Level  : UAT
 * User Story  : As a passenger, I want to report the driver's
 *               behavior to the administrator and receive
 *               updates about the reported case.
 * File        : tests/backend/uat/report.uat.test.js
 * Business Rules:
 *   - Passenger can only report after the trip has ended
 *   - Report button disappears after being pressed (one per booking)
 * ============================================================
 */

// --------------- Mock External Dependencies ---------------

const mockReportCreate = jest.fn();
const mockReportFindUnique = jest.fn();
const mockReportFindFirst = jest.fn();
const mockReportFindMany = jest.fn();
const mockReportUpdate = jest.fn();
const mockQueryRaw = jest.fn().mockResolvedValue([1]);

jest.mock('../../../src/backend/src/utils/prisma', () => ({
    $queryRaw: mockQueryRaw,
    report: {
        create: mockReportCreate,
        findUnique: mockReportFindUnique,
        findFirst: mockReportFindFirst,
        findMany: mockReportFindMany,
        update: mockReportUpdate,
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
         */
        test('AC: Passenger can submit a behavior report for a completed trip', async () => {
            const newReport = createMockApiReport();
            mockReportCreate.mockResolvedValue(newReport);

            const res = await request(app)
                .post('/api/reports')
                .set('Authorization', PASSENGER_AUTH)
                .field('type', 'DRIVER')
                .field('category', 'SAFETY_ISSUE')
                .field('description', 'The driver was using phone while driving on the expressway')
                .field('bookingId', 'booking-001')
                .field('routeId', 'route-001')
                .field('targetUserId', 'driver-001');

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
    // Scenario 2: Report button disappears after being
    //             pressed (one report per booking)
    // --------------------------------------------------
    describe('Scenario 2: Report button disappears after report submitted', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has already submitted a report for a booking
         * - When the system checks for an existing report
         * - Then hasReport is true (button disappears)
         * - And when no report exists, hasReport is false (button visible)
         */
        test('AC: Report button disappears after passenger already reported', async () => {
            // Step 1: Check before reporting — button should be visible
            mockReportFindFirst.mockResolvedValue(null);

            const beforeRes = await request(app)
                .get('/api/reports/booking/booking-001')
                .set('Authorization', PASSENGER_AUTH);

            expect(beforeRes.status).toBe(200);
            expect(beforeRes.body.hasReport).toBe(false);

            // Step 2: Check after reporting — button should disappear
            const existingReport = createMockApiReport();
            mockReportFindFirst.mockResolvedValue(existingReport);

            const afterRes = await request(app)
                .get('/api/reports/booking/booking-001')
                .set('Authorization', PASSENGER_AUTH);

            expect(afterRes.status).toBe(200);
            expect(afterRes.body.hasReport).toBe(true);
            expect(afterRes.body.data).toBeDefined();
        });
    });

    // --------------------------------------------------
    // Scenario 3: Passenger checks report status by
    //             viewing the route they reported
    // --------------------------------------------------
    describe('Scenario 3: Passenger checks report status on the reported route', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger who has submitted a report for a booking
         * - When they check on the route they reported
         * - Then the system shows the report info and current status
         */
        test('AC: Passenger sees report info and status when checking the reported route', async () => {
            const reportedCase = createMockApiReport({
                status: 'PENDING',
                bookingId: 'booking-001',
            });
            mockReportFindFirst.mockResolvedValue(reportedCase);

            const res = await request(app)
                .get('/api/reports/booking/booking-001')
                .set('Authorization', PASSENGER_AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.hasReport).toBe(true);
            expect(res.body.data.status).toBe('PENDING');
            expect(res.body.data.bookingId).toBe('booking-001');
            expect(res.body.data.description).toBeDefined();
        });
    });

    // --------------------------------------------------
    // Scenario 4: Admin resolves report and passenger
    //             sees the updated status
    // --------------------------------------------------
    describe('Scenario 4: Admin resolves report — passenger sees update', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin reviewing a submitted report
         * - When the admin updates the status to RESOLVED
         * - Then the passenger can see the updated status
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
});
