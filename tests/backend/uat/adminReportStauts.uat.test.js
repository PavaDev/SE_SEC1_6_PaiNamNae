/**
 * ============================================================
 * UAT TESTS — Admin Report Status Update Feature
 * ============================================================
 * Task Name   : adminReportStauts
 * Test Level  : UAT (User Acceptance Testing)
 * File        : tests/backend/uat/adminReportStauts.uat.test.js
 * Purpose     : Validate end-to-end business flow:
 *               Admin logs in → views reports → updates report
 *               status → passenger sees updated status.
 *               Ensures behavior matches acceptance criteria.
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
        if (token === 'driver-token') {
            return { sub: 'driver-001', role: 'DRIVER' };
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
const DRIVER_AUTH = 'Bearer driver-token';

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

describe('Admin Report Status Update — UAT (Acceptance Tests)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------
    // Scenario 1: Admin views all submitted reports
    // --------------------------------------------------
    describe('Scenario 1: Admin views all submitted passenger reports', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin user who is logged in
         * - When they access the admin reports dashboard
         * - Then the system shows all submitted passenger reports
         * - And each report shows its current status
         */
        test('AC: Admin can view all submitted reports with current statuses', async () => {
            // Arrange: Multiple reports exist with different statuses
            const reports = [
                createMockApiReport({ id: 'r-001', status: 'PENDING' }),
                createMockApiReport({ id: 'r-002', status: 'APPROVED' }),
                createMockApiReport({ id: 'r-003', status: 'RESOLVED' }),
            ];
            mockReportFindMany.mockResolvedValue(reports);
            mockReportCount.mockResolvedValue(3);

            // Act: Admin views the reports list
            const res = await request(app)
                .get('/api/reports/admin')
                .set('Authorization', ADMIN_AUTH);

            // Assert: All reports are visible with statuses
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(3);
        });
    });

    // --------------------------------------------------
    // Scenario 2: Admin views a specific report detail
    // --------------------------------------------------
    describe('Scenario 2: Admin views a specific report in detail', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin reviewing a submitted report
         * - When they click on a specific report
         * - Then the system shows the full report details
         * - And the report includes passenger and driver information
         */
        test('AC: Admin can view full report details including related data', async () => {
            const detailedReport = createMockApiReport();
            mockReportFindUnique.mockResolvedValue(detailedReport);

            const res = await request(app)
                .get('/api/reports/admin/report-uat-001')
                .set('Authorization', ADMIN_AUTH);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe('report-uat-001');
            expect(res.body.data.reporter).toBeDefined();
            expect(res.body.data.reporter.firstName).toBe('Jane');
            expect(res.body.data.targetUser).toBeDefined();
            expect(res.body.data.targetUser.firstName).toBe('John');
            expect(res.body.data.status).toBe('PENDING');
        });
    });

    // --------------------------------------------------
    // Scenario 3: Admin updates report status and
    //             passenger sees the change
    // --------------------------------------------------
    describe('Scenario 3: Admin updates report status → passenger sees update', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin reviewing a submitted report
         * - When the admin updates the status to RESOLVED
         * - Then the report status is updated in the system
         * - And the passenger can see the updated status
         * - And the resolution includes admin notes and timestamp
         */
        test('AC: Admin resolves a report and passenger sees the resolution', async () => {
            // Step 1: Admin views the pending report
            const pendingReport = createMockApiReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const adminViewRes = await request(app)
                .get('/api/reports/admin/report-uat-001')
                .set('Authorization', ADMIN_AUTH);

            expect(adminViewRes.status).toBe(200);
            expect(adminViewRes.body.data.status).toBe('PENDING');

            // Step 2: Admin updates report status to RESOLVED
            const resolvedReport = createMockApiReport({
                status: 'RESOLVED',
                adminNotes: 'Investigated the complaint. Driver has been warned.',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
                resolvedBy: { id: 'admin-001', firstName: 'Admin', lastName: 'User' },
            });
            mockReportUpdate.mockResolvedValue(resolvedReport);

            const updateRes = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', ADMIN_AUTH)
                .send({
                    status: 'RESOLVED',
                    adminNotes: 'Investigated the complaint. Driver has been warned.',
                });

            expect(updateRes.status).toBe(200);
            expect(updateRes.body.success).toBe(true);
            expect(updateRes.body.data.status).toBe('RESOLVED');
            expect(updateRes.body.data.adminNotes).toContain('Driver has been warned');
            expect(updateRes.body.data.resolvedBy).toBeDefined();

            // Step 3: Passenger checks their report and sees the updated status
            mockReportFindMany.mockResolvedValue([resolvedReport]);

            const passengerRes = await request(app)
                .get('/api/reports/me')
                .set('Authorization', PASSENGER_AUTH);

            expect(passengerRes.status).toBe(200);
            expect(passengerRes.body.data).toHaveLength(1);
            expect(passengerRes.body.data[0].status).toBe('RESOLVED');
            expect(passengerRes.body.data[0].resolvedBy).toBeDefined();
            expect(passengerRes.body.data[0].adminNotes).toContain('Driver has been warned');
        });
    });

    // --------------------------------------------------
    // Scenario 4: Admin approves a report and
    //             passenger verifies approval
    // --------------------------------------------------
    describe('Scenario 4: Admin approves report → passenger sees approval', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin who reviewed a report's evidence
         * - When the admin approves the report
         * - Then the status changes to APPROVED
         * - And the passenger sees the approval when checking their reports
         */
        test('AC: Admin approves a report and passenger sees approval status', async () => {
            // Admin updates status to APPROVED
            const pendingReport = createMockApiReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const approvedReport = createMockApiReport({
                status: 'APPROVED',
                adminNotes: 'Violation confirmed. Appropriate action taken.',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
                resolvedBy: { id: 'admin-001', firstName: 'Admin', lastName: 'User' },
            });
            mockReportUpdate.mockResolvedValue(approvedReport);

            const adminRes = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', ADMIN_AUTH)
                .send({
                    status: 'APPROVED',
                    adminNotes: 'Violation confirmed. Appropriate action taken.',
                });

            expect(adminRes.status).toBe(200);
            expect(adminRes.body.data.status).toBe('APPROVED');

            // Passenger checks their report
            mockReportFindMany.mockResolvedValue([approvedReport]);

            const passengerRes = await request(app)
                .get('/api/reports/me')
                .set('Authorization', PASSENGER_AUTH);

            expect(passengerRes.status).toBe(200);
            expect(passengerRes.body.data[0].status).toBe('APPROVED');
        });
    });

    // --------------------------------------------------
    // Scenario 5: Admin rejects a report — passenger
    //             sees rejection
    // --------------------------------------------------
    describe('Scenario 5: Admin rejects report → passenger sees rejection', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin who reviewed a report's evidence
         * - When the admin rejects the report due to insufficient evidence
         * - Then the status changes to REJECTED
         * - And the passenger sees the rejection with admin notes
         */
        test('AC: Admin rejects a report and passenger sees the rejection', async () => {
            const pendingReport = createMockApiReport({ status: 'PENDING' });
            mockReportFindUnique.mockResolvedValue(pendingReport);

            const rejectedReport = createMockApiReport({
                status: 'REJECTED',
                adminNotes: 'Insufficient evidence to support the claim.',
                resolvedAt: new Date().toISOString(),
                resolvedById: 'admin-001',
            });
            mockReportUpdate.mockResolvedValue(rejectedReport);

            const adminRes = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', ADMIN_AUTH)
                .send({
                    status: 'REJECTED',
                    adminNotes: 'Insufficient evidence to support the claim.',
                });

            expect(adminRes.status).toBe(200);
            expect(adminRes.body.data.status).toBe('REJECTED');

            // Passenger sees the rejected status
            mockReportFindMany.mockResolvedValue([rejectedReport]);

            const passengerRes = await request(app)
                .get('/api/reports/me')
                .set('Authorization', PASSENGER_AUTH);

            expect(passengerRes.status).toBe(200);
            expect(passengerRes.body.data[0].status).toBe('REJECTED');
            expect(passengerRes.body.data[0].adminNotes).toContain('Insufficient evidence');
        });
    });

    // --------------------------------------------------
    // Scenario 6: Unauthorized user (passenger) tries
    //             to update report status — rejected
    // --------------------------------------------------
    describe('Scenario 6: Unauthorized user blocked from updating report status', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a passenger user who is logged in
         * - When they try to update a report status
         * - Then the system rejects with 403 Forbidden
         * Business Rule: Only admin users are allowed to update report status.
         */
        test('AC: Passenger is blocked from updating report status', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', PASSENGER_AUTH)
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a driver user who is logged in
         * - When they try to update a report status
         * - Then the system rejects with 403 Forbidden
         */
        test('AC: Driver is blocked from updating report status', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', DRIVER_AUTH)
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // Scenario 7: Admin tries to update non-existent
    //             report — error returned
    // --------------------------------------------------
    describe('Scenario 7: Admin updates non-existent report — rejected', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin attempting to update a report status
         * - When the report ID does not exist in the system
         * - Then the system returns a 404 error
         */
        test('AC: System rejects status update for non-existent report', async () => {
            mockReportFindUnique.mockResolvedValue(null);

            const res = await request(app)
                .patch('/api/reports/admin/nonexistent-report-id')
                .set('Authorization', ADMIN_AUTH)
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // Scenario 8: Admin provides invalid status value
    //             — validation error
    // --------------------------------------------------
    describe('Scenario 8: Admin provides invalid status — rejected', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given an admin updating a report status
         * - When an invalid status value is provided
         * - Then the system rejects with 400 Bad Request
         */
        test('AC: System rejects invalid status value from admin', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .set('Authorization', ADMIN_AUTH)
                .send({ status: 'IN_PROGRESS' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    // --------------------------------------------------
    // Scenario 9: Unauthenticated user tries to
    //             update report status — rejected
    // --------------------------------------------------
    describe('Scenario 9: Unauthenticated access rejected', () => {

        /**
         * ACCEPTANCE CRITERIA:
         * - Given a user who is not logged in
         * - When they try to update a report status
         * - Then the system rejects with 401 Unauthorized
         */
        test('AC: System rejects unauthenticated admin status update attempt', async () => {
            const res = await request(app)
                .patch('/api/reports/admin/report-uat-001')
                .send({ status: 'RESOLVED' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});
